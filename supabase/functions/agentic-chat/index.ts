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
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().max(10000),
  tool_call_id: z.string().optional(),
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
const AGENTIC_SYSTEM_PROMPT = `أنت "IntelliPath" - المستشار الأكاديمي الذكي للجامعة السورية الخاصة.

## مهمتك:
مساعدة الطلاب في الاستفسارات الأكاديمية باستخدام الأدوات المتاحة للبحث في قاعدة البيانات.

## قواعد مهمة جداً:
1. استخدم الأدوات المتاحة للحصول على معلومات دقيقة من قاعدة البيانات
2. قدم الإجابة بشكل منظم وجميل باللغة العربية
3. عند عرض المقررات، اعرضها بشكل قائمة واضحة مع:
   - رمز المقرر
   - اسم المقرر
   - عدد الساعات المعتمدة
4. لا تخترع معلومات - استخدم فقط ما تجده من قاعدة البيانات

## التخصصات في كلية الهندسة المعلوماتية:
1. الذكاء الصنعي وعلوم البيانات (AI) - major_id يحتوي على "AI"
2. هندسة البرمجيات ونظم المعلومات (IS)
3. أمن النظم والشبكات الحاسوبية (SS)
4. هندسة الاتصالات (COM)
5. هندسة التحكم والروبوت (CR)

## نظام الدرجات:
A (90-100): 4.0, B+ (85-89): 3.5, B (80-84): 3.0, C+ (75-79): 2.5, C (70-74): 2.0, D+ (65-69): 1.5, D (60-64): 1.0, F (<60): 0.0

## عند السؤال عن مقررات تخصص معين:
- استخدم أداة search_courses مع التخصص المناسب (AI, IS, SS, COM, CR)
- حدد السنة إذا طلبها المستخدم
- قدم النتائج بشكل منظم`;

// =============================================================================
// TOOLS DEFINITIONS
// =============================================================================
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_courses",
      description: "البحث في قاعدة بيانات المقررات الدراسية حسب التخصص والسنة الدراسية",
      parameters: {
        type: "object",
        properties: {
          major: { 
            type: "string", 
            description: "التخصص: AI للذكاء الصنعي، IS للبرمجيات، SS للأمن، COM للاتصالات، CR للروبوت",
            enum: ["AI", "IS", "SS", "COM", "CR"]
          },
          year_level: { 
            type: "number", 
            description: "السنة الدراسية من 1 إلى 5" 
          },
          query: { 
            type: "string", 
            description: "نص البحث الإضافي" 
          }
        },
        required: []
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
  }
];

// =============================================================================
// TOOL EXECUTION FUNCTIONS
// =============================================================================
async function executeTool(toolName: string, args: unknown, supabase: any): Promise<unknown> {
  console.log(`Executing tool: ${toolName}`, JSON.stringify(args));
  
  try {
    switch (toolName) {
      case "search_courses":
        return await searchCourses(args as any, supabase);
      case "get_prerequisites":
        return await getPrerequisites(args as any, supabase);
      case "calculate_gpa":
        return calculateGPA(args as any);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool execution error [${toolName}]:`, error);
    return { error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function searchCourses(args: { query?: string; major?: string; year_level?: number }, supabase: any) {
  const { query, major, year_level } = args;
  
  console.log("Searching courses with:", { query, major, year_level });
  
  // Map major code to major names for searching
  const majorMapping: Record<string, string[]> = {
    'AI': ['الذكاء الصنعي', 'Artificial Intelligence', 'AI', 'علوم البيانات'],
    'IS': ['هندسة البرمجيات', 'نظم المعلومات', 'Software Engineering', 'IS'],
    'SS': ['أمن النظم', 'الشبكات', 'System Security', 'SS'],
    'COM': ['الاتصالات', 'Communication', 'COM'],
    'CR': ['التحكم', 'الروبوت', 'Control', 'Robotics', 'CR'],
  };
  
  // First, get the major ID from the majors table
  let majorId: string | null = null;
  if (major && majorMapping[major.toUpperCase()]) {
    const majorNames = majorMapping[major.toUpperCase()];
    const { data: majorData } = await supabase
      .from('majors')
      .select('id, name, name_en')
      .limit(10);
    
    console.log("All majors:", majorData);
    
    // Find matching major
    if (majorData) {
      for (const m of majorData) {
        for (const searchTerm of majorNames) {
          if (m.name?.includes(searchTerm) || m.name_en?.toLowerCase().includes(searchTerm.toLowerCase())) {
            majorId = m.id;
            console.log("Found major:", m);
            break;
          }
        }
        if (majorId) break;
      }
    }
  }
  
  // If we found a major, get courses through course_majors junction table
  if (majorId) {
    const { data: courseMajorData, error } = await supabase
      .from('course_majors')
      .select(`
        is_required,
        courses (
          code, name, name_ar, credits, year_level, department, hours_theory, hours_lab
        )
      `)
      .eq('major_id', majorId);
    
    if (error) {
      console.error("Course search error:", error);
      return { error: error.message, courses: [], count: 0 };
    }
    
    // Extract courses
    let courses = (courseMajorData || [])
      .map((cm: any) => cm.courses)
      .filter((c: any) => c && c.code);
    
    // Filter by year if specified
    if (year_level && year_level >= 1 && year_level <= 5) {
      courses = courses.filter((c: any) => c.year_level === year_level);
    }
    
    // Sort by year and code
    courses.sort((a: any, b: any) => (a.year_level - b.year_level) || a.code.localeCompare(b.code));
    
    console.log(`Found ${courses.length} courses for major ${major}, year ${year_level || 'all'}`);
    
    return { 
      courses: courses.slice(0, 25), 
      count: courses.length,
      major: major?.toUpperCase(),
      year_level,
      message: courses.length > 0 
        ? `تم إيجاد ${courses.length} مقرر` 
        : 'لم يتم إيجاد مقررات'
    };
  }
  
  // Fallback: search by text in courses table directly
  let queryBuilder = supabase
    .from('courses')
    .select('code, name, name_ar, credits, year_level, department, hours_theory, hours_lab')
    .eq('is_active', true);
  
  if (year_level && year_level >= 1 && year_level <= 5) {
    queryBuilder = queryBuilder.eq('year_level', year_level);
  }
  
  if (query) {
    const sanitizedQuery = query.trim().slice(0, 100).replace(/[%_]/g, '');
    queryBuilder = queryBuilder.or(`name.ilike.%${sanitizedQuery}%,name_ar.ilike.%${sanitizedQuery}%,code.ilike.%${sanitizedQuery}%`);
  }
  
  const { data, error } = await queryBuilder.order('year_level').limit(20);
  
  if (error) {
    console.error("Search error:", error);
    return { error: error.message, courses: [], count: 0 };
  }
  
  return { 
    courses: data || [], 
    count: data?.length || 0,
    message: data?.length ? `تم إيجاد ${data.length} مقرر` : 'لم يتم إيجاد مقررات'
  };
}

async function getPrerequisites(args: { course_code: string }, supabase: any) {
  const courseCode = args.course_code.trim().slice(0, 20).toUpperCase();
  
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, code, name, name_ar, credits, year_level')
    .eq('code', courseCode)
    .single();
  
  if (courseError || !course) {
    return { error: `المقرر غير موجود: ${courseCode}` };
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
    return { error: "لم يتم تقديم أي درجات" };
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

    // For agentic mode, we use non-streaming with tool calling loop
    if (mode === 'agentic') {
      const aiMessages: any[] = [
        { role: "system", content: AGENTIC_SYSTEM_PROMPT + contextMessage },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ];

      let finalResponse = '';
      let iterations = 0;
      const maxIterations = 5;

      // Tool calling loop
      while (iterations < maxIterations) {
        iterations++;
        console.log(`AI iteration ${iterations}`);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: aiMessages,
            tools: TOOLS,
            tool_choice: "auto",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI gateway error:", response.status, errorText);
          
          if (response.status === 429) {
            return createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests.', 'تم تجاوز الحد المسموح من الطلبات', 429);
          }
          if (response.status === 402) {
            return createErrorResponse('PAYMENT_REQUIRED', 'Please add credits.', 'يرجى إضافة رصيد', 402);
          }
          return createErrorResponse('AI_GATEWAY_ERROR', `AI error: ${response.status}`, 'خطأ في خدمة الذكاء الاصطناعي', 502);
        }

        const data = await response.json();
        console.log("AI response:", JSON.stringify(data, null, 2));

        const choice = data.choices?.[0];
        if (!choice) {
          return createErrorResponse('AI_GATEWAY_ERROR', 'No response from AI', 'لا يوجد رد من الذكاء الاصطناعي', 502);
        }

        const message = choice.message;

        // Check if AI wants to call tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log("AI requested tool calls:", message.tool_calls.length);
          
          // Add assistant message with tool calls
          aiMessages.push({
            role: "assistant",
            content: message.content || null,
            tool_calls: message.tool_calls,
          });

          // Execute each tool and add results
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function?.name;
            const toolArgs = toolCall.function?.arguments;
            
            if (toolName && toolArgs) {
              try {
                const args = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs;
                const result = await executeTool(toolName, args, supabase);
                
                console.log(`Tool ${toolName} result:`, JSON.stringify(result));
                
                aiMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(result),
                });
              } catch (e) {
                console.error(`Tool parse error:`, e);
                aiMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ error: "Failed to execute tool" }),
                });
              }
            }
          }

          // Continue the loop to get AI's response after tool execution
          continue;
        }

        // No more tool calls - we have the final response
        finalResponse = message.content || '';
        break;
      }

      if (!finalResponse) {
        finalResponse = "عذراً، لم أتمكن من الحصول على إجابة. يرجى المحاولة مرة أخرى.";
      }

      // Stream the final response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send content in chunks for streaming effect
          const words = finalResponse.split(' ');
          let currentText = '';
          
          for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Simple/RAG mode - direct streaming without tool calling
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
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests.', 'تم تجاوز الحد المسموح', 429);
      }
      if (response.status === 402) {
        return createErrorResponse('PAYMENT_REQUIRED', 'Please add credits.', 'يرجى إضافة رصيد', 402);
      }
      return createErrorResponse('AI_GATEWAY_ERROR', `AI error: ${response.status}`, 'خطأ في الذكاء الاصطناعي', 502);
    }

    // Transform the stream to our format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              // Forward as-is
              controller.enqueue(encoder.encode(line + '\n'));
            }
          } else if (line === 'data: [DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
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
