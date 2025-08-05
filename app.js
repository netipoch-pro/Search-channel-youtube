// ⚠️ สำคัญ: ต้องใส่ YouTube API Key ของคุณเอง
const API_KEY = 'AIzaSyAoEKfwfjZAVh1NCdDVwn-k738oT6SRg7U'; // <-- แก้ไขตรงนี้

// 📌 กำหนด Channel ID ที่ต้องการค้นหาเฉพาะช่องนี้
const CHANNEL_ID = 'UCmi-SqNGuFt2Ie7YbqQ9cgQ'; // <-- ใส่ Channel ID ที่ต้องการตรงนี้

// Store pagination tokens
let nextPageToken = '';
let prevPageToken = '';
let currentSearchParams = {};

// DOM Elements
const searchForm = document.getElementById('searchForm');
const resultsSection = document.getElementById('resultsSection');
const resultsDiv = document.getElementById('results');
const paginationDiv = document.getElementById('pagination');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('errorMessage');
const resultsCountDiv = document.getElementById('resultsCount');

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

// Check API Key on load
window.addEventListener('load', () => {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('⚠️ กรุณาแก้ไข API_KEY ในไฟล์ app.js ก่อนใช้งาน');
        
        // แสดงวิธีการขอ API Key
        const instructionDiv = document.createElement('div');
        instructionDiv.className = 'api-instructions';
        instructionDiv.innerHTML = `
            <h3>วิธีการขอ YouTube API Key:</h3>
            <ol>
                <li>ไปที่ <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
                <li>สร้างโปรเจคใหม่หรือเลือกโปรเจคที่มีอยู่</li>
                <li>เปิดใช้งาน YouTube Data API v3</li>
                <li>ไปที่ Credentials และสร้าง API Key</li>
                <li>คัดลอก API Key มาใส่ในไฟล์ app.js แทนที่ YOUR_API_KEY_HERE</li>
            </ol>
        `;
        errorDiv.appendChild(instructionDiv);
    }
});

async function handleSearch(e) {
    e.preventDefault();
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('กรุณาใส่ YouTube API Key ในไฟล์ app.js ก่อน');
        return;
    }
    
    // Get form values
    const searchType = document.getElementById('searchType').value;
    const channelInput = document.getElementById('channelInput').value.trim();
    const keyword = document.getElementById('keyword').value.trim();
    const maxResults = document.getElementById('maxResults').value;
    const order = document.getElementById('order').value;
    const publishedAfter = document.getElementById('publishedAfter').value;
    
    // Validation
    if (!channelInput || !keyword) {
        showError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    
    // Save search params
    currentSearchParams = {
        searchType,
        channelInput,
        keyword,
        maxResults,
        order,
        publishedAfter
    };
    
    // Reset pagination
    nextPageToken = '';
    prevPageToken = '';
    
    // Search videos
    await searchVideos();
}

async function searchVideos(pageToken = '') {
    showLoading();
    hideError();
    
    try {
        let channelId = '';
        
        // Get channel ID
        if (currentSearchParams.searchType === 'channelId') {
            channelId = currentSearchParams.channelInput;
        } else {
            // Search for channel by name
            const channelData = await searchChannel(currentSearchParams.channelInput);
            if (!channelData) {
                throw new Error('ไม่พบช่องที่ค้นหา: ' + currentSearchParams.channelInput);
            }
            channelId = channelData.id;
            console.log('Found channel:', channelData.title, 'ID:', channelId);
        }
        
        // Build search URL
        const params = new URLSearchParams({
            part: 'snippet',
            type: 'video',
            channelId: channelId,
            q: currentSearchParams.keyword,
            maxResults: currentSearchParams.maxResults,
            order: currentSearchParams.order,
            key: API_KEY
        });
        
        if (currentSearchParams.publishedAfter) {
            const date = new Date(currentSearchParams.publishedAfter);
            params.append('publishedAfter', date.toISOString());
        }
        
        if (pageToken) {
            params.append('pageToken', pageToken);
        }
        
        // Make API request
        console.log('Searching videos with params:', params.toString());
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('API Error:', error);
            
            // จัดการ error ที่เจอบ่อย
            if (error.error?.code === 403) {
                throw new Error('API Key ไม่ถูกต้อง หรือไม่ได้เปิดใช้งาน YouTube Data API v3');
            } else if (error.error?.code === 400) {
                throw new Error('ข้อมูลไม่ถูกต้อง: ' + (error.error?.message || 'Unknown error'));
            } else {
                throw new Error(error.error?.message || 'เกิดข้อผิดพลาดในการค้นหา');
            }
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        
        // Update pagination tokens
        nextPageToken = data.nextPageToken || '';
        prevPageToken = data.prevPageToken || '';
        
        // Display results
        displayResults(data.items);
        displayPagination();
        
        // Update results count
        const totalResults = data.pageInfo?.totalResults || 0;
        resultsCountDiv.textContent = `พบ ${totalResults.toLocaleString()} วิดีโอ`;
        
        // Show results section
        resultsSection.style.display = 'block';
        
    } catch (error) {
        console.error('Search error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function searchChannel(channelName) {
    const params = new URLSearchParams({
        part: 'snippet',
        type: 'channel',
        q: channelName,
        maxResults: 1,
        key: API_KEY
    });
    
    console.log('Searching for channel:', channelName);
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
        console.error('Channel search failed');
        return null;
    }
    
    const data = await response.json();
    console.log('Channel search results:', data);
    
    if (data.items && data.items.length > 0) {
        return {
            id: data.items[0].id.channelId,
            title: data.items[0].snippet.title
        };
    }
    
    return null;
}

function displayResults(videos) {
    if (!videos || videos.length === 0) {
        resultsDiv.innerHTML = '<p class="no-results">ไม่พบวิดีโอที่ตรงกับการค้นหา</p>';
        return;
    }
    
    resultsDiv.innerHTML = videos.map(video => {
        const snippet = video.snippet;
        const videoId = video.id.videoId;
        const publishedDate = new Date(snippet.publishedAt).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Clean HTML entities in title
        const title = snippet.title
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        
        const description = (snippet.description || 'ไม่มีคำอธิบาย')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .substring(0, 150) + '...';
        
        return `
            <div class="video-card">
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="video-link">
                    <div class="video-thumbnail">
                        <img src="${snippet.thumbnails.medium.url}" 
                             alt="${title}" 
                             onerror="this.src='https://via.placeholder.com/320x180?text=No+Image'">
                        <div class="video-duration">▶️</div>
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${title}</h3>
                        <p class="video-channel">${snippet.channelTitle}</p>
                        <p class="video-meta">
                            <span>📅 ${publishedDate}</span>
                        </p>
                        <p class="video-description">${description}</p>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}

function displayPagination() {
    let html = '';
    
    if (prevPageToken) {
        html += `<button onclick="searchVideosPage('${prevPageToken}')" class="pagination-btn">← หน้าก่อน</button>`;
    }
    
    if (nextPageToken) {
        html += `<button onclick="searchVideosPage('${nextPageToken}')" class="pagination-btn">หน้าถัดไป →</button>`;
    }
    
    paginationDiv.innerHTML = html;
}

function showLoading() {
    loadingDiv.style.display = 'block';
    resultsSection.style.display = 'none';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

function showError(message) {
    errorDiv.innerHTML = `❌ ${message}`;
    errorDiv.style.display = 'block';
    resultsSection.style.display = 'none';
}

function hideError() {
    errorDiv.style.display = 'none';
}

// Global function for pagination
window.searchVideosPage = function(pageToken) {
    searchVideos(pageToken);
};

// Add styles for API instructions
const style = document.createElement('style');
style.textContent = `
    .api-instructions {
        margin-top: 20px;
        padding: 20px;
        background: #f0f0f0;
        border-radius: 8px;
        text-align: left;
    }
    .api-instructions h3 {
        margin-bottom: 10px;
        color: #333;
    }
    .api-instructions ol {
        margin-left: 20px;
    }
    .api-instructions li {
        margin: 5px 0;
    }
    .api-instructions a {
        color: #4285f4;
        text-decoration: none;
    }
    .api-instructions a:hover {
        text-decoration: underline;
    }
`;
document.head.appendChild(style);