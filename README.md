# IntelliPath - نظام التوجيه الأكاديمي الذكي

<div align="center">

**نظام ذكي شامل لتوجيه الطلاب أكاديمياً باستخدام أحدث تقنيات الذكاء الاصطناعي**

*A comprehensive intelligent system for academic guidance using the latest AI technologies*

[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)
[![University](https://img.shields.io/badge/University-SPU-blue.svg)](https://spu.edu.sy)

</div>

---

## 📋 نظرة عامة | Overview

IntelliPath هو نظام توجيه أكاديمي ذكي مصمم لمساعدة طلاب كلية الهندسة المعلوماتية في اتخاذ قرارات أكاديمية مستنيرة. يجمع النظام بين تقنيات الذكاء الاصطناعي المتقدمة وتحليل البيانات لتقديم توصيات شخصية لكل طالب.

IntelliPath is an intelligent academic guidance system designed to help Information Technology Engineering students make informed academic decisions. The system combines advanced AI technologies and data analysis to provide personalized recommendations for each student.

---

## 🎯 الرؤية والرسالة | Vision & Mission

### الرؤية | Vision
أن نكون النظام الرائد في توجيه الطلاب أكاديمياً باستخدام الذكاء الاصطناعي والتقنيات الحديثة لتحقيق أفضل النتائج التعليمية.

### الرسالة | Mission
تزويد الطلاب بأدوات ذكية ومعلومات دقيقة لمساعدتهم على اتخاذ قرارات أكاديمية مدروسة.

### الأهداف | Goals
- تحسين تجربة الطالب الأكاديمية
- تقليل معدلات الرسوب والتعثر الأكاديمي
- تمكين الطلاب من اتخاذ قرارات مستنيرة

---

## ✨ الميزات الرئيسية | Key Features

### للطلاب | For Students
| الميزة | Feature | الوصف | Description |
|--------|---------|-------|-------------|
| 🤖 ذكاء اصطناعي متقدم | Advanced AI | نظام RAG متطور للرد على الأسئلة الأكاديمية | Advanced RAG system for academic Q&A |
| 📊 تتبع التقدم | Progress Tracking | مراقبة شاملة للتقدم الدراسي | Comprehensive academic progress monitoring |
| 🧭 تخطيط المسار | Path Planning | مساعدة ذكية في تخطيط المسار الدراسي | Smart academic path planning assistance |
| 🎮 محاكاة القرارات | Decision Simulator | تجربة سيناريوهات مختلفة | Try different academic scenarios |
| 🏆 نظام الإنجازات | Achievement System | نقاط XP وشارات تحفيزية | XP points and motivational badges |
| 💼 التخطيط المهني | Career Planning | اكتشاف الفرص المهنية المتاحة | Discover career opportunities |

### للمرشدين والمسؤولين | For Advisors & Admins
| الميزة | Feature | الوصف | Description |
|--------|---------|-------|-------------|
| ⚙️ لوحة التحكم | Admin Dashboard | إدارة شاملة للنظام | Comprehensive system management |
| ⚠️ الإنذار المبكر | Early Warning | تنبيهات للطلاب المعرضين للخطر | Alerts for at-risk students |
| 📈 التحليلات | Analytics | إحصائيات وتقارير متقدمة | Advanced statistics and reports |

---

## 🛠️ التقنيات المستخدمة | Tech Stack

### الواجهة الأمامية | Frontend
- **React 18** - مكتبة واجهات المستخدم | UI Library
- **TypeScript** - لغة برمجة آمنة النوع | Type-safe Language
- **Tailwind CSS** - إطار تنسيق حديث | Modern Styling Framework
- **Framer Motion** - حركات سلسة | Smooth Animations
- **Zustand** - إدارة الحالة | State Management
- **React Query** - إدارة البيانات | Data Management
- **i18next** - دعم اللغات | Internationalization

### الخلفية | Backend
- **Supabase** - قاعدة البيانات والمصادقة | Database & Authentication
- **PostgreSQL** - قاعدة بيانات علائقية | Relational Database
- **Edge Functions** - وظائف سحابية | Serverless Functions
- **Qdrant** - قاعدة بيانات متجهية | Vector Database
- **Neo4j** - قاعدة بيانات الرسم البياني | Graph Database

### الذكاء الاصطناعي | AI/ML
- **RAG Pipeline** - نظام الاسترجاع والتوليد | Retrieval-Augmented Generation
- **OpenAI Embeddings** - التضمينات | Embeddings Generation
- **LangChain** - إطار عمل الذكاء الاصطناعي | AI Framework

---

## 📁 هيكل المشروع | Project Structure

```
intellipath/
├── src/                    # الكود المصدري | Source code
│   ├── api/               # واجهات برمجة التطبيقات | API endpoints
│   ├── components/        # المكونات | React components
│   ├── hooks/             # الخطافات | Custom hooks
│   ├── pages/             # الصفحات | Pages
│   ├── stores/            # إدارة الحالة | State stores
│   └── i18n/              # الترجمات | Translations
├── supabase/
│   └── functions/         # وظائف Edge | Edge functions
├── scripts/
│   └── python/            # سكربتات Python | Python scripts
├── public/                # الملفات العامة | Public assets
└── docs/                  # التوثيق | Documentation
```

---

## 🔒 الأمان | Security

- **Row Level Security (RLS)** - عزل بيانات الطلاب | Student data isolation
- **JWT Authentication** - مصادقة آمنة | Secure authentication
- **Role-Based Access Control** - التحكم بالصلاحيات | Permission management

---

## 🌐 دعم اللغات | Language Support

النظام يدعم اللغتين بالكامل:
- 🇸🇦 العربية (Arabic) - RTL support
- 🇺🇸 English (الإنجليزية) - LTR support

---

## 📞 التواصل | Contact

**للحصول على معلومات إضافية أو الدعم الفني، يرجى التواصل مع:**

**For additional information or technical support, please contact:**

### المطور | Developer
**طارق محيسن | Tareq Mhysen**
- 📧 Email: TAREQ.SYRIA2002@gmail.com
- 📱 WhatsApp: +963 940 843 133
- 📸 Instagram: [@tareq_mhysen](https://instagram.com/tareq_mhysen)

### الجامعة | University
**الجامعة السورية الخاصة | Syrian Private University (SPU)**
- 🌐 Website: [spu.edu.sy](https://spu.edu.sy)
- 📍 Damascus, Syria

---

## 📄 الترخيص | License

هذا المشروع خاص ومحمي بحقوق الملكية الفكرية.

This project is private and protected by intellectual property rights.

---

<div align="center">

**تم التطوير بواسطة طارق محيسن | Developed by Tareq Mhysen**

*مشروع تخرج - بكالوريوس الذكاء الاصطناعي وعلوم البيانات*

*Graduation Project - Bachelor's in AI and Data Science*

**الجامعة السورية الخاصة SPU | Syrian Private University**

© 2025

</div>
