# 🎬 PAC YouTube Search App

แอปพลิเคชันค้นหาวิดีโอ YouTube จากช่อง PAC Academic Center พร้อมระบบ PWA (Progressive Web App) ที่สามารถติดตั้งบนอุปกรณ์ได้

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

## ✨ Features

- 🔍 ค้นหาวิดีโอด้วยคีย์เวิร์ด
- 📺 ค้นหาเฉพาะในช่อง PAC Academic Center
- 📱 PWA - ติดตั้งเป็นแอปบนมือถือและคอมพิวเตอร์
- 🌐 ทำงานแบบ Offline ได้
- 📄 ระบบ Pagination
- 🎛️ ตัวกรองการค้นหา (วันที่, การเรียงลำดับ)
- 📱 Responsive Design
- 🎨 UI/UX ที่ทันสมัย

## 📋 Requirements

- Node.js 14.0.0 หรือสูงกว่า
- npm หรือ yarn
- YouTube Data API v3 Key

## 🚀 การติดตั้ง

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/pac-youtube-search.git
cd pac-youtube-search
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` เป็น `.env`:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` และใส่ YouTube API Key:

```
YOUTUBE_API_KEY=your_actual_api_key_here
```

### 4. รันแอปพลิเคชัน

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

## 🔑 การขอ YouTube API Key

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจคใหม่หรือเลือกโปรเจคที่มีอยู่
3. เปิดใช้งาน **YouTube Data API v3**
4. ไปที่ Credentials > Create Credentials > API Key
5. คัดลอก API Key มาใส่ในไฟล์ `.env`

## 📱 การติดตั้งเป็น PWA

### บนมือถือ (Android/iOS)

1. เปิดเว็บไซต์ในเบราว์เซอร์
2. **Android**: Chrome > Menu (⋮) > "Add to Home Screen"
3. **iOS**: Safari > Share > "Add to Home Screen"

### บนคอมพิวเตอร์ (Desktop)

1. เปิดเว็บไซต์ใน Chrome/Edge
2. คลิกไอคอน Install ในแถบ URL
3. หรือไปที่ Menu (⋮) > "Install PAC YouTube Search"

## 🏗️ โครงสร้างโปรเจค

```
pac-youtube-search/
├── public/                 # Frontend files
│   ├── index.html         # หน้าหลัก
│   ├── app.js            # JavaScript logic
│   ├── manifest.json     # PWA configuration
│   ├── service-worker.js # Service Worker
│   ├── offline.html      # Offline page
│   ├── icon-192.png     # App icon
│   └── icon-512.png     # App icon (large)
├── index.js              # Express server
├── package.json          # Dependencies
├── .env.example         # Environment template
├── .gitignore           # Git ignore file
└── README.md            # Documentation
```

## 🛠️ Scripts

```bash
# รันเซิร์ฟเวอร์
npm start

# รันแบบ development
npm run dev

# ทดสอบ API Key
npm run test

# Build Electron app (optional)
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

## 📊 API Endpoints

### POST `/api/search`

ค้นหาวิดีโอ YouTube

**Request Body:**
```json
{
  "searchType": "channelId",
  "channelInput": "UCmi-SqNGuFt2le7YbqQ9cgQ",
  "keyword": "tutorial",
  "maxResults": 10,
  "order": "relevance",
  "publishedAfter": "2024-01-01",
  "pageToken": "CAoQAA"
}
```

### GET `/health`

ตรวจสอบสถานะเซิร์ฟเวอร์

### GET `/api/test`

ทดสอบ API Key

## 🔧 การแก้ปัญหา

### "API key ไม่ถูกต้อง"
- ตรวจสอบ API key ในไฟล์ `.env`
- ตรวจสอบว่าเปิดใช้งาน YouTube Data API v3 แล้ว

### "ไม่พบช่อง"
- ตรวจสอบ Channel ID ให้ถูกต้อง
- Channel ID ปัจจุบัน: `UCmi-SqNGuFt2le7YbqQ9cgQ`

### "เกินโควต้า API"
- รอให้โควต้ารีเซ็ต (24 ชั่วโมง)
- หรือสร้าง API Key ใหม่

## 🤝 Contributing

1. Fork repository
2. สร้าง feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📄 License

โปรเจคนี้อยู่ภายใต้ MIT License - ดู [LICENSE](LICENSE) สำหรับรายละเอียด

## 👥 Team

- PAC Academic Center

## 📞 Contact

- Website: [PAC Academic Center](https://www.youtube.com/@UCmi-SqNGuFt2le7YbqQ9cgQ)
- GitHub: [@your-username](https://github.com/your-username)

## 🙏 Acknowledgments

- YouTube Data API v3
- Express.js
- Progressive Web App technology

---

Made with ❤️ by PAC Academic Center