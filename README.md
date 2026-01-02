# IntelliPath - AI-Powered Academic Advisor | المرشد الأكاديمي الذكي

<div align="center">

![IntelliPath Logo](public/pwa-512x512.png)

**A comprehensive AI-powered Academic Advisory System for Engineering Students**

**نظام إرشاد أكاديمي ذكي شامل لطلاب الهندسة**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e.svg)](https://supabase.com/)

</div>

---

## 📋 Overview | نظرة عامة

IntelliPath is an intelligent academic advisory platform that integrates **10 specialized AI subsystems** to provide personalized academic guidance for engineering students.

IntelliPath هو منصة إرشاد أكاديمي ذكية تدمج **10 أنظمة فرعية ذكية متخصصة** لتقديم إرشاد أكاديمي مخصص لطلاب الهندسة.

---

## ✨ Features | الميزات

### 🤖 AI Systems | الأنظمة الذكية

| # | System | النظام | Description | الوصف |
|---|--------|--------|-------------|-------|
| 1 | **RAG Chat** | المحادثة الذكية | AI-powered Q&A with academic knowledge | أسئلة وأجوبة مدعومة بالذكاء الاصطناعي |
| 2 | **Knowledge Graph** | الرسم المعرفي | Visual course relationships | علاقات المقررات المرئية |
| 3 | **Decision Simulator** | محاكي القرارات | What-if academic scenarios | سيناريوهات "ماذا لو" الأكاديمية |
| 4 | **Career Planner** | مخطط المسار الوظيفي | Career path recommendations | توصيات المسار الوظيفي |
| 5 | **Early Warning** | الإنذار المبكر | Academic risk detection | كشف المخاطر الأكاديمية |
| 6 | **Learning Style** | أسلوب التعلم | Personalized learning analysis | تحليل التعلم الشخصي |
| 7 | **Gamification** | التلعيب | Achievements and rewards | الإنجازات والمكافآت |
| 8 | **Talent Ledger** | سجل المواهب | Skills tracking | تتبع المهارات |
| 9 | **Course Fingerprint** | بصمة المقررات | Course analysis | تحليل المقررات |
| 10 | **Peer Matching** | مطابقة الأقران | Study group formation | تشكيل مجموعات الدراسة |

### 🎯 Core Features | الميزات الأساسية

- ✅ **Bilingual Support** (Arabic/English) | دعم ثنائي اللغة
- ✅ **Real-time GPA Tracking** | تتبع المعدل التراكمي في الوقت الفعلي
- ✅ **Academic Records Import** | استيراد السجلات الأكاديمية
- ✅ **Course Prerequisites Visualization** | تصور المتطلبات المسبقة
- ✅ **PDF/Excel Export** | تصدير PDF/Excel
- ✅ **Dark/Light Theme** | السمة الداكنة/الفاتحة
- ✅ **PWA Support** | دعم تطبيق الويب التقدمي
- ✅ **Role-based Access** (Student/Advisor/Admin) | وصول قائم على الأدوار

---

## 🛠️ Tech Stack | مكدس التقنيات

### Frontend | الواجهة الأمامية
- **React 18.3** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **Framer Motion** - Animations
- **React Query** - Data Fetching
- **Zustand** - State Management
- **i18next** - Internationalization

### Backend | الخادم الخلفي
- **Supabase** - Backend Platform
- **PostgreSQL** - Primary Database
- **Edge Functions** - Serverless Functions
- **Qdrant** - Vector Database
- **Neo4j** - Graph Database

### AI/ML | الذكاء الاصطناعي
- **Gemini Pro/Flash** - LLM
- **RAG Pipeline** - Document Retrieval

---

## 🚀 Quick Start | البدء السريع

### Prerequisites | المتطلبات

```bash
node --version  # v18.x or later
npm --version   # 9.x or later
```

### Installation | التثبيت

```bash
# Clone repository | استنساخ المستودع
git clone https://github.com/your-org/intellipath.git
cd intellipath

# Install dependencies | تثبيت التبعيات
npm install

# Start development server | بدء خادم التطوير
npm run dev
```

### Build for Production | البناء للإنتاج

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure | هيكل المشروع

```
intellipath/
├── docs/                    # Documentation | التوثيق
├── public/                  # Static assets | الملفات الثابتة
├── src/
│   ├── api/                 # API layer | طبقة الـ API
│   ├── components/          # React components | مكونات React
│   ├── hooks/               # Custom hooks | الخطافات المخصصة
│   ├── i18n/                # Internationalization | التدويل
│   ├── pages/               # Page components | صفحات التطبيق
│   ├── stores/              # State management | إدارة الحالة
│   └── utils/               # Utilities | الأدوات المساعدة
└── supabase/
    └── functions/           # Edge functions | الدوال الطرفية
```

---

## 📚 Documentation | التوثيق

| Document | الوثيقة | Description |
|----------|---------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | الهيكل العام | System architecture |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | مرجع الـ API | API documentation |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | دليل النشر | Deployment guide |
| [STUDENT_DATA_ISOLATION.md](docs/STUDENT_DATA_ISOLATION.md) | عزل البيانات | Security model |

---

## 🔒 Security | الأمان

- **Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure token-based auth
- **Data Isolation** - Students can only access their own data
- **Rate Limiting** - API protection

---

## 📄 License | الترخيص

This project is proprietary software. All rights reserved.

هذا المشروع برمجية خاصة. جميع الحقوق محفوظة.

---

## 👥 Team | الفريق

Developed by the IntelliPath Engineering Team.

تم التطوير بواسطة فريق هندسة IntelliPath.

---

*Version 2.0.0 | January 2026*
