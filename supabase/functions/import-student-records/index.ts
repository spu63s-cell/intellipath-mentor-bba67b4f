import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Column mapping from Arabic to English field names
const COLUMN_MAPPING: Record<string, string> = {
  'student_id': 'student_id',
  'الكلية': 'college',
  'الاختصاص': 'major',
  'العام الدراسي': 'academic_year',
  'الفصل الدراسي': 'semester',
  'آخر فصل تسجيل': 'last_registration_semester',
  'نمط الدراسة': 'study_mode',
  'الحالة الدائمة': 'permanent_status',
  'حالة الفصل': 'semester_status',
  'الساعات المسجلة-فصل': 'registered_hours_semester',
  'الساعات المنجزة-الفصل': 'completed_hours_semester',
  'الإنذار الأكاديمي': 'academic_warning',
  'المعدل التراكمي المئوي-نهاية': 'cumulative_gpa_percent',
  'المعدل التراكمي النقطي-نهاية': 'cumulative_gpa_points',
  'الساعات المنجزة-نهاية': 'total_completed_hours',
  'نوع البكالوريا': 'baccalaureate_type',
  'بلد البكالوريا': 'baccalaureate_country',
  'علامة الشهادة': 'certificate_score',
  'معدل الشهادة': 'certificate_average',
  'الإنذار الاكاديمي السابق': 'previous_academic_warning',
  'اسم المقرر': 'course_name',
  'رمز المقرر': 'course_code',
  'عدد الساعات': 'course_credits',
  'العلامة النهائية': 'final_grade',
  'الدرجة': 'letter_grade',
  'النقاط': 'grade_points',
  'لديه منحة وزارة': 'has_ministry_scholarship',
};

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header line
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Handle CSV with quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const englishKey = COLUMN_MAPPING[header] || header;
      record[englishKey] = values[idx] || '';
    });
    
    records.push(record);
  }
  
  return records;
}

function cleanNumeric(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function cleanBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === '1' || lower === 'نعم' || lower === 'yes';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { csvData, mode = 'full' } = await req.json();
    
    if (!csvData) {
      return new Response(JSON.stringify({ error: 'CSV data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Starting CSV import...");
    
    // Parse CSV
    const records = parseCSV(csvData);
    console.log(`Parsed ${records.length} records from CSV`);
    
    if (records.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid records found in CSV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process records in batches
    const BATCH_SIZE = 100;
    let inserted = 0;
    let errors: string[] = [];
    const uniqueStudents = new Set<string>();

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      const batchRecords = batch.map(record => {
        uniqueStudents.add(record.student_id);
        
        return {
          student_id: record.student_id,
          college: record.college || null,
          major: record.major || null,
          academic_year: record.academic_year || 'Unknown',
          semester: record.semester || 'Unknown',
          last_registration_semester: record.last_registration_semester || null,
          study_mode: record.study_mode || 'نظام ساعات',
          permanent_status: record.permanent_status || null,
          semester_status: record.semester_status || null,
          registered_hours_semester: cleanNumeric(record.registered_hours_semester),
          completed_hours_semester: cleanNumeric(record.completed_hours_semester),
          academic_warning: record.academic_warning || null,
          previous_academic_warning: record.previous_academic_warning || null,
          cumulative_gpa_percent: cleanNumeric(record.cumulative_gpa_percent),
          cumulative_gpa_points: cleanNumeric(record.cumulative_gpa_points),
          total_completed_hours: cleanNumeric(record.total_completed_hours),
          baccalaureate_type: record.baccalaureate_type || null,
          baccalaureate_country: record.baccalaureate_country || null,
          certificate_score: cleanNumeric(record.certificate_score),
          certificate_average: cleanNumeric(record.certificate_average),
          has_ministry_scholarship: cleanBoolean(record.has_ministry_scholarship),
          course_name: record.course_name || 'Unknown',
          course_code: record.course_code || 'Unknown',
          course_credits: cleanNumeric(record.course_credits) || 3,
          final_grade: cleanNumeric(record.final_grade),
          letter_grade: record.letter_grade || null,
          grade_points: cleanNumeric(record.grade_points),
          raw_data: record,
        };
      });

      const { error } = await supabase
        .from('student_academic_records')
        .insert(batchRecords);

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error);
        errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      } else {
        inserted += batchRecords.length;
      }
    }

    console.log(`Import completed: ${inserted} records inserted, ${errors.length} batch errors`);

    return new Response(JSON.stringify({
      success: true,
      message: `تم استيراد ${inserted} سجل بنجاح`,
      total_records: records.length,
      inserted: inserted,
      unique_students: uniqueStudents.size,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Import error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'An error occurred during import',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
