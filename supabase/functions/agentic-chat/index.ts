import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agentic RAG System Prompt
const AGENTIC_SYSTEM_PROMPT = `أنت "IntelliPath Agent" - نظام ذكاء اصطناعي متقدم للاستشارات الأكاديمية مع قدرات Agentic.

## قدراتك:
1. **التخطيط (Plan)**: تحليل السؤال وتحديد الخطوات المطلوبة
2. **التنفيذ (Execute)**: تنفيذ كل خطة باستخدام الأدوات المتاحة
3. **التأمل (Reflect)**: مراجعة النتائج وتحسين الإجابة

## الأدوات المتاحة:
- search_courses: البحث في المقررات الدراسية
- get_prerequisites: جلب المتطلبات السابقة للمقرر
- calculate_gpa: حساب المعدل التراكمي
- analyze_academic_plan: تحليل الخطة الدراسية
- get_student_progress: جلب تقدم الطالب
- search_career_paths: البحث في المسارات المهنية

## تنسيق الأفكار (للبث المباشر):
عند التفكير، استخدم هذه التنسيقات:
- [PLAN] وصف الخطة...
- [EXECUTE] تنفيذ الخطوة...
- [TOOL] اسم_الأداة: المعاملات...
- [RESULT] نتيجة الأداة...
- [REFLECT] مراجعة النتائج...
- [ANSWER] الإجابة النهائية...

## إرشادات:
1. فكر خطوة بخطوة قبل الإجابة
2. استخدم الأدوات عند الحاجة
3. راجع نتائجك قبل تقديم الإجابة النهائية
4. كن دقيقاً ومفصلاً في التحليل
5. قدم توصيات عملية وقابلة للتطبيق

## أقسام كلية الهندسة - SPU:
- هندسة المعلوماتية
- هندسة الاتصالات والإلكترونيات
- الهندسة المدنية
- الهندسة المعمارية
- هندسة الميكاترونيكس

## نظام الدرجات:
A (90-100): 4.0, B+ (85-89): 3.5, B (80-84): 3.0, C+ (75-79): 2.5, C (70-74): 2.0, D+ (65-69): 1.5, D (60-64): 1.0, F (<60): 0.0`;

// Tools definitions for the AI
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
            },
            description: "قائمة الدرجات مع الساعات المعتمدة"
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
          department: { type: "string", description: "القسم" },
          completed_courses: { type: "array", items: { type: "string" }, description: "المقررات المكتملة" },
          target_credits: { type: "number", description: "عدد الساعات المستهدفة" }
        },
        required: ["department"]
      }
    }
  }
];

// Tool execution functions
async function executeTool(toolName: string, args: any, supabase: any): Promise<any> {
  switch (toolName) {
    case "search_courses":
      return await searchCourses(args, supabase);
    case "get_prerequisites":
      return await getPrerequisites(args, supabase);
    case "calculate_gpa":
      return calculateGPA(args);
    case "analyze_academic_risk":
      return analyzeRisk(args);
    case "suggest_courses":
      return await suggestCourses(args, supabase);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function searchCourses(args: any, supabase: any) {
  const { query, department, year_level } = args;
  
  let queryBuilder = supabase
    .from('courses')
    .select('*')
    .or(`name.ilike.%${query}%,name_ar.ilike.%${query}%,code.ilike.%${query}%`)
    .eq('is_active', true);
  
  if (department) {
    queryBuilder = queryBuilder.eq('department', department);
  }
  if (year_level) {
    queryBuilder = queryBuilder.eq('year_level', year_level);
  }
  
  const { data, error } = await queryBuilder.limit(10);
  
  if (error) return { error: error.message };
  return { courses: data || [], count: data?.length || 0 };
}

async function getPrerequisites(args: any, supabase: any) {
  const { course_code } = args;
  
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, code, name, name_ar, credits, year_level')
    .eq('code', course_code)
    .single();
  
  if (courseError) return { error: `Course not found: ${course_code}` };
  
  const { data: prerequisites, error: prereqError } = await supabase
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

function calculateGPA(args: any) {
  const { grades } = args;
  
  if (!grades || grades.length === 0) {
    return { error: "No grades provided" };
  }
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const g of grades) {
    const gradePoint = convertToGradePoint(g.grade);
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

function analyzeRisk(args: any) {
  const { gpa, credits_completed = 0, year_level = 1 } = args;
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  // GPA-based risk
  if (gpa < 2.0) {
    riskLevel = 'critical';
    riskScore += 40;
    factors.push('المعدل أقل من 2.0 (إنذار أكاديمي)');
    recommendations.push('التواصل مع المرشد الأكاديمي فوراً');
  } else if (gpa < 2.5) {
    riskLevel = 'high';
    riskScore += 25;
    factors.push('المعدل منخفض (أقل من 2.5)');
    recommendations.push('تقليل عدد الساعات في الفصل القادم');
  } else if (gpa < 3.0) {
    riskLevel = 'medium';
    riskScore += 15;
    factors.push('المعدل متوسط');
    recommendations.push('التركيز على تحسين الأداء في المقررات الصعبة');
  }
  
  // Credits progress
  const expectedCredits = year_level * 30;
  if (credits_completed < expectedCredits * 0.7) {
    riskScore += 15;
    factors.push('تأخر في الساعات المعتمدة');
    recommendations.push('التسجيل في ساعات إضافية إن أمكن');
  }
  
  return {
    riskLevel,
    riskScore,
    factors,
    recommendations,
    predictedGPA: gpa // Simplified prediction
  };
}

async function suggestCourses(args: any, supabase: any) {
  const { department, completed_courses = [], target_credits = 15 } = args;
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('department', department)
    .eq('is_active', true)
    .order('year_level', { ascending: true })
    .limit(20);
  
  if (error) return { error: error.message };
  
  // Filter out completed courses
  const available = courses?.filter((c: any) => !completed_courses.includes(c.code)) || [];
  
  // Select courses up to target credits
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = 'agentic', student_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for tool execution
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`Processing ${mode} chat request with ${messages.length} messages`);

    // Build context from student data if available
    let contextMessage = "";
    if (student_context) {
      contextMessage = `
معلومات الطالب الحالي:
- المعدل التراكمي: ${student_context.gpa || 'غير محدد'}
- القسم: ${student_context.department || 'غير محدد'}
- السنة الدراسية: ${student_context.year_level || 'غير محدد'}
- الساعات المكتملة: ${student_context.credits_completed || 'غير محدد'}
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
          return new Response(
            JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "يرجى إضافة رصيد للذكاء الاصطناعي" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error(`AI gateway error: ${response.status}`);
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
                        
                        // Send tool execution result
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
              } catch (e) {
                // Forward raw line
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

    // Standard RAG mode
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Agentic chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
