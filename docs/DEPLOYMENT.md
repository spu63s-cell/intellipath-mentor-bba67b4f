# IntelliPath - Deployment Guide | دليل النشر

## Overview | نظرة عامة

This guide provides step-by-step instructions for deploying IntelliPath in various environments. The application is designed for seamless deployment on modern cloud platforms.

هذا الدليل يقدم تعليمات خطوة بخطوة لنشر IntelliPath في بيئات مختلفة. التطبيق مصمم للنشر السلس على منصات السحابة الحديثة.

---

## Prerequisites | المتطلبات الأساسية

### Required Software | البرامج المطلوبة

```bash
# Node.js (LTS version) | نود جي إس
node --version  # v18.x or later | الإصدار 18 أو أحدث

# npm or yarn | مدير الحزم
npm --version   # 9.x or later | الإصدار 9 أو أحدث

# Git | جيت
git --version   # 2.x or later | الإصدار 2 أو أحدث
```

### Required Accounts | الحسابات المطلوبة

1. **Supabase Account** | حساب سوبابيس
   - Project with PostgreSQL database | مشروع مع قاعدة بيانات PostgreSQL
   - Edge Functions enabled | الدوال الطرفية مفعلة
   - Storage bucket configured | دلو التخزين معد

2. **Optional Services** | خدمات اختيارية
   - Qdrant Cloud (for vector search) | للبحث المتجهي
   - Neo4j Aura (for graph database) | لقاعدة البيانات الرسومية
   - Redis Cloud (for caching) | للتخزين المؤقت

---

## Environment Setup | إعداد البيئة

### 1. Clone Repository | استنساخ المستودع

```bash
# Clone the repository | استنساخ المستودع
git clone https://github.com/your-org/intellipath.git
cd intellipath

# Install dependencies | تثبيت التبعيات
npm install
```

### 2. Environment Variables | متغيرات البيئة

Create `.env` file in project root | أنشئ ملف `.env` في جذر المشروع:

```env
# ================================
# Supabase Configuration | إعدادات سوبابيس
# ================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# ================================
# AI/ML Configuration | إعدادات الذكاء الاصطناعي
# ================================
# These are set in Supabase Edge Function secrets
# يتم تعيين هذه في أسرار الدوال الطرفية

# ================================
# Optional: External Services | الخدمات الخارجية (اختياري)
# ================================
# QDRANT_URL=https://your-cluster.qdrant.io
# QDRANT_API_KEY=your_qdrant_key
# NEO4J_URI=neo4j+s://your-instance.neo4j.io
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=your_password
# REDIS_URL=redis://your-redis-host:6379
```

---

## Database Setup | إعداد قاعدة البيانات

### 1. Run Migrations | تشغيل الترحيلات

```bash
# Migrations are automatically applied via Supabase
# الترحيلات تُطبق تلقائياً عبر سوبابيس

# To check migration status | للتحقق من حالة الترحيلات
npx supabase migration list
```

### 2. Seed Data (Optional) | بيانات البذور (اختياري)

```sql
-- Insert initial majors | إدخال التخصصات الأولية
INSERT INTO majors (name, name_en, total_credits) VALUES
  ('هندسة المعلوماتية - ذكاء صنعي', 'Computer Engineering - AI', 171),
  ('هندسة المعلوماتية - نظم معلومات', 'Computer Engineering - IS', 171),
  ('هندسة المعلوماتية - شبكات', 'Computer Engineering - Networks', 171);

-- Insert initial achievements | إدخال الإنجازات الأولية
INSERT INTO achievements (name, name_ar, category, condition_type, xp_reward) VALUES
  ('First Login', 'أول تسجيل دخول', 'engagement', 'login_count', 10),
  ('GPA Master', 'سيد المعدل', 'academic', 'gpa_threshold', 100);
```

### 3. Enable RLS Policies | تفعيل سياسات RLS

```sql
-- Ensure RLS is enabled on all tables | تأكد من تفعيل RLS على جميع الجداول
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies are defined in migrations | السياسات معرفة في الترحيلات
```

---

## Edge Functions Deployment | نشر الدوال الطرفية

### 1. Configure Secrets | تكوين الأسرار

```bash
# Set secrets for Edge Functions | تعيين أسرار الدوال الطرفية
# Via Supabase Dashboard > Edge Functions > Secrets
# عبر لوحة تحكم سوبابيس > الدوال الطرفية > الأسرار

# Required secrets | الأسرار المطلوبة:
# - GEMINI_API_KEY (for AI responses | لاستجابات الذكاء الاصطناعي)
# - Optional: QDRANT_API_KEY, NEO4J_PASSWORD, etc.
```

### 2. Deploy Functions | نشر الدوال

```bash
# Functions are automatically deployed via CI/CD
# الدوال تُنشر تلقائياً عبر CI/CD

# Manual deployment (if needed) | النشر اليدوي (إذا لزم)
npx supabase functions deploy rag-query
npx supabase functions deploy agentic-chat
npx supabase functions deploy academic-analysis
# ... deploy other functions | نشر الدوال الأخرى
```

### 3. Verify Function Config | التحقق من إعدادات الدوال

Check `supabase/config.toml`:

```toml
[functions.rag-query]
verify_jwt = false  # Or true if auth required | أو true إذا كانت المصادقة مطلوبة

[functions.academic-analysis]
verify_jwt = false
```

---

## Frontend Build | بناء الواجهة الأمامية

### 1. Development Build | بناء التطوير

```bash
# Start development server | بدء خادم التطوير
npm run dev

# Application will be available at | التطبيق سيكون متاحاً على:
# http://localhost:5173
```

### 2. Production Build | بناء الإنتاج

```bash
# Create production build | إنشاء بناء الإنتاج
npm run build

# Preview production build locally | معاينة بناء الإنتاج محلياً
npm run preview
```

### 3. Build Output | مخرجات البناء

```
dist/
├── assets/
│   ├── index-[hash].js      # Main bundle | الحزمة الرئيسية
│   ├── index-[hash].css     # Styles | الأنماط
│   └── [other assets]       # Other assets | الأصول الأخرى
├── index.html               # Entry HTML | مدخل HTML
└── [PWA assets]             # PWA files | ملفات PWA
```

---

## Production Deployment | النشر الإنتاجي

### Option 1: Automated (Recommended) | الطريقة التلقائية (موصى بها)

The platform handles deployment automatically when you:
المنصة تتعامل مع النشر تلقائياً عندما:

1. Push to main branch | الدفع إلى الفرع الرئيسي
2. Click "Publish" in the dashboard | النقر على "نشر" في لوحة التحكم

### Option 2: Manual Deployment | النشر اليدوي

```bash
# Build for production | البناء للإنتاج
npm run build

# Deploy dist folder to your hosting | انشر مجلد dist لاستضافتك
# Examples: Vercel, Netlify, Cloudflare Pages
# أمثلة: فيرسل، نتليفاي، كلاودفلير بيجز
```

---

## Post-Deployment Checklist | قائمة التحقق بعد النشر

### Security Checks | فحوصات الأمان

- [ ] RLS enabled on all sensitive tables | RLS مفعل على جميع الجداول الحساسة
- [ ] API keys not exposed in client code | مفاتيح API غير مكشوفة في كود العميل
- [ ] CORS configured correctly | CORS معد بشكل صحيح
- [ ] Rate limiting active | تحديد المعدل نشط

### Functionality Checks | فحوصات الوظائف

- [ ] User authentication working | المصادقة تعمل
- [ ] Chat functionality responding | الدردشة تستجيب
- [ ] Academic records loading | السجلات الأكاديمية تُحمّل
- [ ] File uploads working | رفع الملفات يعمل

### Performance Checks | فحوصات الأداء

- [ ] Lighthouse score > 90 | درجة Lighthouse أكبر من 90
- [ ] First Contentful Paint < 2s | FCP أقل من 2 ثانية
- [ ] Time to Interactive < 5s | TTI أقل من 5 ثواني

---

## Monitoring & Maintenance | المراقبة والصيانة

### Logs | السجلات

```bash
# View Edge Function logs | عرض سجلات الدوال الطرفية
# Via Supabase Dashboard > Edge Functions > Logs
# عبر لوحة تحكم سوبابيس > الدوال الطرفية > السجلات
```

### Database Maintenance | صيانة قاعدة البيانات

```sql
-- Clean up expired cache | تنظيف الذاكرة المؤقتة المنتهية
DELETE FROM query_cache WHERE expires_at < NOW();

-- Clean up old memories | تنظيف الذكريات القديمة
DELETE FROM user_memories WHERE expires_at < NOW();

-- Vacuum and analyze | تفريغ وتحليل
VACUUM ANALYZE;
```

### Backup Strategy | استراتيجية النسخ الاحتياطي

- **Automatic backups** via Supabase (daily) | نسخ احتياطية تلقائية عبر سوبابيس (يومياً)
- **Point-in-time recovery** available | استعادة نقطة زمنية متاحة
- **Export critical data** regularly | تصدير البيانات الحرجة بانتظام

---

## Troubleshooting | استكشاف الأخطاء وإصلاحها

### Common Issues | المشاكل الشائعة

#### 1. Edge Function Timeout | انتهاء مهلة الدالة الطرفية

```
Error: Function execution timed out
الخطأ: انتهت مهلة تنفيذ الدالة
```

**Solution | الحل:**
- Optimize function code | تحسين كود الدالة
- Increase timeout in config | زيادة المهلة في الإعدادات
- Use caching for repeated queries | استخدم التخزين المؤقت للاستعلامات المتكررة

#### 2. RLS Policy Blocking | حظر سياسة RLS

```
Error: new row violates row-level security policy
الخطأ: الصف الجديد ينتهك سياسة الأمان
```

**Solution | الحل:**
- Check user is authenticated | تحقق من أن المستخدم مصادق
- Verify policy conditions | تحقق من شروط السياسة
- Ensure user_id matches | تأكد من تطابق user_id

#### 3. Build Failures | فشل البناء

```
Error: TypeScript compilation failed
الخطأ: فشل تجميع TypeScript
```

**Solution | الحل:**
- Run `npm run typecheck` | شغّل `npm run typecheck`
- Fix type errors | أصلح أخطاء الأنواع
- Update dependencies if needed | حدّث التبعيات إذا لزم

---

## Scaling Considerations | اعتبارات التوسع

### Database Scaling | توسيع قاعدة البيانات

1. **Enable connection pooling** | تفعيل تجمع الاتصالات
2. **Add read replicas** for heavy queries | إضافة نسخ قراءة للاستعلامات الثقيلة
3. **Partition large tables** | تقسيم الجداول الكبيرة

### Edge Functions Scaling | توسيع الدوال الطرفية

1. **Automatic scaling** handled by platform | التوسيع التلقائي يتم بواسطة المنصة
2. **Optimize cold starts** with smaller bundles | تحسين البدء البارد بحزم أصغر
3. **Use regional deployment** for lower latency | استخدم النشر الإقليمي لتقليل التأخير

### Frontend Scaling | توسيع الواجهة الأمامية

1. **CDN caching** for static assets | تخزين CDN للأصول الثابتة
2. **Code splitting** for faster loads | تقسيم الكود لتحميل أسرع
3. **Image optimization** with modern formats | تحسين الصور بصيغ حديثة

---

## Version History | سجل الإصدارات

| Version | Date | Changes | التغييرات |
|---------|------|---------|-----------|
| 2.0.0 | Jan 2026 | Major feature release | إصدار ميزات رئيسي |
| 1.5.0 | Dec 2025 | Academic records import | استيراد السجلات الأكاديمية |
| 1.0.0 | Nov 2025 | Initial release | الإصدار الأولي |

---

*Last Updated | آخر تحديث: January 2026*
*Deployment Guide Version | إصدار دليل النشر: 2.0*
