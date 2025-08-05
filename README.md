# 🎬 YouTube Search Application

แอปพลิเคชันค้นหาวิดีโอ YouTube ขั้นสูงที่สามารถค้นหาวิดีโอในช่องต่างๆ ด้วยคีย์เวิร์ด พร้อมฟีเจอร์โซเชียลและการจัดการส่วนตัว

## ✨ ฟีเจอร์หลัก

### Phase 1: ระบบพื้นฐาน (เสร็จแล้ว)
- 🔍 ค้นหาวิดีโอด้วยคีย์เวิร์ด
- 📺 ค้นหาด้วยชื่อช่องหรือ Channel ID
- 📄 ระบบ Pagination
- 🎛️ ตัวกรองการค้นหา (วันที่, การเรียงลำดับ)
- 📱 Responsive Design
- 🎨 UI/UX ที่ทันสมัย

### Phase 2-5: ฟีเจอร์ขั้นสูง (กำลังพัฒนา)
- 👤 ระบบผู้ใช้และการยืนยันตัวตน
- 📝 Personal Playlists
- 🔖 ระบบบุ๊กมาร์ก
- 💬 ระบบคอมเมนต์
- ⭐ การให้คะแนนวิดีโอ
- 🤝 ฟีเจอร์โซเชียล

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดระบบ
- Node.js 14.0.0 หรือสูงกว่า
- YouTube Data API v3 Key

### ขั้นตอนการติดตั้ง

1. **Clone โปรเจค**
   ```bash
   git clone <repository-url>
   cd youtube-search-app
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   แก้ไขไฟล์ `.env` และใส่ YouTube API Key ของคุณ:
   ```
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```

4. **รันแอปพลิเคชัน**
   ```bash
   # Production
   npm start
   
   # Development (with auto-reload)
   npm run dev
   ```

5. **เปิดเบราว์เซอร์**
   ไปที่ `http://localhost:3000`

## 🔑 การขอ YouTube API Key

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจคใหม่หรือเลือกโปรเจคที่มีอยู่
3. เปิดใช้งาน YouTube Data API v3
4. สร้าง API Key ใน Credentials
5. จำกัดการใช้งาน API Key (แนะนำ)

## 📖 การใช้งาน

### การค้นหาพื้นฐาน
1. เลือกประเภทการค้นหา (Channel ID หรือชื่อช่อง)
2. กรอกข้อมูลช่อง YouTube
3. กรอกคีย์เวิร์ดที่ต้องการค้นหา
4. เลือกตัวเลือกเพิ่มเติม (จำนวนผลลัพธ์, การเรียงลำดับ, วันที่)
5. กดปุ่ม "ค้นหาวิดีโอ"

### ตัวอย่างการใช้งาน
- **ค้นหาด้วยชื่อช่อง**: "PewDiePie" + คีย์เวิร์ด "gaming"
- **ค้นหาด้วย Channel ID**: "UCxxxxxxxxxxxxxxxxxxxxxx" + คีย์เวิร์ด "tutorial"

## 🛠️ API Endpoints

### POST `/search`
ค้นหาวิดีโอ YouTube

**Request Body:**
```json
{
  "searchType": "channelName|channelId",
  "channelInput": "ชื่อช่องหรือ Channel ID",
  "keyword": "คีย์เวิร์ดที่ต้องการค้นหา",
  "maxResults": 10,
  "order": "relevance|date|viewCount|rating",
  "publishedAfter": "2024-01-01",
  "pageToken": "token_for_pagination"
}
```

**Response:**
```json
{
  "items": [...],
  "nextPageToken": "...",
  "prevPageToken": "...",
  "pageInfo": {
    "totalResults": 1000
  }
}
```

### GET `/health`
ตรวจสอบสถานะเซิร์ฟเวอร์

### GET `/api/info`
ข้อมูล API และฟีเจอร์

## 🏗️ สถาปัตยกรรม

```
├── public/           # Frontend files
│   ├── index.html   # หน้าหลัก
│   ├── app.js       # JavaScript logic
│   └── style.css    # Styling
├── index.js         # Express server
├── package.json     # Dependencies
├── .env.example     # Environment template
└── README.md        # เอกสารนี้
```

## 🔧 การพัฒนา

### การเพิ่มฟีเจอร์ใหม่
1. อัปเดต frontend (HTML/CSS/JS)
2. เพิ่ม API endpoints ใน `index.js`
3. ทดสอบการทำงาน
4. อัปเดตเอกสาร

### การ Debug
- ดู console logs ในเบราว์เซอร์
- ตรวจสอบ server logs ใน terminal
- ใช้ `/health` endpoint เพื่อตรวจสอบสถานะ

## 📋 Roadmap

- [x] **Phase 1**: ระบบพื้นฐาน
- [ ] **Phase 2**: ระบบผู้ใช้
- [ ] **Phase 3**: ฟีเจอร์ส่วนตัว
- [ ] **Phase 4**: ฟีเจอร์โซเชียล
- [ ] **Phase 5**: การปรับปรุงและบำรุงรักษา

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

**1. "API key ไม่ถูกต้อง"**
- ตรวจสอบ API key ในไฟล์ `.env`
- ตรวจสอบว่าเปิดใช้งาน YouTube Data API v3 แล้ว

**2. "ไม่พบช่อง"**
- ตรวจสอบชื่อช่องให้ถูกต้อง
- ลองใช้ Channel ID แทน

**3. "เกินโควต้า API"**
- รอให้โควต้ารีเซ็ต (24 ชั่วโมง)
- ลดจำนวนการค้นหา

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ LICENSE

## 🤝 การมีส่วนร่วม

ยินดีรับ Pull Requests และ Issues! 

1. Fork โปรเจค
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไปยัง branch
5. สร้าง Pull Request

## 📞 ติดต่อ

หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาสร้าง Issue ใน GitHub

---

**สร้างด้วย ❤️ โดยใช้ Node.js และ YouTube Data API v3**