// ⚠️ สำคัญ: ต้องใส่ YouTube API Key ของคุณเอง
const API_KEY = 'AIzaSyAoEKfwfjZAVh1NCdDVwn-k738oT6SRg7U'; // <-- แก้ไขตรงนี้

// 📌 กำหนด Channel ID ที่ต้องการค้นหาเฉพาะช่องนี้
const CHANNEL_ID = 'UCmi-SqNGuFt2Ie7YbqQ9cgQ'; // <-- ใส่ Channel ID ที่ต้องการตรงนี้

// ถ้าต้องการค้นหาหลายช่อง สามารถใช้ array
// const CHANNEL_IDS = [
//     'UCmi-SqNGuFt2Ie7YbqQ9cgQ',
//     'UC_x5XG1OV2P6uZZ5FSM9Ttw',
//     'UCYfdidRxbB8Qhf0Nx7ioOYw'
// ];

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

// Check configuration on load
window.addEventListener('load', () => {
    // Check API Key
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('⚠️ กรุณาแก้ไข API_KEY ในไฟล์ app.js ก่อนใช้งาน');
        
        const instructionDiv = document.createElement('div');
        instructionDiv.className = 'api-instructions';
        instructionDiv.innerHTML = `
            <h3>วิธีการตั้งค่า:</h3>
            <ol>
                <li><strong>API Key:</strong> ไปที่ <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a> → เปิด YouTube Data API v3 → สร้าง API Key</li>
                <li><strong>Channel ID:</strong> ไปที่ช่อง YouTube → About → Share channel → Copy channel ID</li>
                <li>แก้ไขทั้ง API_KEY และ CHANNEL_ID ในไฟล์ app.js</li>
            </ol>
        `;
        errorDiv.appendChild(instructionDiv);
    }
    
    // Show current channel info
    if (CHANNEL_ID && API_KEY !== 'YOUR_API_KEY_HERE') {
        getChannelInfo();
    }
});

async function getChannelInfo() {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?` +
            `part=snippet&id=${CHANNEL_ID}&key=${API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const channel = data.items[0].snippet;
                const channelInfoDiv = document.createElement('div');
                channelInfoDiv.className = 'channel-info';
                channelInfoDiv.innerHTML = `
                    <img src="${channel.thumbnails.default.url}" alt="${channel.title}">
                    <div>
                        <h3>กำลังค้นหาในช่อง: ${channel.title}</h3>
                        <p>${channel.description.substring(0, 100)}...</p>
                    </div>
                `;
                document.querySelector('.header').appendChild(channelInfoDiv);
            }
        }
    } catch (error) {
        console.error('Error fetching channel info:', error);
    }
}

async function handleSearch(e) {
    e.preventDefault();
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('กรุณาใส่ YouTube API Key ในไฟล์ app.js ก่อน');
        return;
    }
    
    if (!CHANNEL_ID) {
        showError('กรุณาใส่ Channel ID ในไฟล์ app.js ก่อน');
        return;
    }
    
    // Get form values
    const keyword = document.getElementById('keyword').value.trim();
    const maxResults = document.getElementById('maxResults').value;
    const order = document.getElementById('order').value;
    const publishedAfter = document.getElementById('publishedAfter').value;
    
    // Validation
    if (!keyword) {
        showError('กรุณากรอกคีย์เวิร์ดที่ต้องการค้นหา');
        return;
    }
    
    // Save search params
    currentSearchParams = {
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
        // Build search URL
        const params = new URLSearchParams({
            part: 'snippet',
            type: 'video',
            channelId: CHANNEL_ID, // ใช้ Channel ID ที่กำหนดไว้
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
        console.log('Searching videos in channel:', CHANNEL_ID);
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('API Error:', error);
            
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

// Add styles
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
    .channel-info {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-top: 20px;
        padding: 15px;
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        color: white;
    }
    .channel-info img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
    }
    .channel-info h3 {
        margin: 0 0 5px 0;
        font-size: 1.1em;
    }
    .channel-info p {
        margin: 0;
        font-size: 0.9em;
        opacity: 0.9;
    }
`;
document.head.appendChild(style);