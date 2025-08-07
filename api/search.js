// api/search.js - Vercel Serverless Function
const axios = require('axios');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            searchType, 
            channelInput, 
            keyword, 
            maxResults, 
            order, 
            publishedAfter, 
            pageToken 
        } = req.body;

        // Check if API key exists
        if (!process.env.YOUTUBE_API_KEY) {
            return res.status(500).json({ 
                error: 'YouTube API Key not configured' 
            });
        }

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
        
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Search error:', error.response?.data || error.message);
        
        if (error.response?.status === 403) {
            res.status(403).json({ 
                error: 'YouTube API quota exceeded or API key invalid' 
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
};