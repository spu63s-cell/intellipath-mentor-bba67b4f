# دليل رفع المشروع على GitHub | GitHub Upload Guide

## الملفات التي يجب رفعها ✅ | Files to Upload

```
intellipath/
├── docs/                          # ✅ التوثيق | Documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   ├── STUDENT_DATA_ISOLATION.md
│   └── GITHUB_UPLOAD_GUIDE.md
├── public/                        # ✅ الملفات الثابتة | Static assets
│   ├── data/
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── robots.txt
│   └── favicon.ico
├── scripts/                       # ✅ سكربتات البيانات | Data scripts
│   ├── python/
│   │   ├── seed_courses.py
│   │   ├── vector_embedding_generator.py
│   │   ├── graph_sync.py
│   │   └── requirements.txt
│   └── sql/
│       └── schema_complete.sql
├── src/                           # ✅ كود المصدر | Source code
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── i18n/
│   ├── pages/
│   ├── stores/
│   ├── utils/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── supabase/                      # ✅ Edge Functions
│   ├── functions/
│   │   ├── academic-analysis/
│   │   ├── agentic-chat/
│   │   ├── cache-service/
│   │   ├── chat/
│   │   ├── cleanup-job/
│   │   ├── course-data-import/
│   │   ├── early-warning/
│   │   ├── graph-query/
│   │   ├── import-student-records/
│   │   ├── link-student/
│   │   ├── memory-service/
│   │   ├── neo4j-query/
│   │   ├── rag-query/
│   │   ├── secure-chat-context/
│   │   ├── student-data-import/
│   │   ├── study-materials/
│   │   ├── sync-neo4j/
│   │   ├── urag-query/
│   │   └── vector-search/
│   └── config.toml
├── index.html                     # ✅
├── tailwind.config.ts             # ✅
├── vite.config.ts                 # ✅
├── tsconfig.json                  # ✅
├── tsconfig.app.json              # ✅
├── tsconfig.node.json             # ✅
├── eslint.config.js               # ✅
├── postcss.config.js              # ✅
├── components.json                # ✅
└── README.md                      # ✅
```

---

## الملفات التي لا يجب رفعها ❌ | Files NOT to Upload

### 1. ملفات البيئة والأسرار | Environment & Secrets
```
.env                    # ❌ يحتوي مفاتيح API سرية
.env.local              # ❌
.env.production         # ❌
```

### 2. ملفات التبعيات | Dependencies
```
node_modules/           # ❌ تُنشأ تلقائياً بـ npm install
bun.lockb               # ❌ أو اختيارياً ارفعها للتوافق
```

### 3. ملفات البناء | Build Output
```
dist/                   # ❌ تُنشأ عند البناء
build/                  # ❌
.vite/                  # ❌
```

### 4. ملفات مؤقتة | Temporary Files
```
*.log                   # ❌
*.tmp                   # ❌
.DS_Store               # ❌ (macOS)
Thumbs.db               # ❌ (Windows)
```

### 5. ملفات IDE | IDE Files
```
.idea/                  # ❌ (IntelliJ/WebStorm)
.vscode/                # ❌ أو ارفعها إذا أردت مشاركة الإعدادات
*.swp                   # ❌ (Vim)
```

---

## إنشاء ملف .gitignore | Create .gitignore

أنشئ ملف `.gitignore` في جذر المشروع:

```gitignore
# Dependencies | التبعيات
node_modules/
.pnp
.pnp.js

# Build output | مخرجات البناء
dist/
build/
.vite/
*.tsbuildinfo

# Environment files | ملفات البيئة (مهم جداً!)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# IDE & Editor | بيئة التطوير
.idea/
.vscode/
*.swp
*.swo
*~

# OS files | ملفات النظام
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs | السجلات
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing | الاختبار
coverage/
.nyc_output/

# Misc | متفرقات
*.local
*.bak
*.backup

# Python | بايثون
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
.venv/
ENV/
env/
*.egg-info/
.eggs/

# Supabase local | Supabase محلي
.supabase/
```

---

## خطوات الرفع على GitHub | Upload Steps

### 1. إنشاء مستودع جديد | Create New Repository
```bash
# انتقل لمجلد المشروع | Navigate to project folder
cd intellipath

# أنشئ مستودع Git محلي | Initialize local Git repo
git init

# أنشئ ملف .gitignore | Create .gitignore file
# (انسخ المحتوى أعلاه)
```

### 2. إضافة الملفات | Add Files
```bash
# أضف جميع الملفات (سيتم تجاهل ما في .gitignore)
git add .

# تأكد من عدم وجود .env
git status
```

### 3. الـ Commit الأول | First Commit
```bash
git commit -m "Initial commit: IntelliPath Academic Advisor"
```

### 4. ربط بـ GitHub | Connect to GitHub
```bash
# أنشئ مستودع على GitHub أولاً، ثم:
git remote add origin https://github.com/YOUR_USERNAME/intellipath.git
git branch -M main
git push -u origin main
```

---

## تحذيرات أمنية هامة ⚠️ | Security Warnings

### 1. مفاتيح API | API Keys
**لا ترفع أبداً مفاتيح API أو كلمات السر!**

إذا رفعت `.env` بالخطأ:
1. احذف الملف من Git: `git rm --cached .env`
2. أضفه لـ .gitignore
3. غيّر جميع المفاتيح المكشوفة فوراً!

### 2. متغيرات البيئة للإنتاج | Production Environment
استخدم GitHub Secrets أو Vercel/Netlify Environment Variables للإنتاج.

### 3. Supabase Keys
- `SUPABASE_URL` و `SUPABASE_ANON_KEY` يمكن أن تكون عامة (للـ frontend)
- `SUPABASE_SERVICE_ROLE_KEY` **يجب أن تبقى سرية** (للـ backend فقط)

---

## إعداد البيئة بعد الاستنساخ | Setup After Clone

```bash
# 1. استنسخ المشروع | Clone the project
git clone https://github.com/YOUR_USERNAME/intellipath.git
cd intellipath

# 2. ثبّت التبعيات | Install dependencies
npm install

# 3. أنشئ ملف .env | Create .env file
cp .env.example .env
# ثم أضف المفاتيح الخاصة بك

# 4. شغّل المشروع | Run the project
npm run dev
```

---

## ملف .env.example

أنشئ ملف `.env.example` كنموذج (بدون قيم حقيقية):

```env
# Supabase Configuration | إعدادات Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# AI Gateway (for Edge Functions) | بوابة الذكاء الاصطناعي
AI_API_KEY=your-ai-api-key
AI_GATEWAY_URL=https://api.openai.com/v1

# Neo4j (Optional) | قاعدة بيانات الرسم البياني
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Qdrant (Optional) | قاعدة البيانات المتجهة
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-key

# OpenAI (for embeddings) | للتضمينات
OPENAI_API_KEY=your-openai-key
```

---

## ملخص | Summary

| النوع | الحالة | السبب |
|-------|--------|-------|
| `src/` | ✅ ارفع | كود المصدر |
| `docs/` | ✅ ارفع | التوثيق |
| `public/` | ✅ ارفع | الملفات الثابتة |
| `supabase/functions/` | ✅ ارفع | Edge Functions |
| `scripts/` | ✅ ارفع | سكربتات البيانات |
| `.env` | ❌ لا ترفع | مفاتيح سرية |
| `node_modules/` | ❌ لا ترفع | تُنشأ تلقائياً |
| `dist/` | ❌ لا ترفع | مخرجات البناء |

---

**ملاحظة:** هذا المشروع مُعد ليكون مستقلاً تماماً وجاهزاً للنشر في أي بيئة. لا يحتوي على أي إشارات لمنصات التطوير المستخدمة.

*تم التحديث: يناير 2026*
