# IntelliPath - API Reference | مرجع واجهة البرمجة

## Overview | نظرة عامة

This document provides a comprehensive reference for all API endpoints available in the IntelliPath system. All APIs follow RESTful conventions and return JSON responses.

هذا المستند يقدم مرجعاً شاملاً لجميع نقاط النهاية المتاحة في نظام IntelliPath. جميع الـ APIs تتبع اتفاقيات RESTful وتعيد استجابات JSON.

---

## Base Configuration | الإعدادات الأساسية

```typescript
// API Client Configuration | إعدادات عميل الـ API
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

---

## Authentication | المصادقة

### Headers | رؤوس الطلب
```typescript
{
  "Authorization": "Bearer <access_token>",  // Required for protected routes | مطلوب للمسارات المحمية
  "Content-Type": "application/json",        // Request body type | نوع جسم الطلب
  "apikey": "<anon_key>"                     // Supabase anon key | مفتاح سوبابيس
}
```

---

## Edge Functions | الدوال الطرفية

### 1. RAG Query | استعلام RAG

**Endpoint:** `POST /functions/v1/rag-query`

**Purpose | الغرض:** Process natural language queries with RAG (Retrieval Augmented Generation)

**Request | الطلب:**
```typescript
interface RAGQueryRequest {
  question: string;              // User question | سؤال المستخدم
  conversation_id?: string;      // Optional conversation ID | معرف المحادثة (اختياري)
  use_hybrid_search?: boolean;   // Enable hybrid search | تفعيل البحث الهجين
  use_metadata_filter?: boolean; // Enable metadata filtering | تفعيل تصفية البيانات الوصفية
  top_k?: number;                // Number of results | عدد النتائج (default: 5)
  language?: 'ar' | 'en';        // Response language | لغة الاستجابة
}
```

**Response | الاستجابة:**
```typescript
interface RAGQueryResponse {
  answer: string;                // AI generated answer | الإجابة المولدة
  sources: Source[];             // Referenced sources | المصادر المرجعية
  confidence: number;            // Confidence score (0-1) | درجة الثقة
  thinking_process?: string;     // AI thinking process | عملية تفكير الذكاء الاصطناعي
  conversation_id: string;       // Conversation ID | معرف المحادثة
}

interface Source {
  content: string;               // Source content | محتوى المصدر
  metadata: {
    source_type: string;         // Type of source | نوع المصدر
    course_id?: string;          // Related course | المقرر المرتبط
    department?: string;         // Department | القسم
  };
  score: number;                 // Relevance score | درجة الصلة
}
```

**Example | مثال:**
```typescript
// Request | الطلب
const response = await supabase.functions.invoke('rag-query', {
  body: {
    question: "ما هي متطلبات مقرر البرمجة 3؟",
    use_hybrid_search: true,
    top_k: 5
  }
});

// Response | الاستجابة
{
  "answer": "مقرر البرمجة 3 يتطلب...",
  "sources": [...],
  "confidence": 0.92,
  "conversation_id": "uuid-here"
}
```

---

### 2. Agentic Chat | المحادثة الوكيلية

**Endpoint:** `POST /functions/v1/agentic-chat`

**Purpose | الغرض:** Advanced AI chat with multi-step reasoning

**Request | الطلب:**
```typescript
interface AgenticChatRequest {
  question: string;              // User question | سؤال المستخدم
  conversation_id?: string;      // Conversation ID | معرف المحادثة
  enable_tools?: boolean;        // Enable tool calling | تفعيل استدعاء الأدوات
  max_iterations?: number;       // Max reasoning steps | أقصى خطوات التفكير
}
```

**Response | الاستجابة:**
```typescript
interface AgenticChatResponse {
  answer: string;                // Final answer | الإجابة النهائية
  thinking_steps: ThinkingStep[];// Reasoning steps | خطوات التفكير
  tools_used: string[];          // Tools utilized | الأدوات المستخدمة
  sources: Source[];             // Sources | المصادر
}

interface ThinkingStep {
  step: number;                  // Step number | رقم الخطوة
  thought: string;               // AI thought | فكرة الذكاء الاصطناعي
  action?: string;               // Action taken | الإجراء المتخذ
  result?: string;               // Action result | نتيجة الإجراء
}
```

---

### 3. Academic Analysis | التحليل الأكاديمي

**Endpoint:** `POST /functions/v1/academic-analysis`

**Purpose | الغرض:** Analyze student academic performance and provide recommendations

**Request | الطلب:**
```typescript
interface AcademicAnalysisRequest {
  student_id: string;            // Student ID | معرف الطالب
  analysis_type: 'gpa' | 'courses' | 'progress' | 'risk';
  semester?: string;             // Specific semester | فصل محدد
}
```

**Response | الاستجابة:**
```typescript
interface AcademicAnalysisResponse {
  student_id: string;
  analysis: {
    current_gpa: number;         // Current GPA | المعدل الحالي
    projected_gpa?: number;      // Projected GPA | المعدل المتوقع
    completed_credits: number;   // Completed credits | الساعات المنجزة
    remaining_credits: number;   // Remaining credits | الساعات المتبقية
    risk_level: 'low' | 'medium' | 'high';
    recommendations: string[];   // Recommendations | التوصيات
  };
  courses_analysis?: CourseAnalysis[];
}
```

---

### 4. Early Warning | الإنذار المبكر

**Endpoint:** `POST /functions/v1/early-warning`

**Purpose | الغرض:** Detect students at risk of academic failure

**Request | الطلب:**
```typescript
interface EarlyWarningRequest {
  student_id?: string;           // Specific student | طالب محدد
  department?: string;           // Filter by department | تصفية حسب القسم
  threshold?: number;            // Risk threshold | عتبة الخطر
}
```

**Response | الاستجابة:**
```typescript
interface EarlyWarningResponse {
  at_risk_students: RiskStudent[];
  summary: {
    total_at_risk: number;       // Total at-risk count | العدد الكلي للمعرضين للخطر
    by_level: Record<string, number>;
  };
}

interface RiskStudent {
  student_id: string;
  risk_score: number;            // Risk score (0-100) | درجة الخطر
  risk_factors: string[];        // Risk factors | عوامل الخطر
  recommended_interventions: string[];
}
```

---

### 5. Vector Search | البحث المتجهي

**Endpoint:** `POST /functions/v1/vector-search`

**Purpose | الغرض:** Semantic search across academic documents

**Request | الطلب:**
```typescript
interface VectorSearchRequest {
  query: string;                 // Search query | استعلام البحث
  top_k?: number;                // Number of results | عدد النتائج
  metadata_filter?: {
    major?: string;              // Filter by major | تصفية حسب التخصص
    year?: number;               // Filter by year | تصفية حسب السنة
    department?: string;         // Filter by department | تصفية حسب القسم
    course_id?: string;          // Filter by course | تصفية حسب المقرر
  };
  use_hybrid?: boolean;          // Enable hybrid search | تفعيل البحث الهجين
}
```

**Response | الاستجابة:**
```typescript
interface VectorSearchResponse {
  results: SearchResult[];
  total: number;                 // Total matches | إجمالي المطابقات
  query: string;
  search_type: 'semantic' | 'keyword' | 'hybrid';
}

interface SearchResult {
  id: string;
  content: string;               // Matched content | المحتوى المطابق
  score: number;                 // Relevance score | درجة الصلة
  metadata: Record<string, any>;
}
```

---

### 6. Graph Query (Neo4j) | استعلام الرسم البياني

**Endpoint:** `POST /functions/v1/neo4j-query`

**Purpose | الغرض:** Query course relationships and prerequisite chains

**Request | الطلب:**
```typescript
interface Neo4jQueryRequest {
  query_type: 'prerequisites' | 'dependents' | 'path' | 'related';
  course_code: string;           // Course code | رمز المقرر
  depth?: number;                // Traversal depth | عمق الاستكشاف
}
```

**Response | الاستجابة:**
```typescript
interface Neo4jQueryResponse {
  nodes: GraphNode[];            // Graph nodes | عقد الرسم
  edges: GraphEdge[];            // Graph edges | حواف الرسم
  path?: string[];               // Path if requested | المسار إن طُلب
}

interface GraphNode {
  id: string;
  label: string;                 // Node label | تسمية العقدة
  properties: {
    code: string;                // Course code | رمز المقرر
    name: string;                // Course name | اسم المقرر
    credits: number;             // Credits | الساعات
    department: string;          // Department | القسم
  };
}

interface GraphEdge {
  source: string;                // Source node ID | معرف العقدة المصدر
  target: string;                // Target node ID | معرف العقدة الهدف
  relationship: string;          // Relationship type | نوع العلاقة
}
```

---

### 7. Memory Service | خدمة الذاكرة

**Endpoint:** `POST /functions/v1/memory-service`

**Purpose | الغرض:** Store and retrieve user preferences and context

**Operations | العمليات:**

#### Store Memory | تخزين الذاكرة
```typescript
// Request | الطلب
{
  operation: 'store',
  memory: {
    type: 'preference' | 'context' | 'interaction',
    content: any,
    importance: number,          // 1-10 scale | مقياس 1-10
    expires_days?: number        // Optional expiry | انتهاء اختياري
  }
}
```

#### Search Memory | البحث في الذاكرة
```typescript
// Request | الطلب
{
  operation: 'search',
  query: string,
  memory_types?: string[],       // Filter by types | تصفية حسب الأنواع
  limit?: number
}
```

#### Get User Preferences | جلب تفضيلات المستخدم
```typescript
// Request | الطلب
{
  operation: 'get_preferences'
}

// Response | الاستجابة
{
  preferred_language: 'ar' | 'en',
  communication_style: string,
  study_preferences: object,
  accessibility_needs: object
}
```

---

### 8. Cache Service | خدمة التخزين المؤقت

**Endpoint:** `POST /functions/v1/cache-service`

**Purpose | الغرض:** Cache management and rate limiting

**Operations | العمليات:**

#### Get Cache | جلب من الذاكرة المؤقتة
```typescript
{
  operation: 'get',
  key: string,
  metadata_filter?: Record<string, any>
}
```

#### Set Cache | تخزين في الذاكرة المؤقتة
```typescript
{
  operation: 'set',
  key: string,
  value: any,
  ttl_seconds?: number           // Time to live | مدة البقاء
}
```

#### Check Rate Limit | فحص حد المعدل
```typescript
{
  operation: 'rate_limit',
  user_id: string,
  endpoint: string,
  limit?: number,                // Max requests | الحد الأقصى
  window_seconds?: number        // Time window | نافذة الوقت
}
```

---

### 9. Study Materials | المواد الدراسية

**Endpoint:** `POST /functions/v1/study-materials`

**Purpose | الغرض:** Manage and retrieve study materials

**Request | الطلب:**
```typescript
interface StudyMaterialsRequest {
  action: 'list' | 'get' | 'search' | 'upload';
  course_id?: string;            // Filter by course | تصفية حسب المقرر
  material_id?: string;          // Specific material | مادة محددة
  query?: string;                // Search query | استعلام البحث
}
```

**Response | الاستجابة:**
```typescript
interface StudyMaterialsResponse {
  materials: Material[];
  total: number;
  has_more: boolean;
}

interface Material {
  id: string;
  title: string;                 // Material title | عنوان المادة
  title_ar?: string;             // Arabic title | العنوان العربي
  description: string;
  file_type: string;             // File type | نوع الملف
  file_url: string;              // Download URL | رابط التحميل
  course_id?: string;
  created_at: string;
  download_count: number;
}
```

---

### 10. Student Data Import | استيراد بيانات الطلاب

**Endpoint:** `POST /functions/v1/import-student-records`

**Purpose | الغرض:** Import academic records from Excel files

**Request | الطلب:**
```typescript
// Multipart form data | بيانات نموذج متعدد الأجزاء
{
  file: File,                    // Excel file | ملف Excel
  student_id: string,            // Student ID | الرقم الجامعي
  overwrite?: boolean            // Overwrite existing | الكتابة فوق الموجود
}
```

**Response | الاستجابة:**
```typescript
interface ImportResponse {
  success: boolean;
  imported_count: number;        // Records imported | السجلات المستوردة
  skipped_count: number;         // Records skipped | السجلات المتخطاة
  errors: ImportError[];
  summary: {
    total_courses: number;
    total_credits: number;
    calculated_gpa: number;
  };
}
```

---

## Supabase Database API | واجهة قاعدة البيانات

### Students Table | جدول الطلاب

```typescript
// Fetch student by user_id | جلب الطالب بمعرف المستخدم
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('user_id', userId)
  .single();

// Student interface | واجهة الطالب
interface Student {
  id: string;
  user_id: string;
  student_id: string;            // University ID | الرقم الجامعي
  department: string;            // Department | القسم
  major: string | null;          // Major | التخصص
  year_level: number;            // Year level | المستوى السنوي
  gpa: number | null;            // Current GPA | المعدل الحالي
  total_credits: number | null;  // Total credits | الساعات الكلية
  academic_warning: string | null;
  xp_points: number | null;      // XP points | نقاط الخبرة
  level: number | null;          // Gamification level | مستوى التلعيب
  streak_days: number | null;    // Active streak | سلسلة النشاط
}
```

### Academic Records | السجلات الأكاديمية

```typescript
// Fetch student records | جلب سجلات الطالب
const { data, error } = await supabase
  .from('student_academic_records')
  .select('*')
  .eq('student_id', studentId)
  .order('academic_year', { ascending: false })
  .order('semester', { ascending: false });

// Academic Record interface | واجهة السجل الأكاديمي
interface AcademicRecord {
  id: string;
  student_id: string;
  academic_year: string;         // e.g., "2024/2025"
  semester: string;              // e.g., "الفصل الأول"
  course_code: string;
  course_name: string;
  course_credits: number | null;
  final_grade: number | null;    // Grade (0-100) | الدرجة
  letter_grade: string | null;   // e.g., "A", "B+"
  grade_points: number | null;   // GPA points | نقاط المعدل
  cumulative_gpa_points: number | null;
  total_completed_hours: number | null;
  academic_warning: string | null;
}
```

### Courses | المقررات

```typescript
// Fetch courses with relations | جلب المقررات مع العلاقات
const { data, error } = await supabase
  .from('courses')
  .select(`
    *,
    course_prerequisites(
      prerequisite:prerequisite_id(code, name)
    ),
    course_skills(
      skill:skill_id(name, category)
    )
  `)
  .eq('department', department);

// Course interface | واجهة المقرر
interface Course {
  id: string;
  code: string;                  // Course code | رمز المقرر
  name: string;                  // English name | الاسم الإنجليزي
  name_ar: string | null;        // Arabic name | الاسم العربي
  department: string;
  credits: number;
  year_level: number;
  semester: string | null;
  description: string | null;
  is_bottleneck: boolean | null; // Critical course | مقرر حرج
  difficulty_rating: number | null;
}
```

### Chat Conversations | محادثات الدردشة

```typescript
// Fetch user conversations | جلب محادثات المستخدم
const { data, error } = await supabase
  .from('chat_conversations')
  .select(`
    *,
    chat_messages(*)
  `)
  .eq('user_id', userId)
  .order('updated_at', { ascending: false });

// Conversation interface | واجهة المحادثة
interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
```

---

## Error Handling | معالجة الأخطاء

### Error Response Format | تنسيق استجابة الخطأ

```typescript
interface ApiError {
  error: true;
  message: string;               // English message | الرسالة بالإنجليزية
  message_ar?: string;           // Arabic message | الرسالة بالعربية
  code: string;                  // Error code | رمز الخطأ
  details?: Record<string, any>;
}
```

### Error Codes | رموز الأخطاء

| Code | HTTP Status | Description | الوصف |
|------|-------------|-------------|-------|
| `AUTH_REQUIRED` | 401 | Authentication required | المصادقة مطلوبة |
| `FORBIDDEN` | 403 | Access denied | الوصول مرفوض |
| `NOT_FOUND` | 404 | Resource not found | المورد غير موجود |
| `RATE_LIMITED` | 429 | Too many requests | طلبات كثيرة جداً |
| `VALIDATION_ERROR` | 400 | Invalid input | إدخال غير صالح |
| `SERVER_ERROR` | 500 | Internal server error | خطأ داخلي في الخادم |

---

## Rate Limiting | تحديد المعدل

| Endpoint | Limit | Window | النافذة |
|----------|-------|--------|--------|
| `rag-query` | 30 | 1 minute | دقيقة واحدة |
| `agentic-chat` | 20 | 1 minute | دقيقة واحدة |
| `vector-search` | 60 | 1 minute | دقيقة واحدة |
| `academic-analysis` | 10 | 1 minute | دقيقة واحدة |

**Rate Limit Headers | رؤوس حد المعدل:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1704067200
Retry-After: 60  // Only on 429 | فقط عند 429
```

---

## Webhooks | خطافات الويب

### Available Events | الأحداث المتاحة

| Event | Trigger | الزناد |
|-------|---------|--------|
| `student.linked` | Student linked to user | ربط الطالب بالمستخدم |
| `records.imported` | Academic records imported | استيراد السجلات الأكاديمية |
| `achievement.earned` | Student earned achievement | كسب الطالب إنجاز |
| `warning.triggered` | Academic warning triggered | تفعيل إنذار أكاديمي |

---

*Last Updated | آخر تحديث: January 2026*
*API Version | إصدار الـ API: v1*
