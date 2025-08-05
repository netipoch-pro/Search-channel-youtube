const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Environment configuration
require('dotenv').config();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY';

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// YouTube API helper functions
class YouTubeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
  }

  async searchChannelByName(channelName) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          q: channelName,
          type: 'channel',
          maxResults: 1,
          key: this.apiKey
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].snippet.channelId;
      }
      return null;
    } catch (error) {
      console.error('Error searching channel by name:', error.message);
      throw new Error('ไม่สามารถค้นหาช่องได้');
    }
  }

  async searchVideos(params) {
    try {
      const searchParams = {
        part: 'snippet',
        type: 'video',
        key: this.apiKey,
        ...params
      };

      const response = await axios.get(`${this.baseURL}/search`, {
        params: searchParams
      });

      return response.data;
    } catch (error) {
      console.error('Error searching videos:', error.message);
      if (error.response?.status === 403) {
        throw new Error('API key ไม่ถูกต้องหรือเกินโควต้าการใช้งาน');
      } else if (error.response?.status === 400) {
        throw new Error('พารามิเตอร์การค้นหาไม่ถูกต้อง');
      }
      throw new Error('เกิดข้อผิดพลาดในการค้นหาวิดีโอ');
    }
  }

  async getVideoDetails(videoIds) {
    try {
      const response = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'contentDetails,statistics',
          id: videoIds.join(','),
          key: this.apiKey
        }
      });

      return response.data.items;
    } catch (error) {
      console.error('Error getting video details:', error.message);
      return [];
    }
  }
}

const youtubeAPI = new YouTubeAPI(YOUTUBE_API_KEY);

// Routes
app.post('/search', async (req, res) => {
  try {
    const {
      searchType,
      channelInput,
      keyword,
      maxResults = 10,
      order = 'relevance',
      publishedAfter,
      pageToken
    } = req.body;

    // Validate input
    if (!channelInput || !keyword) {
      return res.status(400).json({
        error: 'กรุณากรอกข้อมูลช่องและคีย์เวิร์ดให้ครบถ้วน'
      });
    }

    // Check API key
    if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
      return res.status(500).json({
        error: 'กรุณาตั้งค่า YouTube API key ในไฟล์ .env'
      });
    }

    let channelId = channelInput;

    // ถ้าเป็นการค้นหาด้วยชื่อช่อง ให้แปลงเป็น Channel ID ก่อน
    if (searchType === 'channelName') {
      console.log(`Searching for channel: ${channelInput}`);
      channelId = await youtubeAPI.searchChannelByName(channelInput);
      
      if (!channelId) {
        return res.status(404).json({
          error: `ไม่พบช่อง "${channelInput}" กรุณาตรวจสอบชื่อช่องอีกครั้ง`
        });
      }
      console.log(`Found channel ID: ${channelId}`);
    }

    // สร้างพารามิเตอร์สำหรับการค้นหา
    const searchParams = {
      q: keyword,
      channelId: channelId,
      maxResults: Math.min(parseInt(maxResults), 50), // จำกัดไม่เกิน 50
      order: order
    };

    // เพิ่มตัวกรองวันที่ถ้ามี
    if (publishedAfter) {
      searchParams.publishedAfter = new Date(publishedAfter).toISOString();
    }

    // เพิ่ม page token สำหรับ pagination
    if (pageToken) {
      searchParams.pageToken = pageToken;
    }

    console.log('Search parameters:', searchParams);

    // ค้นหาวิดีโอ
    const searchResults = await youtubeAPI.searchVideos(searchParams);

    if (!searchResults.items || searchResults.items.length === 0) {
      return res.json({
        items: [],
        pageInfo: { totalResults: 0 },
        message: 'ไม่พบวิดีโอที่ตรงกับเงื่อนไขการค้นหา'
      });
    }

    // ดึงข้อมูลเพิ่มเติมของวิดีโอ (duration, view count, etc.)
    const videoIds = searchResults.items.map(item => item.id.videoId);
    const videoDetails = await youtubeAPI.getVideoDetails(videoIds);

    // รวมข้อมูล
    const enhancedResults = searchResults.items.map(item => {
      const details = videoDetails.find(detail => detail.id === item.id.videoId);
      return {
        ...item,
        contentDetails: details?.contentDetails,
        statistics: details?.statistics
      };
    });

    // ส่งผลลัพธ์
    res.json({
      items: enhancedResults,
      nextPageToken: searchResults.nextPageToken,
      prevPageToken: searchResults.prevPageToken,
      pageInfo: searchResults.pageInfo,
      searchInfo: {
        channelId,
        channelName: channelInput,
        keyword,
        totalResults: searchResults.pageInfo.totalResults
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: error.message || 'เกิดข้อผิดพลาดในการค้นหา'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY'
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'YouTube Search API',
    version: '2.0.0',
    features: [
      'Search by channel name or ID',
      'Advanced filtering options',
      'Pagination support',
      'Video details integration'
    ],
    endpoints: {
      '/search': 'POST - Search for videos',
      '/health': 'GET - Health check',
      '/api/info': 'GET - API information'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'ไม่พบหน้าที่ต้องการ'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API info: http://localhost:${PORT}/api/info`);
  
  if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
    console.log('⚠️  Warning: Please set your YouTube API key in .env file');
    console.log('   Create .env file with: YOUTUBE_API_KEY=your_api_key_here');
  } else {
    console.log('✅ YouTube API key configured');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
