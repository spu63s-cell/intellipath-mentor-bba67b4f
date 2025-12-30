import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedCourse {
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department?: string;
  year_level?: number;
  semester?: string;
  description?: string;
  description_ar?: string;
  prerequisites?: string[];
}

// Parse Markdown content to extract courses
function parseMarkdownCourses(content: string, fileName: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const lines = content.split('\n');
  
  console.log(`Parsing markdown file: ${fileName}, lines: ${lines.length}`);
  
  let currentCourse: Partial<ParsedCourse> | null = null;
  let currentSection = '';
  
  // Try to detect department from filename or content
  let detectedDepartment = '';
  const deptPatterns = [
    /هندسة\s*(المعلوماتية|البرمجيات|الحواسيب|الشبكات)/i,
    /علوم\s*(الحاسوب|الحاسب)/i,
    /نظم\s*المعلومات/i,
    /(Computer\s*Science|Software\s*Engineering|Information\s*Technology)/i,
  ];
  
  for (const pattern of deptPatterns) {
    const match = content.match(pattern) || fileName.match(pattern);
    if (match) {
      detectedDepartment = match[0];
      break;
    }
  }
  
  // Pattern to match course codes (e.g., CS101, INF201, etc.)
  const courseCodePattern = /^(?:[-*•]?\s*)?([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*[-–:]\s*(.+)/i;
  const arabicCoursePattern = /^(?:[-*•]?\s*)?(\d{3,4})\s*[-–:]\s*(.+)/;
  const tableRowPattern = /^\|?\s*([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*\|(.+?)\|(.+?)\|/i;
  
  // Pattern to match prerequisites
  const prereqPatterns = [
    /متطلب(?:ات)?\s*(?:سابق(?:ة)?)?[:\s]+(.*)/i,
    /prerequisite[s]?[:\s]+(.*)/i,
    /يتطلب[:\s]+(.*)/i,
    /requires?[:\s]+(.*)/i,
  ];
  
  // Pattern to match credits
  const creditsPatterns = [
    /(\d+)\s*(?:ساع(?:ة|ات)|credit[s]?|وحد(?:ة|ات))/i,
    /(?:ساعات|credits?|وحدات?)[:\s]*(\d+)/i,
  ];
  
  // Pattern to match year level
  const yearPatterns = [
    /(?:السنة|السن|العام|الفصل|year|level|semester)[:\s]*(?:الأول(?:ى)?|الثاني(?:ة)?|الثالث(?:ة)?|الرابع(?:ة)?|first|second|third|fourth|\d)/i,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for section headers
    if (line.startsWith('#')) {
      currentSection = line.replace(/^#+\s*/, '');
      
      // Try to extract year level from section
      for (const pattern of yearPatterns) {
        const match = currentSection.match(pattern);
        if (match) {
          const yearMap: Record<string, number> = {
            'الأولى': 1, 'الأول': 1, 'first': 1, '1': 1,
            'الثانية': 2, 'الثاني': 2, 'second': 2, '2': 2,
            'الثالثة': 3, 'الثالث': 3, 'third': 3, '3': 3,
            'الرابعة': 4, 'الرابع': 4, 'fourth': 4, '4': 4,
          };
          for (const [key, val] of Object.entries(yearMap)) {
            if (match[0].toLowerCase().includes(key.toLowerCase())) {
              currentCourse = currentCourse || {};
              if (currentCourse) currentCourse.year_level = val;
              break;
            }
          }
        }
      }
      continue;
    }
    
    // Try to match course from table row
    const tableMatch = line.match(tableRowPattern);
    if (tableMatch) {
      const [, code, name, creditsOrDept] = tableMatch;
      const credits = parseInt(creditsOrDept.match(/\d+/)?.[0] || '3', 10);
      
      if (currentCourse && currentCourse.code) {
        courses.push({
          code: currentCourse.code,
          name: currentCourse.name || currentCourse.code,
          name_ar: currentCourse.name_ar,
          credits: currentCourse.credits || 3,
          department: currentCourse.department || detectedDepartment,
          year_level: currentCourse.year_level || 1,
          semester: currentCourse.semester,
          description: currentCourse.description,
          description_ar: currentCourse.description_ar,
          prerequisites: currentCourse.prerequisites,
        });
      }
      
      currentCourse = {
        code: code.replace(/\s+/g, '').toUpperCase(),
        name: name.trim(),
        credits: credits,
        department: detectedDepartment,
      };
      continue;
    }
    
    // Try to match course line
    const courseMatch = line.match(courseCodePattern);
    if (courseMatch) {
      // Save previous course if exists
      if (currentCourse && currentCourse.code) {
        courses.push({
          code: currentCourse.code,
          name: currentCourse.name || currentCourse.code,
          name_ar: currentCourse.name_ar,
          credits: currentCourse.credits || 3,
          department: currentCourse.department || detectedDepartment,
          year_level: currentCourse.year_level || 1,
          semester: currentCourse.semester,
          description: currentCourse.description,
          description_ar: currentCourse.description_ar,
          prerequisites: currentCourse.prerequisites,
        });
      }
      
      const [, code, name] = courseMatch;
      currentCourse = {
        code: code.replace(/\s+/g, '').toUpperCase(),
        name: name.trim(),
        department: detectedDepartment,
      };
      
      // Check if name contains credits
      for (const pattern of creditsPatterns) {
        const creditsMatch = name.match(pattern);
        if (creditsMatch) {
          currentCourse.credits = parseInt(creditsMatch[1], 10);
          break;
        }
      }
      
      // Check if it's Arabic name
      if (/[\u0600-\u06FF]/.test(name)) {
        currentCourse.name_ar = name.replace(/\s*\(\d+\s*ساع(?:ة|ات)\)/, '').trim();
      }
      
      continue;
    }
    
    // Try Arabic course pattern
    const arabicMatch = line.match(arabicCoursePattern);
    if (arabicMatch && /[\u0600-\u06FF]/.test(line)) {
      if (currentCourse && currentCourse.code) {
        courses.push({
          code: currentCourse.code,
          name: currentCourse.name || currentCourse.code,
          name_ar: currentCourse.name_ar,
          credits: currentCourse.credits || 3,
          department: currentCourse.department || detectedDepartment,
          year_level: currentCourse.year_level || 1,
          semester: currentCourse.semester,
          description: currentCourse.description,
          description_ar: currentCourse.description_ar,
          prerequisites: currentCourse.prerequisites,
        });
      }
      
      const [, code, name] = arabicMatch;
      currentCourse = {
        code: code,
        name: name.trim(),
        name_ar: name.trim(),
        department: detectedDepartment,
      };
      continue;
    }
    
    // If we have a current course, look for additional info
    if (currentCourse) {
      // Check for prerequisites
      for (const pattern of prereqPatterns) {
        const prereqMatch = line.match(pattern);
        if (prereqMatch) {
          const prereqText = prereqMatch[1];
          // Extract course codes from prereq text
          const prereqCodes = prereqText.match(/[A-Z]{2,4}\s*\d{3,4}[A-Z]?/gi);
          if (prereqCodes) {
            currentCourse.prerequisites = prereqCodes.map(c => c.replace(/\s+/g, '').toUpperCase());
          }
          break;
        }
      }
      
      // Check for credits in next line
      for (const pattern of creditsPatterns) {
        const creditsMatch = line.match(pattern);
        if (creditsMatch && !currentCourse.credits) {
          currentCourse.credits = parseInt(creditsMatch[1], 10);
          break;
        }
      }
      
      // Check for description
      if (line.startsWith('الوصف:') || line.toLowerCase().startsWith('description:')) {
        currentCourse.description = line.replace(/^(?:الوصف|description)[:\s]*/i, '');
        if (/[\u0600-\u06FF]/.test(currentCourse.description)) {
          currentCourse.description_ar = currentCourse.description;
        }
      }
    }
  }
  
  // Don't forget the last course
  if (currentCourse && currentCourse.code) {
    courses.push({
      code: currentCourse.code,
      name: currentCourse.name || currentCourse.code,
      name_ar: currentCourse.name_ar,
      credits: currentCourse.credits || 3,
      department: currentCourse.department || detectedDepartment,
      year_level: currentCourse.year_level || 1,
      semester: currentCourse.semester,
      description: currentCourse.description,
      description_ar: currentCourse.description_ar,
      prerequisites: currentCourse.prerequisites,
    });
  }
  
  console.log(`Extracted ${courses.length} courses from ${fileName}`);
  return courses;
}

// Parse CSV content to extract courses
function parseCSVCourses(content: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const cleanContent = content.replace(/^\uFEFF/, '');
  const firstLine = cleanContent.split('\n')[0] || '';
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return courses;
  
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
  // Find column indices
  const codeIdx = headers.findIndex(h => ['code', 'course_code', 'رمز', 'رمز المقرر'].includes(h));
  const nameIdx = headers.findIndex(h => ['name', 'course_name', 'اسم', 'اسم المقرر'].includes(h));
  const nameArIdx = headers.findIndex(h => ['name_ar', 'اسم عربي', 'الاسم بالعربي'].includes(h));
  const creditsIdx = headers.findIndex(h => ['credits', 'ساعات', 'الساعات', 'وحدات'].includes(h));
  const deptIdx = headers.findIndex(h => ['department', 'قسم', 'القسم'].includes(h));
  const yearIdx = headers.findIndex(h => ['year', 'year_level', 'السنة', 'المستوى'].includes(h));
  const semesterIdx = headers.findIndex(h => ['semester', 'الفصل'].includes(h));
  const descIdx = headers.findIndex(h => ['description', 'الوصف'].includes(h));
  const prereqIdx = headers.findIndex(h => ['prerequisites', 'متطلبات', 'متطلب سابق'].includes(h));
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    
    const code = codeIdx >= 0 ? values[codeIdx] : '';
    const name = nameIdx >= 0 ? values[nameIdx] : '';
    
    if (!code && !name) continue;
    
    const course: ParsedCourse = {
      code: code.replace(/\s+/g, '').toUpperCase() || `COURSE${i}`,
      name: name || code,
      name_ar: nameArIdx >= 0 ? values[nameArIdx] : undefined,
      credits: creditsIdx >= 0 ? parseInt(values[creditsIdx], 10) || 3 : 3,
      department: deptIdx >= 0 ? values[deptIdx] : undefined,
      year_level: yearIdx >= 0 ? parseInt(values[yearIdx], 10) || 1 : 1,
      semester: semesterIdx >= 0 ? values[semesterIdx] : undefined,
      description: descIdx >= 0 ? values[descIdx] : undefined,
    };
    
    if (prereqIdx >= 0 && values[prereqIdx]) {
      const prereqCodes = values[prereqIdx].match(/[A-Z]{2,4}\s*\d{3,4}[A-Z]?/gi);
      if (prereqCodes) {
        course.prerequisites = prereqCodes.map(c => c.replace(/\s+/g, '').toUpperCase());
      }
    }
    
    courses.push(course);
  }
  
  return courses;
}

// Extract files from ZIP
async function extractFilesFromZip(zipBlob: Blob): Promise<Array<{ name: string; content: string }>> {
  const files: Array<{ name: string; content: string }> = [];
  
  try {
    const zipReader = new ZipReader(new BlobReader(zipBlob));
    const entries = await zipReader.getEntries();
    
    for (const entry of entries) {
      const fileName = entry.filename.toLowerCase();
      if (!entry.directory && (fileName.endsWith('.csv') || fileName.endsWith('.md') || fileName.endsWith('.txt'))) {
        if (entry.getData) {
          const textWriter = new TextWriter();
          const content = await entry.getData(textWriter);
          files.push({ name: entry.filename, content });
        }
      }
    }
    
    await zipReader.close();
  } catch (error) {
    console.error('Error extracting ZIP:', error);
    throw new Error('Failed to extract ZIP file');
  }
  
  return files;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
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
    let allCourses: ParsedCourse[] = [];
    let totalFiles = 0;
    let processedFiles = 0;
    let fileErrors: any[] = [];
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

      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.zip')) {
        console.log(`Processing ZIP file: ${file.name}`);
        const zipBlob = new Blob([await file.arrayBuffer()]);
        const files = await extractFilesFromZip(zipBlob);
        
        totalFiles = files.length;
        console.log(`Found ${totalFiles} files in ZIP`);
        
        for (const f of files) {
          try {
            let courses: ParsedCourse[] = [];
            if (f.name.toLowerCase().endsWith('.csv')) {
              courses = parseCSVCourses(f.content);
            } else {
              courses = parseMarkdownCourses(f.content, f.name);
            }
            allCourses.push(...courses);
            processedFiles++;
            console.log(`Processed ${f.name}: ${courses.length} courses`);
          } catch (err) {
            fileErrors.push({ file: f.name, error: String(err) });
          }
        }
      } else {
        totalFiles = 1;
        const content = await file.text();
        
        if (fileName.endsWith('.csv')) {
          allCourses = parseCSVCourses(content);
        } else {
          allCourses = parseMarkdownCourses(content, file.name);
        }
        processedFiles = 1;
      }
    } else {
      const body = await req.json();
      if (body.content) {
        const fileName = body.file_name || 'content.md';
        overwrite = body.overwrite || false;
        
        if (fileName.endsWith('.csv')) {
          allCourses = parseCSVCourses(body.content);
        } else {
          allCourses = parseMarkdownCourses(body.content, fileName);
        }
        totalFiles = 1;
        processedFiles = 1;
      }
    }

    if (allCourses.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No courses found in file(s)",
          total_files: totalFiles,
          processed_files: processedFiles,
          file_errors: fileErrors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate courses by code
    const courseMap = new Map<string, ParsedCourse>();
    for (const course of allCourses) {
      if (!courseMap.has(course.code)) {
        courseMap.set(course.code, course);
      } else {
        // Merge data
        const existing = courseMap.get(course.code)!;
        if (!existing.name_ar && course.name_ar) existing.name_ar = course.name_ar;
        if (!existing.description && course.description) existing.description = course.description;
        if (!existing.prerequisites?.length && course.prerequisites?.length) {
          existing.prerequisites = course.prerequisites;
        }
      }
    }
    const uniqueCourses = Array.from(courseMap.values());

    // Import courses to database
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];
    const importedCodes: string[] = [];
    const prerequisiteMap: Map<string, string[]> = new Map();

    for (const course of uniqueCourses) {
      try {
        // Check if course exists
        const { data: existing } = await supabase
          .from("courses")
          .select("id")
          .eq("code", course.code)
          .single();

        if (existing) {
          if (!overwrite) {
            continue; // Skip existing
          }
          // Update existing
          await supabase
            .from("courses")
            .update({
              name: course.name,
              name_ar: course.name_ar,
              credits: course.credits,
              department: course.department,
              year_level: course.year_level || 1,
              semester: course.semester,
              description: course.description,
              description_ar: course.description_ar,
            })
            .eq("id", existing.id);
        } else {
          // Insert new
          await supabase
            .from("courses")
            .insert({
              code: course.code,
              name: course.name,
              name_ar: course.name_ar,
              credits: course.credits,
              department: course.department || 'هندسة المعلوماتية',
              year_level: course.year_level || 1,
              semester: course.semester,
              description: course.description,
              description_ar: course.description_ar,
            });
        }

        successful++;
        importedCodes.push(course.code);
        
        // Store prerequisites for later processing
        if (course.prerequisites?.length) {
          prerequisiteMap.set(course.code, course.prerequisites);
        }
      } catch (err) {
        failed++;
        errors.push({
          code: course.code,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Process prerequisites after all courses are imported
    for (const [courseCode, prereqCodes] of prerequisiteMap) {
      try {
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("code", courseCode)
          .single();
          
        if (course) {
          for (const prereqCode of prereqCodes) {
            const { data: prereq } = await supabase
              .from("courses")
              .select("id")
              .eq("code", prereqCode)
              .single();
              
            if (prereq) {
              // Check if prerequisite already exists
              const { data: existingPrereq } = await supabase
                .from("course_prerequisites")
                .select("id")
                .eq("course_id", course.id)
                .eq("prerequisite_id", prereq.id)
                .single();
                
              if (!existingPrereq) {
                await supabase
                  .from("course_prerequisites")
                  .insert({
                    course_id: course.id,
                    prerequisite_id: prereq.id,
                  });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error processing prerequisites for ${courseCode}:`, err);
      }
    }

    console.log(`Import complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total_files: totalFiles,
        processed_files: processedFiles,
        total_courses: uniqueCourses.length,
        successful_imports: successful,
        failed_imports: failed,
        imported_codes: importedCodes.slice(0, 20),
        errors: errors.slice(0, 10),
        file_errors: fileErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in course-data-import:", error);
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
