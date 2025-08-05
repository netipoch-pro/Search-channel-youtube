// YouTube API Key - ต้องเพิ่มจาก UI หรือ hardcode
let API_KEY = 'AIzaSyAoEKfwfjZAVh1NCdDVwn-k738oT6SRg7U'; // ⚠️ อย่าลืมใส่ API Key

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

// Check for API Key in localStorage
window.addEventListener('load', () => {
    const savedKey = localStorage.getItem('youtube_api_key');
    if (savedKey) {
        API_KEY = savedKey;
    } else {
        promptForAPIKey();
    }
});

function promptForAPIKey() {
    const key = prompt('กรุณาใส่ YouTube API Key ของคุณ:\n\nหากยังไม่มี ไปที่: https://console.cloud.google.com');
    if (key) {
        API_KEY = key;
        if (confirm('ต้องการบันทึก API Key ไว้ในเบราว์เซอร์หรือไม่?')) {
            localStorage.setItem('youtube_api_key', key);
        }
    }
}

async function handleSearch(e) {
    e.preventDefault();
    
    if (!API_KEY) {
        showError('กรุณาใส่ YouTube API Key ก่อน');
        promptForAPIKey();
        return;
    }
    
    // Get form values
    const searchType = document.getElementById('searchType').value;
    const channelInput = document.getElementById('channelInput').value;
    const keyword = document.getElementById('keyword').value;
    const maxResults = document.getElementById('maxResults').value;
    const order = document.getElementById('order').value;
    const publishedAfter = document.getElementById('publishedAfter').value;
    
    // Save search params
    currentSearchParams = {
        searchType,
        channelInput,
        keyword,
        maxResults,
        order,
        publishedAfter
    };
    
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
                throw new Error('ไม่พบช่องที่ค้นหา');
            }
            channelId = channelData.id;
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
            params.append('publishedAfter', new Date(currentSearchParams.publishedAfter).toISOString());
        }
        
        if (pageToken) {
            params.append('pageToken', pageToken);
        }
        
        // Make API request
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'เกิดข้อผิดพลาดในการค้นหา');
        }
        
        const data = await response.json();
        
        // Update pagination tokens
        nextPageToken = data.nextPageToken || '';
        prevPageToken = data.prevPageToken || '';
        
        // Display results
        displayResults(data.items);
        displayPagination();
        
        // Update results count
        resultsCountDiv.textContent = `พบ ${data.pageInfo.totalResults.toLocaleString()} วิดีโอ`;
        
        // Show results section
        resultsSection.style.display = 'block';
        
    } catch (error) {
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
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
        return null;
    }
    
    const data = await response.json();
    
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
            .replace(/&amp;/g, '&');
        
        return `
            <div class="video-card">
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="video-link">
                    <div class="video-thumbnail">
                        <img src="${snippet.thumbnails.medium.url}" alt="${title}">
                        <div class="video-duration">▶️</div>
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${title}</h3>
                        <p class="video-channel">${snippet.channelTitle}</p>
                        <p class="video-meta">
                            <span>📅 ${publishedDate}</span>
                        </p>
                        <p class="video-description">${snippet.description}</p>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}

function displayPagination() {
    let html = '';
    
    if (prevPageToken) {
        html += `<button onclick="searchVideos('${prevPageToken}')" class="pagination-btn">← หน้าก่อน</button>`;
    }
    
    if (nextPageToken) {
        html += `<button onclick="searchVideos('${nextPageToken}')" class="pagination-btn">หน้าถัดไป →</button>`;
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
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.style.display = 'block';
    resultsSection.style.display = 'none';
}

function hideError() {
    errorDiv.style.display = 'none';
}

// Add to window for pagination buttons
window.searchVideos = searchVideos;