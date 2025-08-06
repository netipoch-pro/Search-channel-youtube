const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Main search endpoint
app.post('/api/search', async (req, res) => {
    try {
        // Check if API key exists
        if (!process.env.YOUTUBE_API_KEY) {
            return res.status(500).json({ 
                error: 'YouTube API Key not configured. Please add YOUTUBE_API_KEY to .env file' 
            });
        }

        const { 
            searchType, 
            channelInput, 
            keyword, 
            maxResults, 
            order, 
            publishedAfter, 
            pageToken 
        } = req.body;

        console.log('Search request:', {
            channelInput,
            keyword,
            maxResults,
            order
        });

        // Build YouTube API parameters
        const params = {
            part: 'snippet',
            q: keyword,
            maxResults: maxResults || 10,
            order: order || 'relevance',
            type: 'video',
            key: process.env.YOUTUBE_API_KEY
        };

        // Add channel filter
        if (searchType === 'channelId') {
            params.channelId = channelInput;
        } else if (searchType === 'channelName') {
            // First, search for the channel
            const channelSearchParams = {
                part: 'snippet',
                q: channelInput,
                type: 'channel',
                maxResults: 1,
                key: process.env.YOUTUBE_API_KEY
            };

            try {
                const channelResponse = await axios.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    { params: channelSearchParams }
                );

                if (channelResponse.data.items && channelResponse.data.items.length > 0) {
                    params.channelId = channelResponse.data.items[0].id.channelId;
                } else {
                    return res.status(404).json({ error: 'Channel not found' });
                }
            } catch (channelError) {
                console.error('Channel search error:', channelError.response?.data || channelError.message);
                return res.status(500).json({ 
                    error: 'Failed to find channel: ' + (channelError.response?.data?.error?.message || channelError.message)
                });
            }
        }

        // Add optional parameters
        if (publishedAfter) {
            params.publishedAfter = new Date(publishedAfter).toISOString();
        }

        if (pageToken) {
            params.pageToken = pageToken;
        }

        // Make the API request to YouTube
        console.log('Searching YouTube with params:', params);
        
        const response = await axios.get(
            'https://www.googleapis.com/youtube/v3/search',
            { params }
        );

        console.log(`Found ${response.data.items.length} videos`);
        
        res.json(response.data);

    } catch (error) {
        console.error('Search error:', error.response?.data || error.message);
        
        // Handle specific YouTube API errors
        if (error.response?.status === 403) {
            res.status(403).json({ 
                error: 'YouTube API quota exceeded or API key invalid. Please check your API key and quota.' 
            });
        } else if (error.response?.status === 400) {
            res.status(400).json({ 
                error: 'Invalid request parameters: ' + (error.response?.data?.error?.message || 'Unknown error')
            });
        } else {
            res.status(500).json({ 
                error: error.response?.data?.error?.message || 'Server error occurred'
            });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        apiKeyConfigured: !!process.env.YOUTUBE_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// Test API key endpoint
app.get('/api/test', async (req, res) => {
    try {
        if (!process.env.YOUTUBE_API_KEY) {
            return res.status(500).json({ 
                error: 'YouTube API Key not configured',
                solution: 'Please add YOUTUBE_API_KEY to .env file'
            });
        }

        // Test the API key with a simple request
        const response = await axios.get(
            'https://www.googleapis.com/youtube/v3/search',
            {
                params: {
                    part: 'snippet',
                    q: 'test',
                    maxResults: 1,
                    key: process.env.YOUTUBE_API_KEY
                }
            }
        );

        res.json({ 
            status: 'OK',
            message: 'API Key is valid and working',
            quota: 'API quota is available'
        });

    } catch (error) {
        console.error('API test error:', error.response?.data || error.message);
        
        if (error.response?.status === 403) {
            res.status(403).json({ 
                error: 'API Key is invalid or quota exceeded',
                details: error.response?.data?.error?.message
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to test API',
                details: error.response?.data?.error?.message || error.message
            });
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ========================================
    🚀 Server is running!
    📍 URL: http://localhost:${PORT}
    📊 Health Check: http://localhost:${PORT}/health
    🔑 API Test: http://localhost:${PORT}/api/test
    ========================================
    `);
    
    if (!process.env.YOUTUBE_API_KEY) {
        console.warn('⚠️  WARNING: YouTube API Key not found in .env file!');
        console.warn('⚠️  Please add YOUTUBE_API_KEY=your_key_here to .env file');
    } else {
        console.log('✅ YouTube API Key is configured');
    }
});