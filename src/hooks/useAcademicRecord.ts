import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface AcademicRecord {
  id: string;
  student_id: string;
  college: string | null;
  major: string | null;
  academic_year: string;
  semester: string;
  course_code: string;
  course_name: string;
  course_credits: number | null;
  final_grade: number | null;
  letter_grade: string | null;
  grade_points: number | null;
  total_completed_hours: number | null;
  cumulative_gpa_percent: number | null;
  cumulative_gpa_points: number | null;
  academic_warning: string | null;
  permanent_status: string | null;
  study_mode: string | null;
  baccalaureate_type: string | null;
  baccalaureate_country: string | null;
  certificate_score: number | null;
  certificate_average: number | null;
  has_ministry_scholarship: boolean;
}

export interface CourseRecord {
  course_code: string;
  course_name: string;
  credits: number;
  final_grade: number | null;
  letter_grade: string | null;
  grade_points: number;
  academic_year: string;
  semester: string;
  isExcludedFromGPA: boolean; // P or 60 grade
  isFailed: boolean;
  isWithdrawn: boolean;
  isPassed: boolean;
}

export interface SemesterSummary {
  academic_year: string;
  semester: string;
  courses: CourseRecord[];
  semesterGPA: number;
  semesterCredits: number;
  earnedCredits: number;
}

export interface AcademicSummary {
  studentId: string;
  college: string;
  major: string;
  // VALID earned hours (excluding P, 60, Failed)
  totalCompletedHours: number;
  // For display: hours from P grades (don't count towards GPA)
  pGradeHours: number;
  requiredHours: number; // 173 ساعة
  remainingHours: number;
  // GPA excluding P and 60 grades
  cumulativeGPA: number;
  cumulativePercentage: number;
  // Counts
  coursesCount: number;
  passedCourses: number;
  failedCourses: number;
  withdrawnCourses: number;
  pGradeCourses: number; // معادلة
  // Status
  academicWarning: string | null;
  permanentStatus: string | null;
  isGraduationEligible: boolean; // GPA >= 2.0 and hours >= 173
  progressPercentage: number;
  // Semesters breakdown
  semesters: SemesterSummary[];
}

// Grade points mapping - Standard 4.0 scale
const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0, 'W': 0, 'P': 0,
};

/**
 * CRITICAL RULES:
 * 1. P grade (60) = Pass but EXCLUDED from GPA calculation (معادلة من الخطة القديمة)
 * 2. Grade = 60 exactly = Same as P, EXCLUDED from GPA
 * 3. Failed courses (F or <50) = NOT counted in earned hours
 * 4. W (Withdrawn) = NOT counted in GPA or earned hours
 * 5. Passing grade = D (50) or above, EXCEPT for P grades which are just pass
 */

// Grades that pass but are EXCLUDED from GPA calculation
const EXCLUDED_FROM_GPA_GRADES = ['P', 'W'];
// Minimum passing grade value (D = 50)
const MINIMUM_PASSING_GRADE = 50;

function isPassingGrade(letterGrade: string | null, finalGrade: number | null): boolean {
  if (!letterGrade) return false;
  if (letterGrade === 'W' || letterGrade === 'F') return false;
  if (letterGrade === 'P') return true; // P is passing but excluded from GPA
  if (finalGrade !== null && finalGrade < MINIMUM_PASSING_GRADE) return false;
  return true;
}

function isExcludedFromGPA(letterGrade: string | null, finalGrade: number | null): boolean {
  if (!letterGrade) return true;
  // P grades are excluded
  if (letterGrade === 'P') return true;
  // W (withdrawn) is excluded
  if (letterGrade === 'W') return true;
  // Grade 60 exactly is treated as P (معادلة)
  if (finalGrade === 60) return true;
  return false;
}

function isFailed(letterGrade: string | null, finalGrade: number | null): boolean {
  if (letterGrade === 'F') return true;
  if (finalGrade !== null && finalGrade < MINIMUM_PASSING_GRADE && letterGrade !== 'P') return true;
  return false;
}

function isWithdrawn(letterGrade: string | null): boolean {
  return letterGrade === 'W';
}

function isPGrade(letterGrade: string | null, finalGrade: number | null): boolean {
  if (letterGrade === 'P') return true;
  if (finalGrade === 60) return true;
  return false;
}

export function useAcademicRecord() {
  const { user } = useAuthStore();

  // First get the student_id from the students table
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student-link', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, department, major, gpa, total_credits, year_level')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch academic records from student_academic_records table
  const { data: records, isLoading: recordsLoading, error, refetch } = useQuery({
    queryKey: ['academic-records', studentData?.student_id],
    queryFn: async () => {
      if (!studentData?.student_id) return [];
      
      const { data, error } = await supabase
        .from('student_academic_records')
        .select('*')
        .eq('student_id', studentData.student_id)
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: false });
      
      if (error) throw error;
      return data as AcademicRecord[];
    },
    enabled: !!studentData?.student_id,
    staleTime: 1000 * 60 * 5,
  });

  // Calculate academic summary with STRICT rules
  const summary: AcademicSummary | null = records && records.length > 0 ? (() => {
    const REQUIRED_HOURS = 173;
    
    // Get unique courses (latest record for each course)
    const courseMap = new Map<string, AcademicRecord>();
    records.forEach(r => {
      const existing = courseMap.get(r.course_code);
      if (!existing) {
        courseMap.set(r.course_code, r);
      }
    });

    const uniqueCourses = Array.from(courseMap.values());
    
    // Process each course
    const processedCourses: CourseRecord[] = uniqueCourses.map(c => ({
      course_code: c.course_code,
      course_name: c.course_name,
      credits: c.course_credits || 0,
      final_grade: c.final_grade,
      letter_grade: c.letter_grade,
      grade_points: GRADE_POINTS[c.letter_grade || ''] ?? 0,
      academic_year: c.academic_year,
      semester: c.semester,
      isExcludedFromGPA: isExcludedFromGPA(c.letter_grade, c.final_grade),
      isFailed: isFailed(c.letter_grade, c.final_grade),
      isWithdrawn: isWithdrawn(c.letter_grade),
      isPassed: isPassingGrade(c.letter_grade, c.final_grade),
    }));

    // Separate categories
    const passedCourses = processedCourses.filter(c => c.isPassed && !c.isWithdrawn);
    const failedCourses = processedCourses.filter(c => c.isFailed);
    const withdrawnCourses = processedCourses.filter(c => c.isWithdrawn);
    const pGradeCourses = processedCourses.filter(c => isPGrade(c.letter_grade, c.final_grade));
    
    // Courses that count towards GPA (passed and NOT excluded)
    const gpaEligibleCourses = passedCourses.filter(c => !c.isExcludedFromGPA);
    
    // Calculate VALID earned hours (passed courses that are NOT P/60 grades)
    const validEarnedHours = passedCourses
      .filter(c => !isPGrade(c.letter_grade, c.final_grade))
      .reduce((sum, c) => sum + c.credits, 0);
    
    // P grade hours (don't count towards progress but show separately)
    const pGradeHours = pGradeCourses.reduce((sum, c) => sum + c.credits, 0);
    
    // Calculate GPA (ONLY from courses that are not excluded)
    let totalGradePoints = 0;
    let totalCreditsForGPA = 0;

    gpaEligibleCourses.forEach(c => {
      const points = GRADE_POINTS[c.letter_grade || ''] ?? 0;
      totalGradePoints += points * c.credits;
      totalCreditsForGPA += c.credits;
    });

    const cumulativeGPA = totalCreditsForGPA > 0 
      ? totalGradePoints / totalCreditsForGPA 
      : 0;

    // Get latest record for metadata
    const latestRecord = records[0];

    // Group by semester
    const semesterMap = new Map<string, CourseRecord[]>();
    processedCourses.forEach(c => {
      const key = `${c.academic_year}|${c.semester}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, []);
      }
      semesterMap.get(key)!.push(c);
    });

    const semesters: SemesterSummary[] = Array.from(semesterMap.entries()).map(([key, courses]) => {
      const [academic_year, semester] = key.split('|');
      
      const gpaEligible = courses.filter(c => c.isPassed && !c.isExcludedFromGPA);
      const semesterGPAPoints = gpaEligible.reduce((sum, c) => sum + (c.grade_points * c.credits), 0);
      const semesterGPACredits = gpaEligible.reduce((sum, c) => sum + c.credits, 0);
      
      return {
        academic_year,
        semester,
        courses,
        semesterGPA: semesterGPACredits > 0 ? semesterGPAPoints / semesterGPACredits : 0,
        semesterCredits: courses.reduce((sum, c) => sum + c.credits, 0),
        earnedCredits: courses.filter(c => c.isPassed && !isPGrade(c.letter_grade, c.final_grade))
          .reduce((sum, c) => sum + c.credits, 0),
      };
    });

    // Progress based on valid earned hours only
    const progressPercentage = Math.min((validEarnedHours / REQUIRED_HOURS) * 100, 100);

    return {
      studentId: studentData!.student_id,
      college: latestRecord.college || 'كلية الهندسة',
      major: latestRecord.major || studentData?.major || 'غير محدد',
      totalCompletedHours: validEarnedHours,
      pGradeHours,
      requiredHours: REQUIRED_HOURS,
      remainingHours: Math.max(REQUIRED_HOURS - validEarnedHours, 0),
      cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
      cumulativePercentage: (cumulativeGPA / 4.0) * 100,
      coursesCount: uniqueCourses.length,
      passedCourses: passedCourses.length,
      failedCourses: failedCourses.length,
      withdrawnCourses: withdrawnCourses.length,
      pGradeCourses: pGradeCourses.length,
      academicWarning: latestRecord.academic_warning,
      permanentStatus: latestRecord.permanent_status,
      isGraduationEligible: cumulativeGPA >= 2.0 && validEarnedHours >= REQUIRED_HOURS,
      progressPercentage,
      semesters,
    };
  })() : null;

  // Get all processed courses for other components
  const allCourses: CourseRecord[] = records ? (() => {
    const courseMap = new Map<string, AcademicRecord>();
    records.forEach(r => {
      const existing = courseMap.get(r.course_code);
      if (!existing) {
        courseMap.set(r.course_code, r);
      }
    });

    return Array.from(courseMap.values()).map(c => ({
      course_code: c.course_code,
      course_name: c.course_name,
      credits: c.course_credits || 0,
      final_grade: c.final_grade,
      letter_grade: c.letter_grade,
      grade_points: GRADE_POINTS[c.letter_grade || ''] ?? 0,
      academic_year: c.academic_year,
      semester: c.semester,
      isExcludedFromGPA: isExcludedFromGPA(c.letter_grade, c.final_grade),
      isFailed: isFailed(c.letter_grade, c.final_grade),
      isWithdrawn: isWithdrawn(c.letter_grade),
      isPassed: isPassingGrade(c.letter_grade, c.final_grade),
    }));
  })() : [];

  return {
    // Student data
    studentId: studentData?.student_id || null,
    studentDbId: studentData?.id || null,
    department: studentData?.department || null,
    yearLevel: studentData?.year_level || 1,
    // Raw records
    records: records || [],
    // Processed data
    allCourses,
    summary,
    // Status
    isLoading: studentLoading || recordsLoading,
    error,
    refetch,
    hasAcademicRecord: records && records.length > 0,
    // Helper functions for other components
    isExcludedFromGPA,
    isFailed,
    isWithdrawn,
    isPGrade,
    isPassingGrade,
  };
}

// Export helper functions for use in other components
export { isExcludedFromGPA, isFailed, isWithdrawn, isPGrade, isPassingGrade, GRADE_POINTS };
