# 🎓 FaceFind — ค้นหารูปจากใบหน้า

ระบบค้นหารูปภาพจากใบหน้าด้วย AI สำหรับงานกิจกรรมวิทยาลัย

## ✨ Features

- 🏠 **หน้า Home** — แสดงรายการกิจกรรมทั้งหมด
- 🔍 **ค้นหาด้วยใบหน้า** — อัปโหลดเซลฟี่แล้ว AI จะค้นหารูปให้
- 🤖 **AI Face Recognition** — ใช้ face-api.js + pgvector
- 🖼️ **Gallery** — ดูรูปพร้อม Lightbox
- 📥 **ดาวน์โหลด** — ดาวน์โหลดรูปได้ทันที
- 📱 **Responsive** — รองรับ Mobile
- 👤 **Admin Dashboard** — จัดการกิจกรรมและรูปภาพ
- 📊 **Confidence Score** — แสดงคะแนนความเชื่อมั่น

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL + pgvector)
- **Storage:** Supabase Storage
- **AI:** face-api.js (SSD MobileNet + Face Recognition)
- **Animation:** Framer Motion

## 🚀 Setup Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. ไปที่ **SQL Editor** แล้วรัน SQL จากไฟล์ `supabase/schema.sql`
3. ไปที่ **Storage** สร้าง bucket ชื่อ `event-photos` (ตั้งเป็น public)

### 3. Environment Variables

สร้างไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
```

### 4. Run Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Pages & API Routes
│   ├── page.js             # Home page
│   ├── search/page.js      # Face search page
│   ├── event/[id]/page.js  # Event gallery
│   ├── admin/              # Admin pages
│   └── api/                # API routes
├── components/             # Reusable components
├── lib/                    # Utilities & clients
└── hooks/                  # Custom React hooks
```

## 🔄 System Flow

1. **Admin** อัปโหลดรูปกิจกรรม
2. ระบบ **สแกนใบหน้า** ในแต่ละรูป
3. บันทึก **Face Embeddings** (128D vectors) ลง pgvector
4. **ผู้ใช้** อัปโหลดเซลฟี่
5. ระบบ **เปรียบเทียบ** embedding ด้วย cosine similarity
6. แสดง **รูปที่ตรงกัน** พร้อมคะแนนความเชื่อมั่น

## 🚢 Deployment

### Vercel
```bash
npm i -g vercel
vercel
```

ตั้งค่า Environment Variables ใน Vercel Dashboard

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
