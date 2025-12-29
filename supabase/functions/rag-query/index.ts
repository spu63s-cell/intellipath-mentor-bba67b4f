import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RAG System Prompt
const RAG_SYSTEM_PROMPT = `أنت "IntelliPath" - المستشار الأكاديمي الذكي للجامعة السورية الخاصة.

## مهمتك:
استخدم المعلومات المقدمة في السياق للإجابة على أسئلة الطالب بدقة.

## قواعد مهمة:
1. اعتمد فقط على المعلومات الموجودة في السياق
2. إذا لم تجد المعلومة في السياق، قل ذلك بوضوح
3. قدم إجابات منظمة وواضحة
4. استخدم التنسيق المناسب (قوائم، عناوين)
5. أضف نصائح عملية عند الإمكان

## السياق المتاح:
{context}

## ملاحظة:
إذا كان السؤال خارج نطاق المعلومات المتاحة، اعترف بذلك واقترح مصادر بديلة.`;

// Simple keyword-based search (simulating vector search)
async function searchDocuments(query: string, supabase: any, filters?: any) {
  const keywords = query.split(/\s+/).filter(k => k.length > 2);
  
  let queryBuilder = supabase
    .from('courses')
    .select('code, name, name_ar, description, description_ar, credits, year_level, department');
  
  // Apply text search
  if (keywords.length > 0) {
    const searchConditions = keywords.map(keyword => 
      `name.ilike.%${keyword}%,name_ar.ilike.%${keyword}%,description.ilike.%${keyword}%,description_ar.ilike.%${keyword}%`
    ).join(',');
    queryBuilder = queryBuilder.or(searchConditions);
  }
  
  // Apply filters
  if (filters?.department) {
    queryBuilder = queryBuilder.eq('department', filters.department);
  }
  if (filters?.year_level) {
    queryBuilder = queryBuilder.eq('year_level', filters.year_level);
  }
  
  queryBuilder = queryBuilder.eq('is_active', true).limit(10);
  
  const { data, error } = await queryBuilder;
  
  if (error) {
    console.error("Search error:", error);
    return [];
  }
  
  return data || [];
}

// Build context from search results
function buildContext(documents: any[]): string {
  if (!documents || documents.length === 0) {
    return "لا توجد وثائق متاحة للسؤال المطروح.";
  }
  
  return documents.map((doc, index) => {
    return `
### المقرر ${index + 1}: ${doc.name_ar || doc.name} (${doc.code})
- القسم: ${doc.department}
- السنة: ${doc.year_level}
- الساعات المعتمدة: ${doc.credits}
- الوصف: ${doc.description_ar || doc.description || 'غير متوفر'}
`;
  }).join('\n');
}

// Query expansion for better search
function expandQuery(query: string): string[] {
  const expansions: string[] = [query];
  
  // Add Arabic/English variations
  const courseKeywords: Record<string, string[]> = {
    'برمجة': ['programming', 'بايثون', 'جافا', 'coding'],
    'قواعد بيانات': ['database', 'sql', 'db'],
    'شبكات': ['networks', 'networking', 'network'],
    'ذكاء اصطناعي': ['ai', 'artificial intelligence', 'machine learning'],
    'رياضيات': ['math', 'mathematics', 'calculus'],
    'فيزياء': ['physics'],
    'متطلبات': ['prerequisites', 'requirements'],
    'خطة': ['plan', 'schedule'],
    'معدل': ['gpa', 'grade'],
  };
  
  for (const [key, values] of Object.entries(courseKeywords)) {
    if (query.includes(key)) {
      expansions.push(...values);
    }
  }
  
  return expansions;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      conversation_id,
      filters,
      use_hybrid_search = true,
      top_k = 5,
      student_context
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    console.log("Processing RAG query:", query);
    
    // Expand query for better search
    const expandedQueries = use_hybrid_search ? expandQuery(query) : [query];
    
    // Search for relevant documents
    const allDocuments: any[] = [];
    for (const q of expandedQueries) {
      const docs = await searchDocuments(q, supabase, filters);
      allDocuments.push(...docs);
    }
    
    // Deduplicate by code
    const uniqueDocs = Array.from(
      new Map(allDocuments.map(doc => [doc.code, doc])).values()
    ).slice(0, top_k);
    
    // Build context
    const context = buildContext(uniqueDocs);
    
    // Add student context if available
    let studentInfo = "";
    if (student_context) {
      studentInfo = `
معلومات الطالب:
- القسم: ${student_context.department || 'غير محدد'}
- السنة: ${student_context.year_level || 'غير محدد'}
- المعدل: ${student_context.gpa || 'غير محدد'}
`;
    }
    
    // Build the prompt
    const systemPrompt = RAG_SYSTEM_PROMPT.replace('{context}', context + studentInfo);
    
    // Call AI with context
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
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

    // Transform stream to include sources
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = "";
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk);
        controller.enqueue(chunk);
        
        // Track content for saving
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                fullContent += data.choices[0].delta.content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      },
      async flush(controller) {
        // Send sources at the end
        const sourcesEvent = {
          type: 'sources',
          sources: uniqueDocs.map(doc => ({
            code: doc.code,
            name: doc.name_ar || doc.name,
            department: doc.department,
            score: 0.9 // Placeholder score
          }))
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesEvent)}\n\n`));
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("RAG query error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
