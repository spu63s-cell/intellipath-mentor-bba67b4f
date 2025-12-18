import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export interface Course {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  credits: number;
  department: string;
  year_level: number;
  semester: string | null;
  difficulty_rating: number | null;
}

export interface StudentEnrollment {
  id: string;
  course_id: string;
  grade: number | null;
  letter_grade: string | null;
  status: string;
  course?: Course;
}

export function useSimulatorData() {
  const { user } = useAuthStore();

  // Fetch student data
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['simulator-student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('students')
        .select('id, gpa, total_credits, department, year_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch available courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['simulator-courses', studentData?.department],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('year_level')
        .order('name');

      if (error) throw error;
      return data as Course[];
    },
  });

  // Fetch completed enrollments
  const { data: completedEnrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['simulator-enrollments', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          grade,
          letter_grade,
          status
        `)
        .eq('student_id', studentData.id)
        .eq('status', 'completed');

      if (error) return [];
      return data as StudentEnrollment[];
    },
    enabled: !!studentData?.id,
  });

  // Get available courses (not yet enrolled)
  const completedCourseIds = completedEnrollments?.map(e => e.course_id) || [];
  const availableCourses = courses?.filter(c => !completedCourseIds.includes(c.id)) || [];

  // Calculate current stats
  const currentGpa = Number(studentData?.gpa) || 0;
  const completedCredits = studentData?.total_credits || 0;

  return {
    studentData,
    courses: courses || [],
    availableCourses,
    completedEnrollments: completedEnrollments || [],
    currentGpa,
    completedCredits,
    isLoading: studentLoading || coursesLoading || enrollmentsLoading,
  };
}
