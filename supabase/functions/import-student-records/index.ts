import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RFC4180 compliant CSV parser
function parseCSVRFC4180(csvText: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  
  // Split into lines respecting quoted newlines
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') i++;
      if (current.trim()) lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  
  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
  else if (semiCount > commaCount) delimiter = ';';

  // Parse row respecting quotes
  const parseRow = (line: string): string[] => {
    const values: string[] = [];
    let val = '';
    let inQ = false;
    
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          val += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === delimiter && !inQ) {
        values.push(val.trim());
        val = '';
      } else {
        val += c;
      }
    }
    values.push(val.trim());
    return values;
  };

  const headers = parseRow(lines[0]);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.some(v => v)) rows.push(row);
  }

  return { headers, rows };
}

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
  'course_name': ['course_name', 'اسم المقرر', 'اسم المادة', 'المقرر', 'course', 'name', '#'],
  'course_code': ['course_code', 'رمز المقرر', 'كود المقرر', 'رقم المقرر', 'code'],
  'course_credits': ['course_credits', 'عدد الساعات', 'الساعات', 'credits', 'hours'],
  'final_grade': ['final_grade', 'العلامة النهائية', 'الدرجة النهائية', 'العلامة', 'grade', 'mark'],
  'letter_grade': ['letter_grade', 'الدرجة', 'الدرجة الحرفية', 'التقدير', 'grade_letter'],
  'grade_points': ['grade_points', 'النقاط', 'نقاط المقرر', 'points'],
  'has_ministry_scholarship': ['has_ministry_scholarship', 'لديه منحة وزارة', 'منحة'],
};

function findColumnIndex(headers: string[], field: string): number {
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

// Extract student_id from filename (e.g., "4220212.csv" -> "4220212")
function extractStudentIdFromFilename(filename: string): string | null {
  const name = filename.replace(/\\/g, '/').split('/').pop() || '';
  const match = name.match(/^(\d{5,10})/);
  return match ? match[1] : null;
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

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body = await req.json();
    const { 
      csvData, 
      fileName = 'unknown.csv', 
      importLogId,
      useFilenameAsStudentId = true 
    } = body;
    
    if (!csvData) {
      return new Response(JSON.stringify({ error: 'CSV data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine student_id from filename if enabled
    const filenameStudentId = useFilenameAsStudentId ? extractStudentIdFromFilename(fileName) : null;
    
    console.log(`Processing file: ${fileName}, extracted student_id: ${filenameStudentId}`);

    // Parse CSV with RFC4180 compliant parser
    const { headers, rows } = parseCSVRFC4180(csvData);
    console.log(`Parsed ${rows.length} rows, headers: ${headers.slice(0, 5).join(', ')}...`);

    if (rows.length === 0) {
      // Log file as skipped
      if (importLogId && filenameStudentId) {
        await supabase.from('import_file_logs').insert({
          import_log_id: importLogId,
          file_name: fileName,
          student_id: filenameStudentId || 'unknown',
          status: 'skipped',
          error_message: 'No valid rows found',
          completed_at: new Date().toISOString(),
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No valid records found',
        fileName,
        inserted: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find column indices
    const columnIndices: Record<string, number> = {};
    for (const field of Object.keys(COLUMN_MAPPINGS)) {
      columnIndices[field] = findColumnIndex(headers, field);
    }

    // Process records
    const records: any[] = [];
    const getValue = (row: string[], field: string): string => {
      const idx = columnIndices[field];
      return idx !== -1 && row[idx] ? row[idx].trim() : '';
    };

    for (const row of rows) {
      // Use filename as student_id (priority) or fall back to column
      let studentId = filenameStudentId || getValue(row, 'student_id');
      if (!studentId) continue;

      records.push({
        student_id: studentId,
        college: getValue(row, 'college') || null,
        major: getValue(row, 'major') || null,
        academic_year: getValue(row, 'academic_year') || 'Unknown',
        semester: getValue(row, 'semester') || 'Unknown',
        last_registration_semester: getValue(row, 'last_registration_semester') || null,
        study_mode: getValue(row, 'study_mode') || null,
        permanent_status: getValue(row, 'permanent_status') || null,
        semester_status: getValue(row, 'semester_status') || null,
        registered_hours_semester: cleanNumeric(getValue(row, 'registered_hours_semester')),
        completed_hours_semester: cleanNumeric(getValue(row, 'completed_hours_semester')),
        academic_warning: getValue(row, 'academic_warning') || null,
        previous_academic_warning: getValue(row, 'previous_academic_warning') || null,
        cumulative_gpa_percent: cleanNumeric(getValue(row, 'cumulative_gpa_percent')),
        cumulative_gpa_points: cleanNumeric(getValue(row, 'cumulative_gpa_points')),
        total_completed_hours: cleanNumeric(getValue(row, 'total_completed_hours')),
        baccalaureate_type: getValue(row, 'baccalaureate_type') || null,
        baccalaureate_country: getValue(row, 'baccalaureate_country') || null,
        certificate_score: cleanNumeric(getValue(row, 'certificate_score')),
        certificate_average: cleanNumeric(getValue(row, 'certificate_average')),
        has_ministry_scholarship: cleanBoolean(getValue(row, 'has_ministry_scholarship')),
        course_name: getValue(row, 'course_name') || 'Unknown',
        course_code: getValue(row, 'course_code') || 'Unknown',
        course_credits: cleanNumeric(getValue(row, 'course_credits')) || 3,
        final_grade: cleanNumeric(getValue(row, 'final_grade')),
        letter_grade: getValue(row, 'letter_grade') || null,
        grade_points: cleanNumeric(getValue(row, 'grade_points')),
        raw_data: Object.fromEntries(headers.map((h, idx) => [h, row[idx] || ''])),
      });
    }

    if (records.length === 0) {
      if (importLogId && filenameStudentId) {
        await supabase.from('import_file_logs').insert({
          import_log_id: importLogId,
          file_name: fileName,
          student_id: filenameStudentId || 'unknown',
          status: 'skipped',
          error_message: 'No records with valid student_id',
          completed_at: new Date().toISOString(),
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No records with valid student_id',
        fileName,
        inserted: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert records in batches
    const BATCH_SIZE = 100;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('student_academic_records').insert(batch);
      
      if (error) {
        console.error(`Batch error:`, error);
        errors.push(error.message);
      } else {
        inserted += batch.length;
      }
    }

    // Log file result
    const finalStudentId = filenameStudentId || records[0]?.student_id || 'unknown';
    if (importLogId) {
      await supabase.from('import_file_logs').insert({
        import_log_id: importLogId,
        file_name: fileName,
        student_id: finalStudentId,
        status: errors.length > 0 ? 'failed' : 'success',
        records_count: inserted,
        error_message: errors.length > 0 ? errors.join('; ') : null,
        completed_at: new Date().toISOString(),
      });
    }

    console.log(`File ${fileName}: inserted ${inserted}/${records.length} records`);

    return new Response(JSON.stringify({
      success: errors.length === 0 || inserted > 0,
      fileName,
      studentId: finalStudentId,
      total_records: records.length,
      inserted,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Import error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
