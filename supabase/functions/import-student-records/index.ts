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

  const headers = parseRow(lines[0]).map((h, idx) =>
    idx === 0 ? h.replace(/^\uFEFF/, '') : h
  );
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.some(v => v)) rows.push(row);
  }

  return { headers, rows };
}

// Flexible column mapping - supports both Arabic and English headers
// Exact Arabic names from user's file:
// student_id, الكلية, الاختصاص, العام الدراسي, الفصل الدراسي, آخر فصل تسجيل,
// نمط الدراسة, الحالة الدائمة, حالة الفصل, الساعات المسجلة-فصل, الساعات المنجزة-الفصل,
// الإنذار الأكاديمي, المعدل التراكمي المئوي-نهاية, المعدل التراكمي النقطي-نهاية,
// الساعات المنجزة-نهاية, نوع البكالوريا, بلد البكالوريا, علامة الشهادة, معدل الشهادة,
// الإنذار الاكاديمي السابق, #, اسم المقرر, رمز المقرر, عدد الساعات, العلامة النهائية,
// الدرجة, النقاط, لديه منحة وزارة
const COLUMN_MAPPINGS: Record<string, string[]> = {
  'student_id': ['student_id', 'رقم الطالب', 'الرقم الجامعي', 'رقم_الطالب', 'id', 'studentid'],
  'college': ['college', 'الكلية', 'كلية', 'الكليه'],
  'major': ['major', 'الاختصاص', 'التخصص', 'الفرع', 'القسم', 'الاختصاص'],
  'academic_year': ['academic_year', 'العام الدراسي', 'السنة الدراسية', 'year', 'العام'],
  'semester': ['semester', 'الفصل الدراسي', 'الفصل', 'term', 'الفصل الدراسى'],
  'last_registration_semester': ['last_registration_semester', 'آخر فصل تسجيل', 'اخر فصل تسجيل', 'آخر فصل'],
  'study_mode': ['study_mode', 'نمط الدراسة', 'نوع الدراسة', 'نمط الدراسه'],
  'permanent_status': ['permanent_status', 'الحالة الدائمة', 'حالة الطالب', 'الحاله الدائمه'],
  'semester_status': ['semester_status', 'حالة الفصل', 'حاله الفصل'],
  'registered_hours_semester': ['registered_hours_semester', 'الساعات المسجلة-فصل', 'الساعات المسجلة', 'الساعات المسجله فصل', 'الساعات المسجله-فصل'],
  'completed_hours_semester': ['completed_hours_semester', 'الساعات المنجزة-الفصل', 'الساعات المنجزة', 'الساعات المنجزه-الفصل', 'الساعات المنجزه الفصل'],
  'academic_warning': ['academic_warning', 'الإنذار الأكاديمي', 'الانذار الاكاديمي', 'انذار', 'الإنذار', 'الانذار'],
  'cumulative_gpa_percent': ['cumulative_gpa_percent', 'المعدل التراكمي المئوي-نهاية', 'المعدل التراكمي المئوي نهاية', 'المعدل المئوي', 'gpa_percent', 'المعدل التراكمى المئوى-نهاية', 'المعدل التراكمي المئوى نهايه'],
  'cumulative_gpa_points': ['cumulative_gpa_points', 'المعدل التراكمي النقطي-نهاية', 'المعدل التراكمي النقطي نهاية', 'المعدل النقطي', 'gpa', 'cumulative_gpa', 'المعدل التراكمى النقطى-نهاية'],
  'total_completed_hours': ['total_completed_hours', 'الساعات المنجزة-نهاية', 'الساعات المنجزة نهاية', 'اجمالي الساعات', 'total_hours', 'completed_hours', 'الساعات المنجزه-نهاية', 'الساعات المنجزه نهايه'],
  'baccalaureate_type': ['baccalaureate_type', 'نوع البكالوريا', 'نوع الشهادة', 'نوع البكلوريا'],
  'baccalaureate_country': ['baccalaureate_country', 'بلد البكالوريا', 'بلد الشهادة', 'بلد البكلوريا'],
  'certificate_score': ['certificate_score', 'علامة الشهادة', 'درجة الشهادة', 'علامه الشهاده'],
  'certificate_average': ['certificate_average', 'معدل الشهادة', 'معدل الشهاده'],
  'previous_academic_warning': ['previous_academic_warning', 'الإنذار الاكاديمي السابق', 'الانذار الاكاديمي السابق', 'الإنذار السابق'],
  'row_number': ['row_number', '#', 'رقم', 'row'],
  'course_name': ['course_name', 'اسم المقرر', 'اسم المادة', 'المقرر', 'course', 'coursename', 'اسم المقرر'],
  'course_code': ['course_code', 'رمز المقرر', 'كود المقرر', 'رقم المقرر', 'code', 'رمز'],
  'course_credits': ['course_credits', 'عدد الساعات', 'الساعات', 'credits', 'hours', 'عدد ساعات'],
  'final_grade': ['final_grade', 'العلامة النهائية', 'الدرجة النهائية', 'العلامة', 'grade', 'mark', 'العلامه النهائيه'],
  'letter_grade': ['letter_grade', 'الدرجة', 'الدرجة الحرفية', 'التقدير', 'grade_letter', 'الدرجه'],
  'grade_points': ['grade_points', 'النقاط', 'نقاط المقرر', 'points', 'النقط'],
  'has_ministry_scholarship': ['has_ministry_scholarship', 'لديه منحة وزارة', 'منحة', 'منحة وزارة', 'لديه منحه وزاره'],
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

function parseSemesterYear(
  rawSemester: string,
  rawAcademicYear: string
): { semester: string; academicYear: string } {
  const semesterText = (rawSemester || '').replace(/\s+/g, ' ').trim();
  const yearText = (rawAcademicYear || '').replace(/\s+/g, ' ').trim();

  const yearRegex = /(\d{4}\s*\/\s*\d{4})/;
  const yearFromYearCol = yearText.match(yearRegex)?.[1] || null;
  const yearFromSemesterCol = semesterText.match(yearRegex)?.[1] || null;

  const academicYear = (yearFromYearCol || yearFromSemesterCol || '').replace(/\s+/g, '');
  const semester = (yearFromYearCol
    ? semesterText
    : semesterText.replace(yearRegex, '')
  )
    .replace(/\s+/g, ' ')
    .trim();

  return {
    semester: semester || 'Unknown',
    academicYear: academicYear || 'Unknown',
  };
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

    // Verify admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1);

    if (rolesError) {
      console.error('Role lookup error:', rolesError);
      return new Response(JSON.stringify({ error: 'Role lookup failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!roles || roles.length === 0) {
      console.log(`User ${user.id} does not have admin role`);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body = await req.json();
    const {
      action = 'import',
      csvData,
      fileName = 'unknown.csv',
      importLogId,
      useFilenameAsStudentId = true,
    } = body;

    // Force-cancel an import log (useful when UI crashed and status is stuck on "processing")
    if (action === 'force_cancel') {
      if (!importLogId) {
        return new Response(JSON.stringify({ error: 'importLogId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const nowIso = new Date().toISOString();

      const { error: cancelError } = await supabase
        .from('import_logs')
        .update({ status: 'cancelled', completed_at: nowIso })
        .eq('id', importLogId);

      if (cancelError) {
        console.error('Force cancel: failed to update import log', cancelError);
        return new Response(JSON.stringify({ error: 'Failed to cancel import log' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('import_file_logs')
        .update({ status: 'cancelled', completed_at: nowIso })
        .eq('import_log_id', importLogId);

      return new Response(JSON.stringify({ success: true, importLogId, status: 'cancelled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rollback (delete records created by a specific import)
    if (action === 'rollback') {
      if (!importLogId) {
        return new Response(JSON.stringify({ error: 'importLogId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: logRow, error: logError } = await supabase
        .from('import_logs')
        .select('created_at, completed_at, file_name')
        .eq('id', importLogId)
        .maybeSingle();

      if (logError) {
        console.error('Rollback: failed to fetch import log', logError);
        return new Response(JSON.stringify({ error: 'Failed to fetch import log' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!logRow) {
        return new Response(JSON.stringify({ error: 'Import log not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const startAt = logRow.created_at;
      const endAt = logRow.completed_at || new Date().toISOString();

      const { data: fileLogs, error: fileLogsError } = await supabase
        .from('import_file_logs')
        .select('student_id')
        .eq('import_log_id', importLogId);

      if (fileLogsError) {
        console.error('Rollback: failed to fetch file logs', fileLogsError);
        return new Response(JSON.stringify({ error: 'Failed to fetch import file logs' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const studentIds = Array.from(
        new Set((fileLogs || []).map((r: any) => String(r.student_id || '').trim()).filter(Boolean))
      );

      let deletedCount = 0;

      // Prefer precise rollback by importLogId stored inside raw_data
      try {
        const { data: deletedRowsById, error: deleteByIdError } = await supabase
          .from('student_academic_records')
          .delete()
          .eq('raw_data->>_import_log_id', importLogId)
          .select('id');

        if (deleteByIdError) {
          throw deleteByIdError;
        }

        deletedCount = deletedRowsById?.length || 0;
      } catch (e) {
        // Fallback: time-window + student_id list (less precise)
        if (studentIds.length > 0) {
          const { data: deletedRows, error: deleteError } = await supabase
            .from('student_academic_records')
            .delete()
            .in('student_id', studentIds)
            .gte('created_at', startAt)
            .lte('created_at', endAt)
            .select('id');

          if (deleteError) {
            console.error('Rollback: delete error', deleteError);
            return new Response(JSON.stringify({ error: 'Failed to delete records' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          deletedCount = deletedRows?.length || 0;
        }
      }

      const nowIso = new Date().toISOString();

      await supabase
        .from('import_logs')
        .update({ status: 'rolled_back', completed_at: nowIso })
        .eq('id', importLogId);

      await supabase
        .from('import_file_logs')
        .update({ status: 'rolled_back', completed_at: nowIso })
        .eq('import_log_id', importLogId);

      return new Response(
        JSON.stringify({
          success: true,
          deleted: deletedCount,
          importLogId,
          fileName: logRow.file_name,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
    const getValue = (row: string[], field: string): string => {
      const idx = columnIndices[field];
      return idx !== -1 && row[idx] ? row[idx].trim() : '';
    };

    const scoreRecord = (r: any): number => {
      let score = 0;
      if (r.college) score++;
      if (r.major) score++;
      if (r.academic_year && r.academic_year !== 'Unknown') score++;
      if (r.semester && r.semester !== 'Unknown') score++;
      if (r.course_code && r.course_code !== 'Unknown') score++;
      if (r.course_name && r.course_name !== 'Unknown') score++;
      if (r.final_grade !== null && r.final_grade !== undefined) score++;
      if (r.letter_grade) score++;
      if (r.grade_points !== null && r.grade_points !== undefined) score++;
      return score;
    };

    const deduped = new Map<string, any>();
    let duplicatesSkipped = 0;

    for (const row of rows) {
      // Use filename as student_id (priority) or fall back to column
      const studentId = (filenameStudentId || getValue(row, 'student_id')).trim();
      if (!studentId) continue;

      const courseCode = getValue(row, 'course_code').trim();
      const courseName = getValue(row, 'course_name').trim();

      // Skip non-course/summary rows
      if (!courseCode && !courseName) continue;

      const { semester, academicYear } = parseSemesterYear(
        getValue(row, 'semester'),
        getValue(row, 'academic_year')
      );

      const raw: Record<string, string> = Object.fromEntries(
        headers.map((h, idx) => [h, row[idx] || ''])
      );
      raw._import_log_id = importLogId || '';
      raw._import_file_name = fileName;
      raw._imported_at = new Date().toISOString();

      const record = {
        student_id: studentId,
        college: getValue(row, 'college') || null,
        major: getValue(row, 'major') || null,
        academic_year: academicYear,
        semester,
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
        course_name: courseName || 'Unknown',
        course_code: courseCode || 'Unknown',
        course_credits: cleanNumeric(getValue(row, 'course_credits')) || 3,
        final_grade: cleanNumeric(getValue(row, 'final_grade')),
        letter_grade: getValue(row, 'letter_grade') || null,
        grade_points: cleanNumeric(getValue(row, 'grade_points')),
        raw_data: raw,
      };

      const key = `${record.student_id}|${record.academic_year}|${record.semester}|${record.course_code}`;
      const existing = deduped.get(key);

      if (!existing) {
        deduped.set(key, record);
      } else {
        const existingScore = scoreRecord(existing);
        const newScore = scoreRecord(record);

        if (newScore > existingScore) {
          deduped.set(key, record);
        }
        duplicatesSkipped++;
      }
    }

    const records = Array.from(deduped.values());

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

    // Upsert records in batches (uses unique index for conflict detection)
    const BATCH_SIZE = 100;
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { data: upsertData, error } = await supabase
        .from('student_academic_records')
        .upsert(batch, {
          onConflict: 'student_id,academic_year,semester,course_code',
          ignoreDuplicates: false,
        })
        .select('id');
      
      if (error) {
        console.error(`Batch error:`, error);
        errors.push(error.message);
      } else {
        inserted += upsertData?.length || batch.length;
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

    console.log(`File ${fileName}: upserted ${inserted}/${records.length} records`);

    return new Response(JSON.stringify({
      success: errors.length === 0 || inserted > 0,
      fileName,
      studentId: finalStudentId,
      parsed_rows: rows.length,
      total_records: records.length,
      inserted,
      duplicates_skipped: duplicatesSkipped,
      upsert_mode: true,
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
