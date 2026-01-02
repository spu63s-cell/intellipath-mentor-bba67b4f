# IntelliPath - System Architecture | الهيكل العام للنظام

## Overview | نظرة عامة

IntelliPath is a comprehensive AI-powered Academic Advisory System designed specifically for Syrian Private University (SPU) Engineering students. The system integrates 10 specialized AI subsystems to provide personalized academic guidance.

IntelliPath هو نظام إرشاد أكاديمي ذكي شامل مصمم خصيصًا لطلاب كلية الهندسة في الجامعة السورية الخاصة. يدمج النظام 10 أنظمة فرعية ذكية لتقديم إرشاد أكاديمي مخصص.

---

## System Architecture Diagram | مخطط هيكل النظام

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IntelliPath Platform                               │
│                        منصة المسار الذكي                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Frontend Layer | طبقة الواجهة                      │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  React    │ │ Tailwind  │ │  shadcn   │ │  Framer   │           │   │
│  │  │  18.3.1   │ │   CSS     │ │    UI     │ │  Motion   │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  Zustand  │ │   React   │ │  i18next  │ │ Recharts  │           │   │
│  │  │   State   │ │   Query   │ │   i18n    │ │  Charts   │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │               API Layer | طبقة واجهة البرمجة                         │   │
│  │  ┌───────────────────┐  ┌───────────────────┐                       │   │
│  │  │   REST API Client │  │  Supabase Client  │                       │   │
│  │  │   عميل REST       │  │   عميل سوبابيس   │                       │   │
│  │  └───────────────────┘  └───────────────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Backend Layer | طبقة الخادم الخلفي                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │              Edge Functions | الدوال الطرفية                 │    │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │   │
│  │  │  │rag-query│ │agentic- │ │academic-│ │ early-  │           │    │   │
│  │  │  │         │ │  chat   │ │analysis │ │ warning │           │    │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │    │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │   │
│  │  │  │ memory- │ │  cache- │ │ neo4j-  │ │ vector- │           │    │   │
│  │  │  │ service │ │ service │ │  query  │ │ search  │           │    │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │    │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │   │
│  │  │  │ study-  │ │ student-│ │  sync-  │ │ graph-  │           │    │   │
│  │  │  │materials│ │data-imp │ │  neo4j  │ │  query  │           │    │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │               Data Layer | طبقة البيانات                             │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │   │
│  │  │   PostgreSQL  │  │   Qdrant      │  │    Neo4j      │            │   │
│  │  │   (Supabase)  │  │ Vector Store  │  │ Graph DB      │            │   │
│  │  │   قاعدة بيانات │  │ متجر متجهات   │  │  قاعدة رسم    │            │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │   │
│  │  ┌───────────────┐  ┌───────────────┐                               │   │
│  │  │     Redis     │  │   Supabase    │                               │   │
│  │  │     Cache     │  │    Storage    │                               │   │
│  │  │   ذاكرة مؤقتة  │  │    تخزين     │                               │   │
│  │  └───────────────┘  └───────────────┘                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10 AI Subsystems | الأنظمة الفرعية الذكية العشرة

### 1. RAG Chat System | نظام المحادثة RAG
**Purpose | الغرض:** Intelligent conversational AI for academic queries
**الوصف:** ذكاء اصطناعي محادثاتي للاستفسارات الأكاديمية

```
Components | المكونات:
├── rag-query/        # RAG query processing | معالجة استعلامات RAG
├── agentic-chat/     # Agentic reasoning chat | محادثة بالتفكير الوكيلي
├── urag-query/       # Universal RAG query | استعلام RAG الشامل
└── chat/             # Base chat function | دالة المحادثة الأساسية
```

### 2. Knowledge Graph | الرسم البياني المعرفي
**Purpose | الغرض:** Course relationships and prerequisite chains
**الوصف:** علاقات المقررات وسلاسل المتطلبات المسبقة

```
Components | المكونات:
├── neo4j-query/      # Neo4j graph queries | استعلامات رسم Neo4j
├── graph-query/      # General graph queries | استعلامات الرسم العامة
├── sync-neo4j/       # Neo4j synchronization | مزامنة Neo4j
└── vis-network       # Graph visualization | تصور الرسم البياني
```

### 3. Decision Simulator | محاكي القرارات
**Purpose | الغرض:** Simulate academic decisions (drops, retakes, projections)
**الوصف:** محاكاة القرارات الأكاديمية (السحب، الإعادة، التوقعات)

```
Features | الميزات:
├── Drop Simulation   # محاكاة سحب المقررات
├── Retake Analysis   # تحليل إعادة المقررات
├── GPA Projection    # توقع المعدل التراكمي
└── What-If Scenarios # سيناريوهات ماذا لو
```

### 4. Career Planner | مخطط المسار الوظيفي
**Purpose | الغرض:** Career path recommendations based on academic performance
**الوصف:** توصيات المسار الوظيفي بناءً على الأداء الأكاديمي

```
Features | الميزات:
├── Career Matching   # مطابقة المسارات الوظيفية
├── Skill Analysis    # تحليل المهارات
├── Course Alignment  # محاذاة المقررات
└── Industry Insights # رؤى السوق
```

### 5. Early Warning System | نظام الإنذار المبكر
**Purpose | الغرض:** Predict and prevent academic failures
**الوصف:** توقع ومنع الإخفاقات الأكاديمية

```
Components | المكونات:
├── early-warning/    # Warning detection | كشف الإنذارات
├── Risk Analysis     # تحليل المخاطر
├── Intervention Tips # نصائح التدخل
└── Progress Tracking # تتبع التقدم
```

### 6. Learning Style Analysis | تحليل أسلوب التعلم
**Purpose | الغرض:** Identify and adapt to student learning preferences
**الوصف:** تحديد والتكيف مع تفضيلات تعلم الطالب

```
Features | الميزات:
├── VARK Assessment   # تقييم VARK
├── Style Detection   # كشف الأسلوب
├── Resource Matching # مطابقة الموارد
└── Adaptive Tips     # نصائح تكيفية
```

### 7. Gamification System | نظام التلعيب
**Purpose | الغرض:** Engage students through achievements and rewards
**الوصف:** إشراك الطلاب من خلال الإنجازات والمكافآت

```
Features | الميزات:
├── XP Points         # نقاط الخبرة
├── Badges            # الشارات
├── Achievements      # الإنجازات
├── Leaderboards      # لوحات الصدارة
└── Streaks           # سلاسل الإنجاز
```

### 8. Talent Ledger | سجل المواهب
**Purpose | الغرض:** Skills and certifications tracking
**الوصف:** تتبع المهارات والشهادات

```
Features | الميزات:
├── Skill Tracking    # تتبع المهارات
├── Certifications    # الشهادات
├── Portfolio         # المحفظة
└── Verification      # التحقق
```

### 9. Course Fingerprint | بصمة المقررات
**Purpose | الغرض:** Detailed course analysis and recommendations
**الوصف:** تحليل المقررات التفصيلي والتوصيات

```
Features | الميزات:
├── Prerequisites     # المتطلبات المسبقة
├── Difficulty Rating # تقييم الصعوبة
├── Success Patterns  # أنماط النجاح
└── Course Relations  # علاقات المقررات
```

### 10. Peer Matching & Wellness | التوافق مع الأقران والعافية
**Purpose | الغرض:** Connect students and monitor wellbeing
**الوصف:** ربط الطلاب ومراقبة الرفاهية

```
Features | الميزات:
├── Peer Matching     # مطابقة الأقران
├── Study Groups      # مجموعات الدراسة
├── Wellness Checks   # فحوصات العافية
└── Support Resources # موارد الدعم
```

---

## File Structure | هيكل الملفات

```
intellipath/
├── docs/                           # Documentation | التوثيق
│   ├── ARCHITECTURE.md             # This file | هذا الملف
│   ├── STUDENT_DATA_ISOLATION.md   # Data security | أمان البيانات
│   ├── API_REFERENCE.md            # API docs | توثيق الـ API
│   └── DEPLOYMENT.md               # Deployment guide | دليل النشر
│
├── public/                         # Static assets | الملفات الثابتة
│   ├── data/
│   │   ├── plans/                  # Academic plans | الخطط الأكاديمية
│   │   ├── synonyms_ar.json        # Arabic synonyms | المرادفات العربية
│   │   ├── synonyms_en.json        # English synonyms | المرادفات الإنجليزية
│   │   └── knowledge_graph.json    # Graph data | بيانات الرسم
│   └── [PWA assets]                # PWA icons | أيقونات التطبيق
│
├── src/                            # Source code | الكود المصدري
│   ├── api/                        # API layer | طبقة الـ API
│   │   ├── endpoints/              # API endpoints | نقاط النهاية
│   │   │   ├── academic.ts         # Academic API | API الأكاديمي
│   │   │   ├── auth.ts             # Auth API | API المصادقة
│   │   │   ├── chat.ts             # Chat API | API المحادثة
│   │   │   ├── feedback.ts         # Feedback API | API التعليقات
│   │   │   ├── gamification.ts     # Gamification API | API التلعيب
│   │   │   ├── health.ts           # Health API | API الصحة
│   │   │   ├── jobs.ts             # Jobs API | API الوظائف
│   │   │   ├── learningStyle.ts    # Learning API | API التعلم
│   │   │   ├── memory.ts           # Memory API | API الذاكرة
│   │   │   ├── paths.ts            # Paths API | API المسارات
│   │   │   ├── peerMatching.ts     # Peer API | API الأقران
│   │   │   ├── predictions.ts      # Predictions API | API التوقعات
│   │   │   ├── simulator.ts        # Simulator API | API المحاكي
│   │   │   ├── talentLedger.ts     # Talent API | API المواهب
│   │   │   └── wellness.ts         # Wellness API | API العافية
│   │   ├── client.ts               # API client | عميل الـ API
│   │   ├── config.ts               # API config | إعدادات الـ API
│   │   ├── index.ts                # Exports | التصديرات
│   │   └── types.ts                # TypeScript types | أنواع TypeScript
│   │
│   ├── components/                 # React components | مكونات React
│   │   ├── admin/                  # Admin components | مكونات المسؤول
│   │   │   ├── AcademicRecordsImport.tsx
│   │   │   ├── AdvisorAssignments.tsx
│   │   │   ├── CourseDataImport.tsx
│   │   │   ├── StudentDataImport.tsx
│   │   │   └── StudentRecordsImport.tsx
│   │   ├── auth/                   # Auth components | مكونات المصادقة
│   │   │   └── ProtectedRoute.tsx
│   │   ├── chat/                   # Chat components | مكونات المحادثة
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatSidebar.tsx
│   │   │   └── SuggestedQuestions.tsx
│   │   ├── dashboard/              # Dashboard components | مكونات لوحة القيادة
│   │   │   └── ExportReportButton.tsx
│   │   ├── deadlines/              # Deadline components | مكونات المواعيد
│   │   │   └── DeadlineCalendar.tsx
│   │   ├── layout/                 # Layout components | مكونات التخطيط
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   ├── MobileNavigation.tsx
│   │   │   └── Navbar.tsx
│   │   ├── notifications/          # Notification components | مكونات الإشعارات
│   │   │   ├── NotificationBell.tsx
│   │   │   └── PushNotificationPrompt.tsx
│   │   ├── providers/              # Context providers | موفرات السياق
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ThemeProvider.tsx
│   │   └── ui/                     # UI components (shadcn) | مكونات الواجهة
│   │       └── [40+ components]
│   │
│   ├── hooks/                      # Custom hooks | الخطافات المخصصة
│   │   ├── api/                    # API hooks | خطافات الـ API
│   │   │   ├── useAcademicAnalysis.ts
│   │   │   ├── useAgenticChat.ts
│   │   │   ├── useCacheService.ts
│   │   │   ├── useGraphQuery.ts
│   │   │   ├── useIntelliPathAcademic.ts
│   │   │   ├── useIntelliPathAuth.ts
│   │   │   ├── useIntelliPathChat.ts
│   │   │   ├── useIntelliPathGamification.ts
│   │   │   ├── useIntelliPathPeerMatching.ts
│   │   │   ├── useIntelliPathPredictions.ts
│   │   │   ├── useIntelliPathWellness.ts
│   │   │   ├── useMemoryService.ts
│   │   │   ├── useNeo4jQuery.ts
│   │   │   ├── useStudentDataImport.ts
│   │   │   ├── useStudyMaterials.ts
│   │   │   ├── useURAGChat.ts
│   │   │   ├── useVectorSearch.ts
│   │   │   └── index.ts
│   │   ├── useAcademicRecord.ts
│   │   ├── useAchievements.ts
│   │   ├── useAdminData.ts
│   │   ├── useAdvisorStats.ts
│   │   ├── useCareerPaths.ts
│   │   ├── useDeadlines.ts
│   │   ├── useEarlyWarning.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useMessages.ts
│   │   ├── useNotifications.ts
│   │   ├── usePushNotifications.ts
│   │   ├── useSimulatorData.ts
│   │   ├── useStreamChat.ts
│   │   ├── useStudentDashboard.ts
│   │   ├── useStudentsList.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── i18n/                       # Internationalization | التدويل
│   │   ├── locales/
│   │   │   ├── ar.json             # Arabic translations | الترجمات العربية
│   │   │   └── en.json             # English translations | الترجمات الإنجليزية
│   │   └── index.ts
│   │
│   ├── integrations/               # External integrations | التكاملات الخارجية
│   │   └── supabase/
│   │       ├── client.ts           # Supabase client | عميل سوبابيس
│   │       └── types.ts            # Database types | أنواع قاعدة البيانات
│   │
│   ├── lib/                        # Utilities | الأدوات المساعدة
│   │   └── utils.ts                # Utility functions | دوال مساعدة
│   │
│   ├── pages/                      # Page components | مكونات الصفحات
│   │   ├── About.tsx               # About page | صفحة حول
│   │   ├── AcademicRecord.tsx      # Academic record | السجل الأكاديمي
│   │   ├── Achievements.tsx        # Achievements | الإنجازات
│   │   ├── Admin.tsx               # Admin panel | لوحة المسؤول
│   │   ├── AdvisorDashboard.tsx    # Advisor dashboard | لوحة المرشد
│   │   ├── Analytics.tsx           # Analytics | التحليلات
│   │   ├── Auth.tsx                # Authentication | المصادقة
│   │   ├── Career.tsx              # Career paths | المسارات الوظيفية
│   │   ├── Chat.tsx                # AI Chat | المحادثة الذكية
│   │   ├── ChatAnalytics.tsx       # Chat analytics | تحليلات المحادثة
│   │   ├── Courses.tsx             # Courses | المقررات
│   │   ├── Dashboard.tsx           # Main dashboard | لوحة القيادة الرئيسية
│   │   ├── Deadlines.tsx           # Deadlines | المواعيد النهائية
│   │   ├── DecisionSimulator.tsx   # Decision simulator | محاكي القرارات
│   │   ├── GpaCalculator.tsx       # GPA calculator | حاسبة المعدل
│   │   ├── Index.tsx               # Landing page | الصفحة الرئيسية
│   │   ├── KnowledgeGraph.tsx      # Knowledge graph | الرسم المعرفي
│   │   ├── LearningStyle.tsx       # Learning style | أسلوب التعلم
│   │   ├── Messages.tsx            # Messages | الرسائل
│   │   ├── NotFound.tsx            # 404 page | صفحة 404
│   │   ├── PeerMatching.tsx        # Peer matching | مطابقة الأقران
│   │   ├── Profile.tsx             # User profile | الملف الشخصي
│   │   ├── StudentSettings.tsx     # Student settings | إعدادات الطالب
│   │   ├── StudyMaterials.tsx      # Study materials | المواد الدراسية
│   │   ├── SyncManagement.tsx      # Sync management | إدارة المزامنة
│   │   ├── TalentLedger.tsx        # Talent ledger | سجل المواهب
│   │   └── WellnessCheck.tsx       # Wellness check | فحص العافية
│   │
│   ├── stores/                     # State management | إدارة الحالة
│   │   ├── authStore.ts            # Auth state | حالة المصادقة
│   │   ├── languageStore.ts        # Language state | حالة اللغة
│   │   └── themeStore.ts           # Theme state | حالة السمة
│   │
│   ├── utils/                      # Utilities | الأدوات
│   │   ├── confetti.ts             # Confetti effects | تأثيرات الكونفيتي
│   │   ├── excelExport.ts          # Excel export | تصدير Excel
│   │   └── pdfExport.ts            # PDF export | تصدير PDF
│   │
│   ├── App.tsx                     # Main app component | مكون التطبيق الرئيسي
│   ├── App.css                     # App styles | أنماط التطبيق
│   ├── index.css                   # Global styles | الأنماط العامة
│   ├── main.tsx                    # Entry point | نقطة الدخول
│   └── vite-env.d.ts               # Vite types | أنواع Vite
│
├── supabase/                       # Supabase config | إعدادات سوبابيس
│   ├── functions/                  # Edge functions | الدوال الطرفية
│   │   ├── academic-analysis/      # Academic analysis | التحليل الأكاديمي
│   │   ├── agentic-chat/           # Agentic chat | المحادثة الوكيلية
│   │   ├── cache-service/          # Cache service | خدمة التخزين المؤقت
│   │   ├── chat/                   # Basic chat | المحادثة الأساسية
│   │   ├── cleanup-job/            # Cleanup job | مهمة التنظيف
│   │   ├── course-data-import/     # Course import | استيراد المقررات
│   │   ├── early-warning/          # Early warning | الإنذار المبكر
│   │   ├── graph-query/            # Graph queries | استعلامات الرسم
│   │   ├── import-student-records/ # Record import | استيراد السجلات
│   │   ├── link-student/           # Student linking | ربط الطالب
│   │   ├── memory-service/         # Memory service | خدمة الذاكرة
│   │   ├── neo4j-query/            # Neo4j queries | استعلامات Neo4j
│   │   ├── rag-query/              # RAG queries | استعلامات RAG
│   │   ├── student-data-import/    # Student import | استيراد الطلاب
│   │   ├── study-materials/        # Study materials | المواد الدراسية
│   │   ├── sync-neo4j/             # Neo4j sync | مزامنة Neo4j
│   │   ├── urag-query/             # URAG queries | استعلامات URAG
│   │   └── vector-search/          # Vector search | البحث المتجهي
│   ├── config.toml                 # Supabase config | إعدادات سوبابيس
│   └── migrations/                 # Database migrations | ترحيلات قاعدة البيانات
│
├── index.html                      # HTML entry | مدخل HTML
├── tailwind.config.ts              # Tailwind config | إعدادات Tailwind
├── vite.config.ts                  # Vite config | إعدادات Vite
├── eslint.config.js                # ESLint config | إعدادات ESLint
└── README.md                       # Project README | ملف التعريف
```

---

## Database Schema | مخطط قاعدة البيانات

### Core Tables | الجداول الأساسية

```sql
-- Users & Profiles | المستخدمون والملفات الشخصية
├── profiles                    # User profiles | الملفات الشخصية
├── user_roles                  # User roles (student, advisor, admin) | أدوار المستخدمين
└── students                    # Student data | بيانات الطلاب

-- Academic Data | البيانات الأكاديمية
├── courses                     # Course catalog | كتالوج المقررات
├── course_prerequisites        # Prerequisites | المتطلبات المسبقة
├── course_majors              # Course-major mapping | ربط المقررات بالتخصصات
├── enrollments                # Student enrollments | تسجيلات الطلاب
├── student_academic_records   # Academic records | السجلات الأكاديمية
└── majors                     # Academic majors | التخصصات الأكاديمية

-- Relationships | العلاقات
├── course_skills              # Course-skill mapping | ربط المقررات بالمهارات
├── course_tools               # Course-tool mapping | ربط المقررات بالأدوات
├── course_topics              # Course-topic mapping | ربط المقررات بالمواضيع
├── course_career_paths        # Career path mapping | ربط المسارات الوظيفية
└── course_relations           # Course relationships | علاقات المقررات

-- Chat & AI | المحادثة والذكاء الاصطناعي
├── chat_conversations         # Chat conversations | محادثات الدردشة
├── chat_messages              # Chat messages | رسائل الدردشة
├── chat_analytics             # Chat analytics | تحليلات المحادثة
├── user_memories              # User memories | ذاكرة المستخدم
├── query_cache                # Query cache | ذاكرة الاستعلامات
└── faqs                       # FAQs | الأسئلة الشائعة

-- Gamification | التلعيب
├── achievements               # Achievement definitions | تعريفات الإنجازات
├── student_achievements       # Student achievements | إنجازات الطلاب
└── deadlines                  # Student deadlines | مواعيد الطلاب

-- Support | الدعم
├── skills                     # Skills catalog | كتالوج المهارات
├── tools                      # Tools catalog | كتالوج الأدوات
├── topics                     # Topics catalog | كتالوج المواضيع
├── career_paths               # Career paths | المسارات الوظيفية
├── study_materials            # Study materials | المواد الدراسية
├── messages                   # User messages | رسائل المستخدمين
├── notifications              # Notifications | الإشعارات
├── rate_limits                # Rate limiting | تحديد المعدل
├── import_logs                # Import logs | سجلات الاستيراد
└── advisor_student_assignments # Advisor assignments | تعيينات المرشدين
```

---

## Security Architecture | هيكل الأمان

### 4-Layer Security Model | نموذج الأمان رباعي الطبقات

```
┌─────────────────────────────────────────────────────────────────┐
│                    Layer 1: Authentication                       │
│                    الطبقة الأولى: المصادقة                        │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  JWT Token  │───▶│   Supabase  │───▶│  User ID    │         │
│  │  رمز JWT    │    │    Auth     │    │  معرف المستخدم│         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Layer 2: Row Level Security                      │
│                الطبقة الثانية: أمان مستوى الصف                   │
│                                                                  │
│  SELECT * FROM students WHERE user_id = auth.uid()              │
│  يتم تصفية البيانات تلقائياً حسب المستخدم                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Layer 3: Edge Functions                         │
│               الطبقة الثالثة: الدوال الطرفية                      │
│                                                                  │
│  - Token validation | التحقق من الرمز                            │
│  - User context extraction | استخراج سياق المستخدم               │
│  - Data filtering | تصفية البيانات                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Layer 4: AI Context Isolation                   │
│             الطبقة الرابعة: عزل سياق الذكاء الاصطناعي              │
│                                                                  │
│  AI only receives current student's data                        │
│  الذكاء الاصطناعي يستلم فقط بيانات الطالب الحالي                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack | مكدس التقنيات

### Frontend | الواجهة الأمامية
| Technology | Version | Purpose | الغرض |
|------------|---------|---------|-------|
| React | 18.3.1 | UI Framework | إطار الواجهة |
| TypeScript | 5.x | Type Safety | أمان الأنواع |
| Tailwind CSS | 3.x | Styling | التنسيق |
| shadcn/ui | Latest | UI Components | مكونات الواجهة |
| Framer Motion | 12.x | Animations | الرسوم المتحركة |
| React Query | 5.x | Data Fetching | جلب البيانات |
| Zustand | 5.x | State Management | إدارة الحالة |
| i18next | 25.x | Internationalization | التدويل |
| Recharts | 2.x | Charts | الرسوم البيانية |
| vis-network | 10.x | Graph Visualization | تصور الرسم البياني |

### Backend | الخادم الخلفي
| Technology | Version | Purpose | الغرض |
|------------|---------|---------|-------|
| Supabase | Latest | Backend Platform | منصة الخادم |
| PostgreSQL | 15 | Primary Database | قاعدة البيانات الأساسية |
| Edge Functions | Deno | Serverless Functions | الدوال الخادمية |
| Qdrant | Latest | Vector Database | قاعدة البيانات المتجهية |
| Neo4j | Latest | Graph Database | قاعدة البيانات الرسومية |
| Redis | Latest | Cache | الذاكرة المؤقتة |

### AI/ML | الذكاء الاصطناعي
| Technology | Purpose | الغرض |
|------------|---------|-------|
| Gemini Pro | Primary LLM | النموذج اللغوي الأساسي |
| Gemini Flash | Fast Responses | الاستجابات السريعة |
| OpenAI GPT | Alternative LLM | النموذج اللغوي البديل |
| RAG Pipeline | Document Retrieval | استرجاع المستندات |

---

## Deployment | النشر

### Production Deployment | النشر الإنتاجي

```bash
# Build the application | بناء التطبيق
npm run build

# Deploy to production | النشر للإنتاج
# Automatic via CI/CD pipeline | تلقائي عبر خط أنابيب CI/CD
```

### Environment Variables | متغيرات البيئة

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

---

## Performance Optimizations | تحسينات الأداء

1. **Code Splitting | تقسيم الكود**
   - Lazy loading for routes | التحميل الكسول للمسارات
   - Dynamic imports | الاستيراد الديناميكي

2. **Caching Strategy | استراتيجية التخزين المؤقت**
   - Query cache with Redis simulation | ذاكرة الاستعلامات
   - React Query cache | ذاكرة React Query

3. **Optimized Queries | استعلامات محسنة**
   - Indexed database queries | استعلامات مفهرسة
   - Pagination for large datasets | التقسيم للبيانات الكبيرة

4. **Image Optimization | تحسين الصور**
   - WebP format support | دعم صيغة WebP
   - Lazy loading images | تحميل الصور الكسول

---

## Monitoring & Logging | المراقبة والتسجيل

- **Chat Analytics** | تحليلات المحادثة
- **Error Tracking** | تتبع الأخطاء
- **Performance Metrics** | مقاييس الأداء
- **User Activity Logs** | سجلات نشاط المستخدم

---

*Last Updated | آخر تحديث: January 2026*
*Version | الإصدار: 2.0.0*
