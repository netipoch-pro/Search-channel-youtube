// app.js - Updated with PAC Academic Center Channel ID

// Configuration
const CONFIG = {
    CHANNEL_ID: 'UCmi-SqNGuFt2le7YbqQ9cgQ', // PAC Academic Center Channel ID
    CHANNEL_NAME: 'PAC Academic Center',
    API_ENDPOINT: '/api/search'
};

let currentPageToken = '';
let nextPageToken = '';
let prevPageToken = '';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set channel name in UI if element exists
    const channelNameElement = document.querySelector('.channel-name');
    if (channelNameElement) {
        channelNameElement.textContent = CONFIG.CHANNEL_NAME;
    }

    // Setup form submission
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await searchVideos();
        });
    }

    // Set default date to today minus 1 year
    const publishedAfterInput = document.getElementById('publishedAfter');
    if (publishedAfterInput && !publishedAfterInput.value) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        publishedAfterInput.value = oneYearAgo.toISOString().split('T')[0];
    }
}

async function searchVideos(pageToken = '') {
    const keyword = document.getElementById('keyword').value;
    const maxResults = document.getElementById('maxResults').value;
    const order = document.getElementById('order').value;
    const publishedAfter = document.getElementById('publishedAfter').value;

    if (!keyword.trim()) {
        alert('กรุณากรอกคีย์เวิร์ดที่ต้องการค้นหา');
        return;
    }

    const resultsDiv = document.getElementById('results');
    showLoading(resultsDiv);

    try {
        const requestBody = {
            searchType: 'channelId',
            channelInput: CONFIG.CHANNEL_ID,
            keyword: keyword.trim(),
            maxResults: parseInt(maxResults),
            order: order,
            pageToken: pageToken
        };

        // Only add publishedAfter if it has a value
        if (publishedAfter) {
            requestBody.publishedAfter = publishedAfter;
        }

        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch videos');
        }

        const data = await response.json();
        
        // Store pagination tokens
        nextPageToken = data.nextPageToken || '';
        prevPageToken = data.prevPageToken || '';
        
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(resultsDiv, error.message);
    }
}

function showLoading(container) {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>กำลังค้นหาวิดีโอจากช่อง ${CONFIG.CHANNEL_NAME}...</p>
        </div>
    `;
}

function showError(container, message) {
    container.innerHTML = `
        <div class="error-message">
            <h3>⚠️ เกิดข้อผิดพลาด</h3>
            <p>${message}</p>
            <p class="error-hint">กรุณาตรวจสอบ:</p>
            <ul>
                <li>API Key ถูกต้องหรือไม่</li>
                <li>YouTube Data API v3 เปิดใช้งานแล้วหรือไม่</li>
                <li>โควต้า API ยังเหลืออยู่หรือไม่</li>
            </ul>
        </div>
    `;
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    
    if (!data.items || data.items.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <h3>🔍 ไม่พบวิดีโอ</h3>
                <p>ไม่พบวิดีโอที่ตรงกับคีย์เวิร์ด "${document.getElementById('keyword').value}"</p>
                <p>ในช่อง ${CONFIG.CHANNEL_NAME}</p>
                <p class="suggestion">ลองเปลี่ยนคีย์เวิร์ดหรือปรับตัวกรองการค้นหา</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="results-info">
            <div class="results-count">
                <span class="total">พบวิดีโอทั้งหมด: <strong>${formatNumber(data.pageInfo?.totalResults || data.items.length)}</strong> รายการ</span>
                <span class="showing">แสดง: <strong>${data.items.length}</strong> รายการ</span>
            </div>
            <div class="channel-info">
                <span>📺 ช่อง: ${CONFIG.CHANNEL_NAME}</span>
            </div>
        </div>
        <div class="video-grid">
    `;

    data.items.forEach((item, index) => {
        const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
        const thumbnail = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url;
        const title = escapeHtml(item.snippet.title);
        const description = escapeHtml(item.snippet.description);
        const channelTitle = escapeHtml(item.snippet.channelTitle);
        const publishedAt = formatDate(item.snippet.publishedAt);
        
        html += `
            <div class="video-card" data-video-id="${videoId}" onclick="openVideo('${videoId}')">
                <div class="video-thumbnail-wrapper">
                    <img src="${thumbnail}" alt="${title}" class="video-thumbnail" loading="lazy">
                    <div class="video-duration">▶️</div>
                </div>
                <div class="video-info">
                    <h3 class="video-title" title="${title}">${title}</h3>
                    <p class="video-description">${truncateText(description, 100)}</p>
                    <div class="video-channel">📺 ${channelTitle}</div>
                    <div class="video-meta">
                        <span class="video-date">📅 ${publishedAt}</span>
                        <span class="video-index">#${index + 1}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';

    // Add pagination controls
    if (nextPageToken || prevPageToken) {
        html += `
            <div class="pagination">
                <button class="page-btn ${!prevPageToken ? 'disabled' : ''}" 
                        onclick="searchVideos('${prevPageToken}')" 
                        ${!prevPageToken ? 'disabled' : ''}>
                    ← หน้าก่อน
                </button>
                <span class="page-info">หน้าปัจจุบัน</span>
                <button class="page-btn ${!nextPageToken ? 'disabled' : ''}" 
                        onclick="searchVideos('${nextPageToken}')" 
                        ${!nextPageToken ? 'disabled' : ''}>
                    หน้าถัดไป →
                </button>
            </div>
        `;
    }

    resultsDiv.innerHTML = html;
    
    // Smooth scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Utility Functions
function openVideo(videoId) {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('th-TH', options);
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        searchVideos,
        displayResults
    };
}