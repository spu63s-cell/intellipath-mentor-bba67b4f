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

export interface AcademicSummary {
  studentId: string;
  college: string;
  major: string;
  totalCompletedHours: number;
  requiredHours: number; // 173 ساعة
  remainingHours: number;
  cumulativeGPA: number;
  cumulativePercentage: number;
  coursesCount: number;
  passedCourses: number;
  failedCourses: number;
  withdrawnCourses: number;
  academicWarning: string | null;
  permanentStatus: string | null;
  isGraduationEligible: boolean; // GPA >= 2.0 and hours >= 173
  progressPercentage: number;
}

// Grade points mapping
const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0, 'W': 0, 'P': 0, // P = معادلة، لا تدخل بالمعدل
};

// P grade is a pass (60) but doesn't affect GPA (معادلة من الخطة القديمة)
const PASSING_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'P'];
const FAILING_GRADES = ['F'];
const WITHDRAWN_GRADES = ['W'];
const EXCLUDED_FROM_GPA = ['P', 'W']; // هذه الدرجات لا تدخل في حساب المعدل

export function useAcademicRecord() {
  const { user } = useAuthStore();

  // First get the student_id from the students table
  const { data: studentData } = useQuery({
    queryKey: ['student-link', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('students')
        .select('student_id, department, major')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch academic records from student_academic_records table
  const { data: records, isLoading, error, refetch } = useQuery({
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
  });

  // Calculate academic summary
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
    
    // Separate passed, failed, withdrawn
    const passedCourses = uniqueCourses.filter(c => 
      c.letter_grade && PASSING_GRADES.includes(c.letter_grade)
    );
    const failedCourses = uniqueCourses.filter(c => 
      c.letter_grade && FAILING_GRADES.includes(c.letter_grade)
    );
    const withdrawnCourses = uniqueCourses.filter(c => 
      c.letter_grade && WITHDRAWN_GRADES.includes(c.letter_grade)
    );

    // Calculate total completed hours (only from passed courses)
    const totalCompletedHours = passedCourses.reduce((sum, c) => 
      sum + (c.course_credits || 0), 0
    );

    // Calculate GPA (exclude P and W grades)
    const gpaEligibleCourses = passedCourses.filter(c => 
      c.letter_grade && !EXCLUDED_FROM_GPA.includes(c.letter_grade)
    );

    let totalGradePoints = 0;
    let totalCreditsForGPA = 0;

    gpaEligibleCourses.forEach(c => {
      if (c.letter_grade && c.course_credits) {
        const points = GRADE_POINTS[c.letter_grade] ?? 0;
        totalGradePoints += points * c.course_credits;
        totalCreditsForGPA += c.course_credits;
      }
    });

    const cumulativeGPA = totalCreditsForGPA > 0 
      ? totalGradePoints / totalCreditsForGPA 
      : 0;

    // Get latest record for metadata
    const latestRecord = records[0];

    const progressPercentage = Math.min((totalCompletedHours / REQUIRED_HOURS) * 100, 100);

    return {
      studentId: studentData.student_id,
      college: latestRecord.college || 'كلية الهندسة',
      major: latestRecord.major || studentData.major || 'غير محدد',
      totalCompletedHours,
      requiredHours: REQUIRED_HOURS,
      remainingHours: Math.max(REQUIRED_HOURS - totalCompletedHours, 0),
      cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
      cumulativePercentage: (cumulativeGPA / 4.0) * 100,
      coursesCount: uniqueCourses.length,
      passedCourses: passedCourses.length,
      failedCourses: failedCourses.length,
      withdrawnCourses: withdrawnCourses.length,
      academicWarning: latestRecord.academic_warning,
      permanentStatus: latestRecord.permanent_status,
      isGraduationEligible: cumulativeGPA >= 2.0 && totalCompletedHours >= REQUIRED_HOURS,
      progressPercentage,
    };
  })() : null;

  return {
    studentId: studentData?.student_id || null,
    records: records || [],
    summary,
    isLoading,
    error,
    refetch,
    hasAcademicRecord: records && records.length > 0,
  };
}
