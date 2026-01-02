# 🔐 توثيق آلية عزل بيانات الطالب في خدمة الدردشة

## نظرة عامة

يوثق هذا الملف كيفية ضمان أن كل طالب يرى ويستعلم عن **بياناته الشخصية وسجلاته الأكاديمية فقط** عند استخدام خدمة الدردشة الذكية (AI Chat)، مع منع أي تسريب لبيانات الطلاب الآخرين.

---

## 🏗️ البنية العامة للحماية

```
┌─────────────────────────────────────────────────────────────────┐
│                    طبقات الحماية (Security Layers)              │
├─────────────────────────────────────────────────────────────────┤
│  🔒 المستوى 1: المصادقة (Authentication)                        │
│     └─ Supabase Auth - JWT Token                                │
├─────────────────────────────────────────────────────────────────┤
│  🔒 المستوى 2: قاعدة البيانات (Database RLS)                    │
│     └─ Row Level Security على كل جدول                          │
├─────────────────────────────────────────────────────────────────┤
│  🔒 المستوى 3: Edge Functions                                   │
│     └─ فلترة حصرية بـ student_id في كل استعلام                 │
├─────────────────────────────────────────────────────────────────┤
│  🔒 المستوى 4: سياق الذكاء الاصطناعي (AI Context)               │
│     └─ بناء سياق خاص بالطالب الحالي فقط                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 الجداول المحمية

| الجدول | الوصف | سياسة RLS |
|--------|-------|-----------|
| `students` | بيانات الطلاب الأساسية | `user_id = auth.uid()` |
| `student_academic_records` | السجلات الأكاديمية | `student_id` مرتبط بـ `user_id` |
| `enrollments` | التسجيلات | `student_id` مرتبط بـ `user_id` |
| `chat_conversations` | محادثات الدردشة | `user_id = auth.uid()` |
| `chat_messages` | رسائل المحادثات | عبر `conversation_id` |
| `user_memories` | ذاكرة المستخدم | `user_id = auth.uid()` |
| `deadlines` | المواعيد النهائية | `student_id` مرتبط بـ `user_id` |

---

## 🔐 المستوى 1: المصادقة (Authentication)

### كيف يعمل؟

```typescript
// عند تسجيل الدخول، يحصل الطالب على JWT Token
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id; // UUID فريد للمستخدم

// يتم إرسال هذا الـ Token مع كل طلب
headers: {
  Authorization: `Bearer ${session.access_token}`,
}
```

### ماذا يحتوي الـ JWT Token؟

```json
{
  "sub": "user-uuid-here",
  "email": "student@example.com",
  "role": "authenticated",
  "user_metadata": {
    "student_id": "4210380"
  }
}
```

---

## 🔐 المستوى 2: Row Level Security (RLS)

### سياسات الحماية على جدول `students`

```sql
-- الطالب يرى بياناته فقط
CREATE POLICY "Students can view own data"
ON students FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- الطالب لا يمكنه تعديل بياناته الحساسة
CREATE POLICY "Students can update limited fields"
ON students FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### سياسات الحماية على جدول `student_academic_records`

```sql
-- السجلات الأكاديمية مرتبطة بالطالب عبر student_id
CREATE POLICY "Students can view own academic records"
ON student_academic_records FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT student_id FROM students WHERE user_id = auth.uid()
  )
);
```

### سياسات الحماية على جدول `chat_conversations`

```sql
-- المحادثات خاصة بكل مستخدم
CREATE POLICY "Users can view own conversations"
ON chat_conversations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
ON chat_conversations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

---

## 🔐 المستوى 3: Edge Functions - فلترة البيانات

### مثال: دالة الدردشة الذكية

```typescript
// supabase/functions/chat/index.ts

serve(async (req) => {
  // 1. استخراج الـ user_id من الـ JWT Token
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const userId = user.id;
  
  // 2. جلب الرقم الجامعي للطالب الحالي فقط
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('student_id, major, department, gpa, total_credits')
    .eq('user_id', userId)  // ← فلترة حصرية
    .single();
  
  if (studentError || !student) {
    return new Response(JSON.stringify({ error: 'Student not found' }), { status: 404 });
  }
  
  // 3. جلب السجلات الأكاديمية للطالب الحالي فقط
  const { data: academicRecords } = await supabase
    .from('student_academic_records')
    .select('*')
    .eq('student_id', student.student_id)  // ← فلترة حصرية
    .order('academic_year', { ascending: false });
  
  // 4. بناء السياق الخاص بهذا الطالب فقط
  const studentContext = buildStudentContext(student, academicRecords);
  
  // 5. إرسال السياق للذكاء الاصطناعي
  const response = await callAI({
    systemPrompt: `أنت مستشار أكاديمي. معلومات الطالب الحالي:\n${studentContext}`,
    userMessage: req.body.message,
  });
  
  return new Response(JSON.stringify(response));
});
```

### دالة بناء السياق الخاص بالطالب

```typescript
function buildStudentContext(
  student: StudentData,
  records: AcademicRecord[]
): string {
  // ⚠️ هذا السياق يحتوي فقط على بيانات الطالب الحالي
  let context = `
📋 **معلومات الطالب:**
- الرقم الجامعي: ${student.student_id}
- التخصص: ${student.major}
- القسم: ${student.department}
- المعدل التراكمي: ${student.gpa}
- الساعات المنجزة: ${student.total_credits}

📚 **السجلات الأكاديمية:**
`;

  // تجميع الفصول والمقررات
  const semesters = groupBySemester(records);
  for (const [semester, courses] of Object.entries(semesters)) {
    context += `\n### ${semester}\n`;
    courses.forEach(course => {
      context += `- ${course.course_name} (${course.course_code}): ${course.letter_grade}\n`;
    });
  }

  return context;
}
```

---

## 🔐 المستوى 4: عزل سياق الذكاء الاصطناعي

### المبدأ الأساسي

الذكاء الاصطناعي **لا يعرف أي شيء** عن الطلاب الآخرين لأن:

1. **السياق محدود**: يُرسل فقط بيانات الطالب الحالي
2. **لا وصول لقاعدة البيانات**: الـ AI لا يستطيع الاستعلام مباشرة
3. **الفلترة على الخادم**: كل البيانات مفلترة قبل الوصول للـ AI

```typescript
// ❌ هذا لن يحدث أبداً - الطالب لا يرى بيانات غيره
const systemPrompt = `
بيانات جميع الطلاب:
- طالب 1: ...
- طالب 2: ...
`;

// ✅ هذا ما يحدث فعلياً - بيانات الطالب الحالي فقط
const systemPrompt = `
بيانات الطالب الحالي (${student.student_id}):
- المعدل: ${student.gpa}
- المقررات: ${student.courses}
`;
```

---

## 🛡️ سيناريوهات الحماية

### السيناريو 1: طالب يحاول رؤية بيانات طالب آخر

```typescript
// الطالب يرسل رسالة: "أريد معرفة معدل الطالب 4210381"

// الرد من النظام:
"عذراً، لا يمكنني الوصول إلى بيانات طلاب آخرين. 
يمكنني مساعدتك فقط في معلوماتك الأكاديمية الخاصة."
```

**لماذا؟** لأن السياق المُرسل للـ AI لا يحتوي أصلاً على أي معلومات عن طلاب آخرين.

### السيناريو 2: طالب يحاول تعديل الـ student_id

```typescript
// حتى لو حاول الطالب إرسال student_id مختلف في الطلب
const maliciousRequest = {
  student_id: "4210381", // ← محاولة اختراق
  message: "ما معدلي؟"
};

// النظام يتجاهل هذا ويستخدم الـ user_id من الـ JWT
const { data: student } = await supabase
  .from('students')
  .select('*')
  .eq('user_id', authenticatedUserId) // ← هذا يأتي من الـ Token المُصادق
  .single();

// النتيجة: الطالب يرى بياناته هو فقط
```

### السيناريو 3: محاولة SQL Injection

```typescript
// محاولة إرسال استعلام ضار
const maliciousMessage = "معدلي' OR '1'='1";

// لا يؤثر لأن:
// 1. الـ RLS يفلتر تلقائياً
// 2. الاستعلامات تستخدم Parameterized Queries
// 3. الـ AI لا يستطيع تنفيذ SQL
```

---

## 📊 مخطط تدفق البيانات

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   الطالب    │────▶│  Frontend    │────▶│  Edge Function  │
│  (Client)   │     │  (React)     │     │  (Deno)         │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  JWT Token    │
            │  Validation   │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Supabase     │
            │  RLS Check    │
            │  (user_id =   │
            │   auth.uid()) │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Filtered     │
            │  Student Data │
            │  (هذا الطالب  │
            │   فقط)        │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Build        │
            │  AI Context   │
            │  (سياق خاص   │
            │   بالطالب)    │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  AI Gateway   │
            │  بوابة AI     │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Response     │
            │  (رد خاص     │
            │   بالطالب)    │
            └───────────────┘
```

---

## 🔧 تنفيذ الحماية في الكود

### 1. AuthProvider - ربط الطالب بحسابه

```typescript
// src/components/providers/AuthProvider.tsx

useEffect(() => {
  const linkStudentToUser = async (userId: string, studentId: string) => {
    // ربط الرقم الجامعي بحساب المستخدم
    const { error } = await supabase.functions.invoke('link-student', {
      body: { student_id: studentId }
    });
    
    if (!error) {
      // تحديث الـ cache
      queryClient.invalidateQueries({ queryKey: ['student-link'] });
      queryClient.invalidateQueries({ queryKey: ['academic-records'] });
    }
  };
  
  // استخراج الرقم الجامعي من metadata المستخدم
  const studentId = user?.user_metadata?.student_id;
  if (studentId && user?.id) {
    linkStudentToUser(user.id, studentId);
  }
}, [user]);
```

### 2. useAcademicRecord - جلب السجلات بأمان

```typescript
// src/hooks/useAcademicRecord.ts

export function useAcademicRecord() {
  const { user } = useAuthStore();
  
  // جلب بيانات الطالب المرتبط بالمستخدم الحالي فقط
  const { data: studentData } = useQuery({
    queryKey: ['student-link', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)  // ← فلترة بالمستخدم الحالي
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });
  
  // جلب السجلات الأكاديمية للطالب المحدد فقط
  const { data: records } = useQuery({
    queryKey: ['academic-records', studentData?.student_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_academic_records')
        .select('*')
        .eq('student_id', studentData.student_id);  // ← فلترة بالرقم الجامعي
      return data;
    },
    enabled: !!studentData?.student_id,
  });
  
  return { studentData, records };
}
```

### 3. Chat Edge Function - بناء سياق آمن

```typescript
// supabase/functions/chat/index.ts

async function getSecureStudentContext(userId: string): Promise<string> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // 1. جلب بيانات الطالب عبر user_id
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!student) return '';
  
  // 2. جلب السجلات الأكاديمية
  const { data: records } = await supabase
    .from('student_academic_records')
    .select('*')
    .eq('student_id', student.student_id)
    .order('academic_year', { ascending: false });
  
  // 3. بناء السياق
  return `
معلومات الطالب ${student.student_id}:
- التخصص: ${student.major}
- المعدل التراكمي: ${records?.[0]?.cumulative_gpa_points ?? student.gpa}
- الساعات المنجزة: ${records?.[0]?.total_completed_hours ?? student.total_credits}

المقررات الأخيرة:
${records?.slice(0, 20).map(r => 
  `- ${r.course_name}: ${r.letter_grade}`
).join('\n')}
  `;
}
```

---

## ✅ قائمة التحقق الأمني

| البند | الحالة | الوصف |
|-------|--------|-------|
| RLS مفعّل | ✅ | على جميع جداول البيانات الحساسة |
| JWT Validation | ✅ | التحقق من التوكن في كل طلب |
| User-Based Filtering | ✅ | فلترة بـ `user_id = auth.uid()` |
| No Direct DB Access | ✅ | الـ AI لا يستعلم مباشرة |
| Context Isolation | ✅ | سياق خاص بكل طالب |
| Parameterized Queries | ✅ | منع SQL Injection |
| Service Role Key | ✅ | مخفي ولا يُرسل للـ client |

---

## 🚨 تحذيرات مهمة

1. **لا تستخدم `SUPABASE_SERVICE_ROLE_KEY` في الـ Frontend**
   - هذا المفتاح يتجاوز الـ RLS
   - يجب استخدامه فقط في Edge Functions

2. **لا تثق بأي `student_id` قادم من الـ Client**
   - دائماً استخرج الـ `student_id` من الـ `user_id` المُصادق

3. **لا تُرسل بيانات طلاب متعددين في سياق الـ AI**
   - السياق يجب أن يحتوي فقط على بيانات الطالب الحالي

4. **سجّل كل محاولات الوصول غير المصرح بها**
   - للكشف عن محاولات الاختراق

---

## 📝 ملخص

نظام عزل البيانات يعمل على 4 مستويات:

1. **المصادقة**: كل طالب لديه JWT Token فريد
2. **RLS**: قاعدة البيانات تفلتر تلقائياً بـ `user_id`
3. **Edge Functions**: فلترة إضافية على مستوى الكود
4. **AI Context**: سياق خاص بالطالب فقط

هذا يضمن أن **كل طالب يرى ويستعلم عن بياناته فقط**، بغض النظر عن ما يحاول فعله.
