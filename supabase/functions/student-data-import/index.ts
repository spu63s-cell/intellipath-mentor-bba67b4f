import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Flexible column mapping for CSV headers
const COLUMN_MAPPINGS: Record<string, string[]> = {
  student_id: ['student_id', 'رقم الطالب', 'Student ID', 'id', 'الرقم الجامعي'],
  course_code: ['course_code', 'رمز المقرر', 'Course Code', 'code', 'رمز المادة'],
  course_name: ['course_name', 'اسم المقرر', 'Course Name', 'name', 'اسم المادة'],
  college: ['college', 'الكلية', 'College', 'faculty'],
  major: ['major', 'التخصص', 'Major', 'specialization'],
  department: ['department', 'القسم', 'Department'],
  academic_year: ['academic_year', 'السنة الأكاديمية', 'Academic Year', 'year'],
  semester: ['semester', 'الفصل الدراسي', 'Semester', 'term'],
  cumulative_gpa: ['cumulative_gpa', 'cumulative_gpa_points', 'المعدل التراكمي', 'GPA', 'gpa'],
  completed_hours: ['completed_hours', 'completed_hours_total', 'إجمالي الساعات المكتملة', 'total_credits'],
  letter_grade: ['letter_grade', 'الدرجة الحرفية', 'Letter Grade', 'grade'],
  final_grade: ['final_grade', 'الدرجة النهائية', 'Final Grade', 'score'],
  points: ['points', 'النقاط', 'Points', 'grade_points'],
  credits: ['credits', 'الساعات', 'Credits', 'hours'],
};

function findColumn(headers: string[], field: string): string | null {
  const mappings = COLUMN_MAPPINGS[field] || [field];
  for (const header of headers) {
    const normalizedHeader = header.trim().toLowerCase();
    for (const mapping of mappings) {
      if (normalizedHeader === mapping.toLowerCase() || header.includes(mapping)) {
        return header;
      }
    }
  }
  return null;
}

function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, '');
  
  // Detect delimiter
  const firstLine = cleanContent.split('\n')[0] || '';
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return { headers, rows };
}

function getValue(row: Record<string, string>, headers: string[], field: string): string {
  const column = findColumn(headers, field);
  return column ? (row[column] || '').trim() : '';
}

function parseFloat(value: string): number | null {
  const num = Number(value.replace(',', '.'));
  return isNaN(num) ? null : num;
}

interface StudentRecord {
  student_id: string;
  college?: string;
  major?: string;
  department?: string;
  gpa?: number | null;
  completed_credits?: number | null;
  metadata: Record<string, any>;
  courses: Array<{
    code: string;
    name: string;
    semester?: string;
    academic_year?: string;
    letter_grade?: string;
    final_grade?: number | null;
    points?: number | null;
    credits?: number | null;
  }>;
}

function processCSVData(headers: string[], rows: Record<string, string>[]): StudentRecord[] {
  const studentsMap = new Map<string, StudentRecord>();
  
  for (const row of rows) {
    const studentId = getValue(row, headers, 'student_id');
    if (!studentId || studentId.length < 5) continue;
    
    const courseCode = getValue(row, headers, 'course_code');
    const courseName = getValue(row, headers, 'course_name');
    
    // Initialize student if not exists
    if (!studentsMap.has(studentId)) {
      studentsMap.set(studentId, {
        student_id: studentId,
        college: getValue(row, headers, 'college') || undefined,
        major: getValue(row, headers, 'major') || getValue(row, headers, 'department') || undefined,
        department: getValue(row, headers, 'department') || undefined,
        gpa: parseFloat(getValue(row, headers, 'cumulative_gpa')),
        completed_credits: parseFloat(getValue(row, headers, 'completed_hours')) ? 
          Math.floor(parseFloat(getValue(row, headers, 'completed_hours'))!) : null,
        metadata: { ...row }, // Store all original CSV data
        courses: [],
      });
    }
    
    const student = studentsMap.get(studentId)!;
    
    // Add course if present
    if (courseCode && courseName) {
      student.courses.push({
        code: courseCode.replace(/\s+/g, ''),
        name: courseName,
        semester: getValue(row, headers, 'semester') || undefined,
        academic_year: getValue(row, headers, 'academic_year') || undefined,
        letter_grade: getValue(row, headers, 'letter_grade') || undefined,
        final_grade: parseFloat(getValue(row, headers, 'final_grade')),
        points: parseFloat(getValue(row, headers, 'points')),
        credits: parseFloat(getValue(row, headers, 'credits')) ? 
          Math.floor(parseFloat(getValue(row, headers, 'credits'))!) : 3,
      });
    }
    
    // Update GPA and credits if not set
    const gpa = parseFloat(getValue(row, headers, 'cumulative_gpa'));
    const credits = parseFloat(getValue(row, headers, 'completed_hours'));
    if (gpa !== null && (student.gpa === null || student.gpa === undefined)) {
      student.gpa = gpa;
    }
    if (credits !== null && (student.completed_credits === null || student.completed_credits === undefined)) {
      student.completed_credits = Math.floor(credits);
    }
  }
  
  return Array.from(studentsMap.values());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    
    let csvContent: string;
    let fileName = "import.csv";
    let overwrite = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      overwrite = formData.get("overwrite") === "true";
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      fileName = file.name;
      csvContent = await file.text();
    } else {
      const body = await req.json();
      csvContent = body.csv_content;
      fileName = body.file_name || "import.csv";
      overwrite = body.overwrite || false;
    }

    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: "No CSV content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create import log
    const { data: importLog } = await supabase
      .from("import_logs")
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: "csv",
        status: "processing",
      })
      .select()
      .single();

    // Parse CSV
    const { headers, rows } = parseCSV(csvContent);
    
    if (headers.length === 0 || rows.length === 0) {
      await supabase
        .from("import_logs")
        .update({ status: "failed", errors: [{ error: "Empty CSV file" }], completed_at: new Date().toISOString() })
        .eq("id", importLog?.id);
      
      return new Response(
        JSON.stringify({ error: "Empty CSV file", successful_imports: 0, failed_imports: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process CSV data
    const students = processCSVData(headers, rows);
    
    let successfulImports = 0;
    let failedImports = 0;
    const importedStudentIds: string[] = [];
    const errors: Array<{ student_id: string; error: string }> = [];

    for (const student of students) {
      try {
        // Check if student exists
        const { data: existingStudent } = await supabase
          .from("students")
          .select("id, user_id")
          .eq("student_id", student.student_id)
          .single();

        let studentDbId: string;

        if (existingStudent) {
          if (!overwrite) {
            // Skip existing student
            continue;
          }
          
          // Update existing student
          await supabase
            .from("students")
            .update({
              major: student.major || undefined,
              college: student.college || undefined,
              gpa: student.gpa || undefined,
              total_credits: student.completed_credits || undefined,
              student_metadata: student.metadata,
            })
            .eq("id", existingStudent.id);
          
          studentDbId = existingStudent.id;
        } else {
          // Create new student record (without user_id - will be linked on registration)
          // First, we need a placeholder user or handle this differently
          // For now, we'll skip creating orphan students - they need to register first
          
          // Actually, let's check if there's a user with matching email pattern
          // or create with a temporary approach
          
          // Skip for now - students should register first, then link
          console.log(`Student ${student.student_id} not found - skipping (needs registration first)`);
          continue;
        }

        // Import courses as enrollments
        for (const course of student.courses) {
          // Find or skip course (course must exist)
          const { data: courseData } = await supabase
            .from("courses")
            .select("id")
            .eq("code", course.code)
            .single();

          if (courseData) {
            // Upsert enrollment
            await supabase
              .from("enrollments")
              .upsert({
                student_id: studentDbId,
                course_id: courseData.id,
                semester: course.semester,
                academic_year: course.academic_year,
                letter_grade: course.letter_grade,
                final_grade: course.final_grade,
                points: course.points,
                credits: course.credits || 3,
              }, {
                onConflict: 'student_id,course_id,semester',
              });
          }
        }

        successfulImports++;
        importedStudentIds.push(student.student_id);
      } catch (err) {
        failedImports++;
        errors.push({
          student_id: student.student_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Update import log
    await supabase
      .from("import_logs")
      .update({
        total_records: students.length,
        successful_records: successfulImports,
        failed_records: failedImports,
        errors: errors,
        status: failedImports === 0 ? "completed" : "completed_with_errors",
        completed_at: new Date().toISOString(),
      })
      .eq("id", importLog?.id);

    return new Response(
      JSON.stringify({
        success: true,
        total_records: students.length,
        successful_imports: successfulImports,
        failed_imports: failedImports,
        imported_student_ids: importedStudentIds,
        errors: errors.slice(0, 10), // Limit errors in response
        import_log_id: importLog?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in student-data-import:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        successful_imports: 0,
        failed_imports: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
