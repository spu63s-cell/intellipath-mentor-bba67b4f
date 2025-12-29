import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// ERROR CODES & BILINGUAL MESSAGES
// =============================================================================
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERR_001',
  MISSING_API_KEY: 'CONFIG_ERR_001',
  RATE_LIMIT_EXCEEDED: 'RATE_ERR_001',
  PAYMENT_REQUIRED: 'PAYMENT_ERR_001',
  AI_GATEWAY_ERROR: 'AI_ERR_001',
  TOOL_EXECUTION_ERROR: 'TOOL_ERR_001',
  UNKNOWN_ERROR: 'UNKNOWN_ERR_001',
};

type ErrorCode = keyof typeof ERROR_CODES;

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    message_ar: string;
    details?: Record<string, unknown>;
  };
}

function createErrorResponse(
  code: ErrorCode,
  message: string,
  message_ar: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const body: ErrorResponse = {
    error: {
      code: ERROR_CODES[code],
      message,
      message_ar,
      ...(details && { details }),
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
});

const StudentContextSchema = z.object({
  gpa: z.number().min(0).max(4).optional(),
  department: z.string().max(100).optional(),
  year_level: z.number().min(1).max(6).optional(),
  credits_completed: z.number().min(0).max(500).optional(),
}).optional();

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  mode: z.enum(['agentic', 'rag', 'simple']).default('agentic'),
  student_context: StudentContextSchema,
  conversation_id: z.string().uuid().optional(),
});

// =============================================================================
// AGENTIC SYSTEM PROMPT
// =============================================================================
const AGENTIC_SYSTEM_PROMPT = `أنت "IntelliPath Agent" - نظام ذكاء اصطناعي متقدم للاستشارات الأكاديمية مع قدرات Agentic.

## قدراتك:
1. **التخطيط (Plan)**: تحليل السؤال وتحديد الخطوات المطلوبة
2. **التنفيذ (Execute)**: تنفيذ كل خطة باستخدام الأدوات المتاحة
3. **التأمل (Reflect)**: مراجعة النتائج وتحسين الإجابة

## الأدوات المتاحة:
- search_courses: البحث في المقررات الدراسية
- get_prerequisites: جلب المتطلبات السابقة للمقرر
- calculate_gpa: حساب المعدل التراكمي
- analyze_academic_risk: تحليل المخاطر الأكاديمية
- suggest_courses: اقتراح المقررات

## تنسيق الأفكار:
- [PLAN] وصف الخطة...
- [EXECUTE] تنفيذ الخطوة...
- [TOOL] اسم_الأداة: المعاملات...
- [RESULT] نتيجة الأداة...
- [REFLECT] مراجعة النتائج...
- [ANSWER] الإجابة النهائية...

## أقسام كلية الهندسة - SPU:
- هندسة المعلوماتية
- هندسة الاتصالات والإلكترونيات
- الهندسة المدنية
- الهندسة المعمارية
- هندسة الميكاترونيكس

## نظام الدرجات:
A (90-100): 4.0, B+ (85-89): 3.5, B (80-84): 3.0, C+ (75-79): 2.5, C (70-74): 2.0, D+ (65-69): 1.5, D (60-64): 1.0, F (<60): 0.0`;

// =============================================================================
// TOOLS DEFINITIONS
// =============================================================================
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_courses",
      description: "البحث في قاعدة بيانات المقررات الدراسية",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "نص البحث" },
          department: { type: "string", description: "القسم (اختياري)" },
          year_level: { type: "number", description: "السنة الدراسية (اختياري)" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_prerequisites",
      description: "جلب المتطلبات السابقة لمقرر معين",
      parameters: {
        type: "object",
        properties: {
          course_code: { type: "string", description: "رمز المقرر" }
        },
        required: ["course_code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_gpa",
      description: "حساب المعدل التراكمي بناءً على الدرجات",
      parameters: {
        type: "object",
        properties: {
          grades: {
            type: "array",
            items: {
              type: "object",
              properties: {
                grade: { type: "number" },
                credits: { type: "number" }
              }
            }
          }
        },
        required: ["grades"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_academic_risk",
      description: "تحليل المخاطر الأكاديمية للطالب",
      parameters: {
        type: "object",
        properties: {
          gpa: { type: "number", description: "المعدل التراكمي الحالي" },
          credits_completed: { type: "number", description: "الساعات المكتملة" },
          year_level: { type: "number", description: "السنة الدراسية" }
        },
        required: ["gpa"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_courses",
      description: "اقتراح المقررات المناسبة للفصل القادم",
      parameters: {
        type: "object",
        properties: {
          department: { type: "string" },
          completed_courses: { type: "array", items: { type: "string" } },
          target_credits: { type: "number" }
        },
        required: ["department"]
      }
    }
  }
];

// =============================================================================
// TOOL EXECUTION FUNCTIONS
// =============================================================================
async function executeTool(toolName: string, args: unknown, supabase: any): Promise<unknown> {
  console.log(`Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case "search_courses":
        return await searchCourses(args as any, supabase);
      case "get_prerequisites":
        return await getPrerequisites(args as any, supabase);
      case "calculate_gpa":
        return calculateGPA(args as any);
      case "analyze_academic_risk":
        return analyzeRisk(args as any);
      case "suggest_courses":
        return await suggestCourses(args as any, supabase);
      default:
        return { error: `Unknown tool: ${toolName}`, error_ar: `أداة غير معروفة: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool execution error [${toolName}]:`, error);
    return { 
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error_ar: 'فشل في تنفيذ الأداة'
    };
  }
}

async function searchCourses(args: { query: string; department?: string; year_level?: number }, supabase: any) {
  const { query, department, year_level } = args;
  
  // Sanitize search input
  const sanitizedQuery = query.trim().slice(0, 100).replace(/[%_]/g, '');
  
  let queryBuilder = supabase
    .from('courses')
    .select('code, name, name_ar, credits, year_level, department')
    .or(`name.ilike.%${sanitizedQuery}%,name_ar.ilike.%${sanitizedQuery}%,code.ilike.%${sanitizedQuery}%`)
    .eq('is_active', true);
  
  if (department) {
    queryBuilder = queryBuilder.eq('department', department.trim().slice(0, 50));
  }
  if (year_level && year_level >= 1 && year_level <= 6) {
    queryBuilder = queryBuilder.eq('year_level', year_level);
  }
  
  const { data, error } = await queryBuilder.limit(10);
  
  if (error) {
    console.error("Search error:", error);
    return { error: error.message, courses: [], count: 0 };
  }
  
  return { courses: data || [], count: data?.length || 0 };
}

async function getPrerequisites(args: { course_code: string }, supabase: any) {
  const courseCode = args.course_code.trim().slice(0, 20).toUpperCase();
  
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, code, name, name_ar, credits, year_level')
    .eq('code', courseCode)
    .single();
  
  if (courseError) {
    return { 
      error: `Course not found: ${courseCode}`, 
      error_ar: `المقرر غير موجود: ${courseCode}` 
    };
  }
  
  const { data: prerequisites } = await supabase
    .from('course_prerequisites')
    .select(`
      prerequisite:courses!course_prerequisites_prerequisite_id_fkey(
        code, name, name_ar, credits
      )
    `)
    .eq('course_id', course.id);
  
  return {
    course,
    prerequisites: prerequisites?.map((p: any) => p.prerequisite) || []
  };
}

function calculateGPA(args: { grades: Array<{ grade: number; credits: number }> }) {
  const { grades } = args;
  
  if (!grades || grades.length === 0) {
    return { error: "No grades provided", error_ar: "لم يتم تقديم أي درجات" };
  }
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const g of grades) {
    if (typeof g.grade !== 'number' || typeof g.credits !== 'number') continue;
    if (g.credits < 0 || g.credits > 10) continue;
    
    const gradePoint = convertToGradePoint(Math.min(100, Math.max(0, g.grade)));
    totalPoints += gradePoint * g.credits;
    totalCredits += g.credits;
  }
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    letterGrade: getLetterGrade(gpa)
  };
}

function convertToGradePoint(grade: number): number {
  if (grade >= 90) return 4.0;
  if (grade >= 85) return 3.5;
  if (grade >= 80) return 3.0;
  if (grade >= 75) return 2.5;
  if (grade >= 70) return 2.0;
  if (grade >= 65) return 1.5;
  if (grade >= 60) return 1.0;
  return 0.0;
}

function getLetterGrade(gpa: number): string {
  if (gpa >= 3.7) return "A";
  if (gpa >= 3.3) return "B+";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.7) return "C+";
  if (gpa >= 2.3) return "C";
  if (gpa >= 2.0) return "D+";
  if (gpa >= 1.0) return "D";
  return "F";
}

function analyzeRisk(args: { gpa: number; credits_completed?: number; year_level?: number }) {
  const gpa = Math.min(4, Math.max(0, args.gpa || 0));
  const credits_completed = Math.min(500, Math.max(0, args.credits_completed || 0));
  const year_level = Math.min(6, Math.max(1, args.year_level || 1));
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let riskScore = 0;
  const factors: Array<{ name: string; name_en: string; weight: number }> = [];
  const recommendations: Array<{ ar: string; en: string }> = [];
  
  // GPA-based risk
  if (gpa < 2.0) {
    riskLevel = 'critical';
    riskScore += 40;
    factors.push({ name: 'المعدل أقل من 2.0 (إنذار أكاديمي)', name_en: 'GPA below 2.0 (Academic Warning)', weight: 40 });
    recommendations.push({ ar: 'التواصل مع المرشد الأكاديمي فوراً', en: 'Contact academic advisor immediately' });
  } else if (gpa < 2.5) {
    riskLevel = 'high';
    riskScore += 25;
    factors.push({ name: 'المعدل منخفض (أقل من 2.5)', name_en: 'Low GPA (below 2.5)', weight: 25 });
    recommendations.push({ ar: 'تقليل عدد الساعات في الفصل القادم', en: 'Reduce credit hours next semester' });
  } else if (gpa < 3.0) {
    riskLevel = 'medium';
    riskScore += 15;
    factors.push({ name: 'المعدل متوسط', name_en: 'Average GPA', weight: 15 });
    recommendations.push({ ar: 'التركيز على تحسين الأداء', en: 'Focus on improving performance' });
  }
  
  // Credits progress
  const expectedCredits = year_level * 30;
  if (credits_completed < expectedCredits * 0.7) {
    riskScore += 15;
    factors.push({ name: 'تأخر في الساعات المعتمدة', name_en: 'Behind on credit hours', weight: 15 });
    recommendations.push({ ar: 'التسجيل في ساعات إضافية إن أمكن', en: 'Register for additional credits if possible' });
  }
  
  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    factors,
    recommendations: recommendations.map(r => r.ar),
    recommendations_en: recommendations.map(r => r.en),
    predictedGpa: gpa
  };
}

async function suggestCourses(args: { department: string; completed_courses?: string[]; target_credits?: number }, supabase: any) {
  const department = args.department.trim().slice(0, 50);
  const completed_courses = (args.completed_courses || []).slice(0, 50);
  const target_credits = Math.min(24, Math.max(3, args.target_credits || 15));
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('code, name, name_ar, credits, year_level')
    .eq('department', department)
    .eq('is_active', true)
    .order('year_level', { ascending: true })
    .limit(20);
  
  if (error) {
    return { error: error.message, suggestedCourses: [] };
  }
  
  const completedSet = new Set(completed_courses.map(c => c.toUpperCase()));
  const available = (courses || []).filter((c: any) => !completedSet.has(c.code.toUpperCase()));
  
  let totalCredits = 0;
  const suggested: any[] = [];
  
  for (const course of available) {
    if (totalCredits + course.credits <= target_credits) {
      suggested.push(course);
      totalCredits += course.credits;
    }
  }
  
  return {
    suggestedCourses: suggested,
    totalCredits,
    remainingCredits: target_credits - totalCredits
  };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid JSON in request body',
        'JSON غير صالح في جسم الطلب',
        400
      );
    }
    
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error("Validation errors:", errors);
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Validation failed: ${errors.join(', ')}`,
        'فشل التحقق من البيانات المدخلة',
        400,
        { errors }
      );
    }
    
    const { messages, mode, student_context } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      return createErrorResponse(
        'MISSING_API_KEY',
        'AI service is not configured',
        'خدمة الذكاء الاصطناعي غير مكونة',
        500
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Processing ${mode} chat request with ${messages.length} messages`);

    // Build context from student data
    let contextMessage = "";
    if (student_context) {
      contextMessage = `
معلومات الطالب الحالي:
- المعدل التراكمي: ${student_context.gpa ?? 'غير محدد'}
- القسم: ${student_context.department ?? 'غير محدد'}
- السنة الدراسية: ${student_context.year_level ?? 'غير محدد'}
- الساعات المكتملة: ${student_context.credits_completed ?? 'غير محدد'}
`;
    }

    // Agentic mode with tool calling
    if (mode === 'agentic') {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: AGENTIC_SYSTEM_PROMPT + contextMessage },
            ...messages,
          ],
          tools: TOOLS,
          tool_choice: "auto",
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return createErrorResponse(
            'RATE_LIMIT_EXCEEDED',
            'Too many requests. Please try again later.',
            'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً',
            429
          );
        }
        
        if (response.status === 402) {
          return createErrorResponse(
            'PAYMENT_REQUIRED',
            'Please add credits to use AI features.',
            'يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي',
            402
          );
        }
        
        return createErrorResponse(
          'AI_GATEWAY_ERROR',
          `AI service error: ${response.status}`,
          'حدث خطأ في خدمة الذكاء الاصطناعي',
          502
        );
      }

      // Stream the response with tool call handling
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = decoder.decode(chunk);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const delta = data.choices?.[0]?.delta;
                
                // Check for tool calls
                if (delta?.tool_calls) {
                  for (const toolCall of delta.tool_calls) {
                    if (toolCall.function?.name && toolCall.function?.arguments) {
                      try {
                        const args = JSON.parse(toolCall.function.arguments);
                        const result = await executeTool(toolCall.function.name, args, supabase);
                        
                        const toolEvent = {
                          type: 'tool_result',
                          tool: toolCall.function.name,
                          result
                        };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolEvent)}\n\n`));
                      } catch (e) {
                        console.error("Tool execution error:", e);
                      }
                    }
                  }
                }
                
                // Forward content
                if (delta?.content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`));
                }
              } catch {
                controller.enqueue(encoder.encode(line + '\n'));
              }
            } else {
              controller.enqueue(encoder.encode(line + '\n'));
            }
          }
        }
      });

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Standard RAG/Simple mode
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: AGENTIC_SYSTEM_PROMPT + contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return createErrorResponse(
        'AI_GATEWAY_ERROR',
        `AI service error: ${response.status}`,
        'حدث خطأ في خدمة الذكاء الاصطناعي',
        502
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Agentic chat error:", error);
    return createErrorResponse(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500
    );
  }
});
