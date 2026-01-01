import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Flexible column mapping - supports both Arabic and English headers
const COLUMN_MAPPINGS: Record<string, string[]> = {
  'student_id': ['student_id', 'رقم الطالب', 'الرقم الجامعي', 'رقم_الطالب', 'id', 'studentid'],
  'college': ['college', 'الكلية', 'كلية'],
  'major': ['major', 'الاختصاص', 'التخصص', 'الفرع', 'القسم'],
  'academic_year': ['academic_year', 'العام الدراسي', 'السنة الدراسية', 'year'],
  'semester': ['semester', 'الفصل الدراسي', 'الفصل', 'term'],
  'last_registration_semester': ['last_registration_semester', 'آخر فصل تسجيل'],
  'study_mode': ['study_mode', 'نمط الدراسة', 'نوع الدراسة'],
  'permanent_status': ['permanent_status', 'الحالة الدائمة', 'حالة الطالب'],
  'semester_status': ['semester_status', 'حالة الفصل'],
  'registered_hours_semester': ['registered_hours_semester', 'الساعات المسجلة-فصل', 'الساعات المسجلة'],
  'completed_hours_semester': ['completed_hours_semester', 'الساعات المنجزة-الفصل', 'الساعات المنجزة'],
  'academic_warning': ['academic_warning', 'الإنذار الأكاديمي', 'الانذار الاكاديمي', 'انذار'],
  'cumulative_gpa_percent': ['cumulative_gpa_percent', 'المعدل التراكمي المئوي-نهاية', 'المعدل المئوي', 'gpa_percent'],
  'cumulative_gpa_points': ['cumulative_gpa_points', 'المعدل التراكمي النقطي-نهاية', 'المعدل النقطي', 'gpa', 'cumulative_gpa'],
  'total_completed_hours': ['total_completed_hours', 'الساعات المنجزة-نهاية', 'اجمالي الساعات', 'total_hours', 'completed_hours'],
  'baccalaureate_type': ['baccalaureate_type', 'نوع البكالوريا', 'نوع الشهادة'],
  'baccalaureate_country': ['baccalaureate_country', 'بلد البكالوريا', 'بلد الشهادة'],
  'certificate_score': ['certificate_score', 'علامة الشهادة', 'درجة الشهادة'],
  'certificate_average': ['certificate_average', 'معدل الشهادة'],
  'previous_academic_warning': ['previous_academic_warning', 'الإنذار الاكاديمي السابق'],
  'course_name': ['course_name', 'اسم المقرر', 'اسم المادة', 'المقرر', 'course', 'name'],
  'course_code': ['course_code', 'رمز المقرر', 'كود المقرر', 'رقم المقرر', 'code'],
  'course_credits': ['course_credits', 'عدد الساعات', 'الساعات', 'credits', 'hours'],
  'final_grade': ['final_grade', 'العلامة النهائية', 'الدرجة النهائية', 'العلامة', 'grade', 'mark'],
  'letter_grade': ['letter_grade', 'الدرجة', 'الدرجة الحرفية', 'التقدير', 'grade_letter'],
  'grade_points': ['grade_points', 'النقاط', 'نقاط المقرر', 'points'],
  'has_ministry_scholarship': ['has_ministry_scholarship', 'لديه منحة وزارة', 'منحة'],
};

function findColumn(headers: string[], field: string): number {
  const possibleNames = COLUMN_MAPPINGS[field] || [field];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].trim().toLowerCase().replace(/[\s_-]+/g, '');
    for (const name of possibleNames) {
      const normalizedName = name.toLowerCase().replace(/[\s_-]+/g, '');
      if (header === normalizedName || header.includes(normalizedName) || normalizedName.includes(header)) {
        return i;
      }
    }
  }
  return -1;
}

function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 1) return { headers: [], rows: [] };
  
  // Detect delimiter (comma, semicolon, or tab)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
  
  const parseRow = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };
  
  const headers = parseRow(lines[0]);
  const rows: string[][] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    rows.push(parseRow(line));
  }
  
  return { headers, rows };
}

function cleanNumeric(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === '-') return null;
  const cleaned = value.replace(/[,\s]/g, '').replace(/٫/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function cleanBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === '1' || lower === 'نعم' || lower === 'yes' || lower === 'صحيح';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { csvData, mode = 'full', fileName = 'unknown.csv' } = await req.json();
    
    if (!csvData) {
      console.error('No CSV data provided');
      return new Response(JSON.stringify({ error: 'CSV data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting CSV import from ${fileName}...`);
    console.log(`CSV data length: ${csvData.length} characters`);
    
    // Parse CSV
    const { headers, rows } = parseCSV(csvData);
    console.log(`Parsed ${rows.length} rows with ${headers.length} columns`);
    console.log(`Headers: ${headers.slice(0, 5).join(', ')}...`);
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid records found in CSV',
        message: 'لم يتم العثور على سجلات صالحة في الملف'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find column indices
    const columnIndices: Record<string, number> = {};
    for (const field of Object.keys(COLUMN_MAPPINGS)) {
      columnIndices[field] = findColumn(headers, field);
    }
    
    console.log('Column mappings found:', JSON.stringify(
      Object.fromEntries(
        Object.entries(columnIndices)
          .filter(([_, idx]) => idx !== -1)
          .map(([key, idx]) => [key, headers[idx]])
      )
    ));

    // Validate required columns
    if (columnIndices['student_id'] === -1) {
      return new Response(JSON.stringify({ 
        error: 'Missing required column: student_id',
        message: 'عمود رقم الطالب مطلوب'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process records in batches
    const BATCH_SIZE = 100;
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];
    const uniqueStudents = new Set<string>();

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      const batchRecords = batch.map((row, rowIdx) => {
        const getValue = (field: string): string => {
          const idx = columnIndices[field];
          return idx !== -1 && row[idx] ? row[idx].trim() : '';
        };

        const studentId = getValue('student_id');
        if (!studentId) {
          skipped++;
          return null;
        }
        
        uniqueStudents.add(studentId);
        
        return {
          student_id: studentId,
          college: getValue('college') || null,
          major: getValue('major') || null,
          academic_year: getValue('academic_year') || 'Unknown',
          semester: getValue('semester') || 'Unknown',
          last_registration_semester: getValue('last_registration_semester') || null,
          study_mode: getValue('study_mode') || null,
          permanent_status: getValue('permanent_status') || null,
          semester_status: getValue('semester_status') || null,
          registered_hours_semester: cleanNumeric(getValue('registered_hours_semester')),
          completed_hours_semester: cleanNumeric(getValue('completed_hours_semester')),
          academic_warning: getValue('academic_warning') || null,
          previous_academic_warning: getValue('previous_academic_warning') || null,
          cumulative_gpa_percent: cleanNumeric(getValue('cumulative_gpa_percent')),
          cumulative_gpa_points: cleanNumeric(getValue('cumulative_gpa_points')),
          total_completed_hours: cleanNumeric(getValue('total_completed_hours')),
          baccalaureate_type: getValue('baccalaureate_type') || null,
          baccalaureate_country: getValue('baccalaureate_country') || null,
          certificate_score: cleanNumeric(getValue('certificate_score')),
          certificate_average: cleanNumeric(getValue('certificate_average')),
          has_ministry_scholarship: cleanBoolean(getValue('has_ministry_scholarship')),
          course_name: getValue('course_name') || 'Unknown',
          course_code: getValue('course_code') || 'Unknown',
          course_credits: cleanNumeric(getValue('course_credits')) || 3,
          final_grade: cleanNumeric(getValue('final_grade')),
          letter_grade: getValue('letter_grade') || null,
          grade_points: cleanNumeric(getValue('grade_points')),
          raw_data: Object.fromEntries(headers.map((h, idx) => [h, row[idx] || ''])),
        };
      }).filter(record => record !== null);

      if (batchRecords.length === 0) continue;

      const { error } = await supabase
        .from('student_academic_records')
        .insert(batchRecords);

      if (error) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        inserted += batchRecords.length;
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Inserted ${batchRecords.length} records`);
      }
    }

    console.log(`Import completed: ${inserted} records inserted, ${skipped} skipped, ${errors.length} batch errors`);
    console.log(`Unique students: ${uniqueStudents.size}`);

    return new Response(JSON.stringify({
      success: errors.length === 0 || inserted > 0,
      message: inserted > 0 
        ? `تم استيراد ${inserted} سجل بنجاح`
        : 'لم يتم استيراد أي سجلات',
      total_records: rows.length,
      inserted: inserted,
      skipped: skipped,
      unique_students: uniqueStudents.size,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Import error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during import',
      message: 'حدث خطأ أثناء الاستيراد',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
