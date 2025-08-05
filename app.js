class YouTubeSearchApp {
  constructor() {
    this.currentPage = 1;
    this.totalResults = 0;
    this.resultsPerPage = 10;
    this.nextPageToken = null;
    this.prevPageToken = null;
    this.currentSearchParams = null;
    this.engagementStatus = new Map(); // เก็บสถานะการติดตามและไลค์
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.getElementById('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.performSearch();
    });

    // เปลี่ยนประเภทการค้นหา
    document.getElementById('searchType').addEventListener('change', (e) => {
      const channelInput = document.getElementById('channelInput');
      if (e.target.value === 'channelId') {
        channelInput.placeholder = 'กรอก Channel ID (เช่น: UCxxxxxxxxxxxxxxxxxxxxxx)';
      } else {
        channelInput.placeholder = 'กรอกชื่อช่อง (เช่น: PewDiePie)';
      }
    });
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  showError(message) {
    this.hideLoading();
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
  }

  showResults() {
    this.hideLoading();
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
  }

  async performSearch(pageToken = null) {
    this.showLoading();

    const searchParams = this.getSearchParameters();
    if (!searchParams) return;

    // เก็บพารามิเตอร์สำหรับ pagination
    if (!pageToken) {
      this.currentSearchParams = searchParams;
      this.currentPage = 1;
    }

    try {
      const requestBody = {
        ...searchParams,
        pageToken: pageToken
      };

      const response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการค้นหา');
      }

      if (!data.items || data.items.length === 0) {
        this.showError('ไม่พบวิดีโอที่ตรงกับเงื่อนไขการค้นหา');
        return;
      }

      this.displayResults(data);
      this.updatePagination(data);
      this.showResults();

    } catch (error) {
      console.error('Search error:', error);
      this.showError(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  }

  getSearchParameters() {
    const searchType = document.getElementById('searchType').value;
    const channelInput = document.getElementById('channelInput').value.trim();
    const keyword = document.getElementById('keyword').value.trim();
    const maxResults = parseInt(document.getElementById('maxResults').value);
    const order = document.getElementById('order').value;
    const publishedAfter = document.getElementById('publishedAfter').value;

    if (!channelInput || !keyword) {
      this.showError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return null;
    }

    this.resultsPerPage = maxResults;

    return {
      searchType,
      channelInput,
      keyword,
      maxResults,
      order,
      publishedAfter
    };
  }

  displayResults(data) {
    const resultsDiv = document.getElementById('results');
    const resultsCount = document.getElementById('resultsCount');
    
    // อัปเดตจำนวนผลลัพธ์
    this.totalResults = data.pageInfo?.totalResults || data.items.length;
    resultsCount.textContent = `พบ ${this.totalResults.toLocaleString()} วิดีโอ`;

    // เก็บ pagination tokens
    this.nextPageToken = data.nextPageToken;
    this.prevPageToken = data.prevPageToken;

    // สร้าง HTML สำหรับวิดีโอ
    resultsDiv.innerHTML = data.items.map(video => this.createVideoCard(video)).join('');
  }

  createVideoCard(video) {
    const snippet = video.snippet;
    const videoId = video.id.videoId || video.id;
    const channelId = snippet.channelId;
    
    // จัดรูปแบบวันที่
    const publishedDate = new Date(snippet.publishedAt).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // ใช้ thumbnail ที่มีคุณภาพสูงสุด
    const thumbnail = snippet.thumbnails.high || snippet.thumbnails.medium || snippet.thumbnails.default;
    
    // จำกัดความยาวของ description
    const description = snippet.description.length > 150
      ? snippet.description.substring(0, 150) + '...'
      : snippet.description;

    // ตรวจสอบสถานะการติดตามและไลค์
    const engagementKey = `${channelId}_${videoId}`;
    const engagement = this.engagementStatus.get(engagementKey) || { subscribed: false, liked: false };
    const canWatch = engagement.subscribed && engagement.liked;

    // สร้าง URL สำหรับดูวิดีโอ
    const watchUrl = canWatch
      ? `https://www.youtube.com/watch?v=${videoId}`
      : '#';

    return `
      <div class="video-card" data-video-id="${videoId}" data-channel-id="${channelId}">
        <div class="video-thumbnail">
          ${canWatch
            ? `<a href="${watchUrl}" target="_blank" class="video-link">
                <img src="${thumbnail.url}" alt="${snippet.title}" loading="lazy">
                <div class="play-overlay">
                  <div class="play-button">▶</div>
                </div>
              </a>`
            : `<div class="video-link-blocked" onclick="app.showEngagementModal('${videoId}', '${channelId}')">
                <img src="${thumbnail.url}" alt="${snippet.title}" loading="lazy">
                <div class="blocked-overlay">
                  <div class="lock-icon">🔒</div>
                  <div class="unlock-text">ติดตามและไลค์เพื่อดู</div>
                </div>
              </div>`
          }
        </div>
        <div class="video-content">
          <div class="video-title">
            ${canWatch
              ? `<a href="${watchUrl}" target="_blank">${this.escapeHtml(snippet.title)}</a>`
              : `<span class="blocked-title">${this.escapeHtml(snippet.title)}</span>`
            }
          </div>
          <div class="video-meta">
            <span class="video-date">${publishedDate}</span>
            <span class="video-channel">${this.escapeHtml(snippet.channelTitle)}</span>
          </div>
          <div class="video-description">
            ${this.escapeHtml(description)}
          </div>
          <div class="engagement-actions">
            <button class="subscribe-btn ${engagement.subscribed ? 'subscribed' : ''}"
                    onclick="app.toggleSubscription('${channelId}', '${videoId}')"
                    ${engagement.subscribed ? 'disabled' : ''}>
              ${engagement.subscribed ? '✓ ติดตามแล้ว' : '🔔 ติดตามช่อง'}
            </button>
            <button class="like-btn ${engagement.liked ? 'liked' : ''}"
                    onclick="app.toggleLike('${videoId}', '${channelId}')"
                    ${engagement.liked ? 'disabled' : ''}>
              ${engagement.liked ? '❤️ ไลค์แล้ว' : '👍 ไลค์วิดีโอ'}
            </button>
            ${canWatch
              ? `<a href="${watchUrl}" target="_blank" class="watch-btn">🎬 ดูวิดีโอ</a>`
              : `<button class="watch-btn-disabled" disabled>🔒 ต้องติดตามและไลค์ก่อน</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  updatePagination(data) {
    const paginationDiv = document.getElementById('pagination');
    
    if (!this.nextPageToken && !this.prevPageToken) {
      paginationDiv.innerHTML = '';
      return;
    }

    let paginationHTML = '';

    // ปุ่มหน้าก่อนหน้า
    if (this.prevPageToken) {
      paginationHTML += `
        <button onclick="app.goToPreviousPage()" class="pagination-btn">
          ← หน้าก่อนหน้า
        </button>
      `;
    }

    // แสดงหน้าปัจจุบัน
    paginationHTML += `
      <span class="current-page">หน้า ${this.currentPage}</span>
    `;

    // ปุ่มหน้าถัดไป
    if (this.nextPageToken) {
      paginationHTML += `
        <button onclick="app.goToNextPage()" class="pagination-btn">
          หน้าถัดไป →
        </button>
      `;
    }

    paginationDiv.innerHTML = paginationHTML;
  }

  goToNextPage() {
    if (this.nextPageToken) {
      this.currentPage++;
      this.performSearch(this.nextPageToken);
    }
  }

  goToPreviousPage() {
    if (this.prevPageToken) {
      this.currentPage--;
      this.performSearch(this.prevPageToken);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility function สำหรับจัดรูปแบบตัวเลข
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Utility function สำหรับจัดรูปแบบระยะเวลา
  formatDuration(duration) {
    // YouTube API ส่งมาในรูปแบบ ISO 8601 (PT4M13S)
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    let result = '';
    if (hours) result += hours + ':';
    if (minutes) result += minutes.padStart(2, '0') + ':';
    if (seconds) result += seconds.padStart(2, '0');

    return result;
  }

  // ฟังก์ชันสำหรับจัดการการติดตาม
  async toggleSubscription(channelId, videoId) {
    const engagementKey = `${channelId}_${videoId}`;
    const engagement = this.engagementStatus.get(engagementKey) || { subscribed: false, liked: false };
    
    // อัปเดตสถานะ
    engagement.subscribed = true;
    this.engagementStatus.set(engagementKey, engagement);
    
    // อัปเดต UI
    this.updateVideoCardUI(videoId, channelId);
    
    // บันทึกลงฐานข้อมูล (จะเพิ่มในภายหลัง)
    await this.saveEngagementStatus(channelId, videoId, 'subscribe');
    
    // แสดงข้อความแจ้งเตือน
    this.showNotification('✅ ติดตามช่องเรียบร้อยแล้ว!', 'success');
  }

  // ฟังก์ชันสำหรับจัดการการไลค์
  async toggleLike(videoId, channelId) {
    const engagementKey = `${channelId}_${videoId}`;
    const engagement = this.engagementStatus.get(engagementKey) || { subscribed: false, liked: false };
    
    // อัปเดตสถานะ
    engagement.liked = true;
    this.engagementStatus.set(engagementKey, engagement);
    
    // อัปเดต UI
    this.updateVideoCardUI(videoId, channelId);
    
    // บันทึกลงฐานข้อมูล (จะเพิ่มในภายหลัง)
    await this.saveEngagementStatus(channelId, videoId, 'like');
    
    // แสดงข้อความแจ้งเตือน
    this.showNotification('❤️ ไลค์วิดีโอเรียบร้อยแล้ว!', 'success');
  }

  // อัปเดต UI ของ video card
  updateVideoCardUI(videoId, channelId) {
    const videoCard = document.querySelector(`[data-video-id="${videoId}"]`);
    if (!videoCard) return;

    const engagementKey = `${channelId}_${videoId}`;
    const engagement = this.engagementStatus.get(engagementKey);
    const canWatch = engagement.subscribed && engagement.liked;

    // อัปเดตปุ่มติดตาม
    const subscribeBtn = videoCard.querySelector('.subscribe-btn');
    if (subscribeBtn && engagement.subscribed) {
      subscribeBtn.textContent = '✓ ติดตามแล้ว';
      subscribeBtn.classList.add('subscribed');
      subscribeBtn.disabled = true;
    }

    // อัปเดตปุ่มไลค์
    const likeBtn = videoCard.querySelector('.like-btn');
    if (likeBtn && engagement.liked) {
      likeBtn.textContent = '❤️ ไลค์แล้ว';
      likeBtn.classList.add('liked');
      likeBtn.disabled = true;
    }

    // อัปเดตปุ่มดูวิดีโอ
    if (canWatch) {
      const watchBtnDisabled = videoCard.querySelector('.watch-btn-disabled');
      if (watchBtnDisabled) {
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        watchBtnDisabled.outerHTML = `<a href="${watchUrl}" target="_blank" class="watch-btn">🎬 ดูวิดีโอ</a>`;
      }

      // อัปเดต thumbnail
      const blockedThumbnail = videoCard.querySelector('.video-link-blocked');
      if (blockedThumbnail) {
        const img = blockedThumbnail.querySelector('img');
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        blockedThumbnail.outerHTML = `
          <a href="${watchUrl}" target="_blank" class="video-link">
            ${img.outerHTML}
            <div class="play-overlay">
              <div class="play-button">▶</div>
            </div>
          </a>
        `;
      }

      // อัปเดต title
      const blockedTitle = videoCard.querySelector('.blocked-title');
      if (blockedTitle) {
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        blockedTitle.outerHTML = `<a href="${watchUrl}" target="_blank">${blockedTitle.textContent}</a>`;
      }
    }
  }

  // แสดง modal สำหรับแจ้งเตือน
  showEngagementModal(videoId, channelId) {
    const modal = document.createElement('div');
    modal.className = 'engagement-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔒 ต้องติดตามและไลค์ก่อนดูวิดีโอ</h3>
          <button class="close-modal" onclick="this.closest('.engagement-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <p>เพื่อดูวิดีโอนี้ กรุณา:</p>
          <div class="modal-actions">
            <button class="modal-subscribe-btn" onclick="app.toggleSubscription('${channelId}', '${videoId}'); this.closest('.engagement-modal').remove();">
              🔔 ติดตามช่อง
            </button>
            <button class="modal-like-btn" onclick="app.toggleLike('${videoId}', '${channelId}'); this.closest('.engagement-modal').remove();">
              👍 ไลค์วิดีโอ
            </button>
          </div>
          <p class="modal-note">หลังจากติดตามและไลค์แล้ว คุณจะสามารถดูวิดีโอได้ทันที</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // ปิด modal เมื่อคลิกพื้นหลัง
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // แสดงการแจ้งเตือน
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // แสดงการแจ้งเตือน
    setTimeout(() => notification.classList.add('show'), 100);
    
    // ซ่อนการแจ้งเตือนหลัง 3 วินาที
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // บันทึกสถานะการ engagement (จะเชื่อมต่อกับ backend ในภายหลัง)
  async saveEngagementStatus(channelId, videoId, action) {
    try {
      // ในอนาคตจะส่งไปยัง backend
      console.log(`Saving engagement: ${action} for video ${videoId} in channel ${channelId}`);
      
      // สำหรับตอนนี้เก็บใน localStorage
      const engagementData = JSON.parse(localStorage.getItem('engagementData') || '{}');
      const key = `${channelId}_${videoId}`;
      
      if (!engagementData[key]) {
        engagementData[key] = { subscribed: false, liked: false };
      }
      
      if (action === 'subscribe') {
        engagementData[key].subscribed = true;
      } else if (action === 'like') {
        engagementData[key].liked = true;
      }
      
      localStorage.setItem('engagementData', JSON.stringify(engagementData));
    } catch (error) {
      console.error('Error saving engagement status:', error);
    }
  }

  // โหลดสถานะการ engagement จาก localStorage
  loadEngagementStatus() {
    try {
      const engagementData = JSON.parse(localStorage.getItem('engagementData') || '{}');
      
      for (const [key, value] of Object.entries(engagementData)) {
        this.engagementStatus.set(key, value);
      }
    } catch (error) {
      console.error('Error loading engagement status:', error);
    }
  }
}

// เริ่มต้นแอปพลิเคชัน
const app = new YouTubeSearchApp();

// โหลดสถานะการ engagement เมื่อเริ่มต้น
app.loadEngagementStatus();

// เพิ่ม Service Worker สำหรับ PWA (ถ้าต้องการ)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  });
}
