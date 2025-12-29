import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GPA Grade Point Mapping
const GRADE_POINTS: Record<string, number> = {
  'A': 4.0, 'A+': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0,
};

function letterToPoints(letter: string): number {
  return GRADE_POINTS[letter.toUpperCase()] || 0;
}

function numberToPoints(grade: number): number {
  if (grade >= 90) return 4.0;
  if (grade >= 85) return 3.5;
  if (grade >= 80) return 3.0;
  if (grade >= 75) return 2.5;
  if (grade >= 70) return 2.0;
  if (grade >= 65) return 1.5;
  if (grade >= 60) return 1.0;
  return 0.0;
}

function pointsToLetter(points: number): string {
  if (points >= 3.7) return 'A';
  if (points >= 3.3) return 'B+';
  if (points >= 3.0) return 'B';
  if (points >= 2.7) return 'C+';
  if (points >= 2.3) return 'C';
  if (points >= 2.0) return 'D+';
  if (points >= 1.0) return 'D';
  return 'F';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let result: any;

    switch (action) {
      case 'calculate_gpa':
        result = calculateGPA(data);
        break;
        
      case 'analyze_plan':
        result = await analyzePlan(data, supabase);
        break;
        
      case 'simulate_drop':
        result = await simulateDrop(data, supabase);
        break;
        
      case 'simulate_retake':
        result = simulateRetake(data);
        break;
        
      case 'project_grades':
        result = projectGrades(data);
        break;
        
      case 'get_risk_assessment':
        result = assessRisk(data);
        break;
        
      case 'get_critical_path':
        result = await getCriticalPath(data, supabase);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Academic analysis error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateGPA(data: any) {
  const { grades } = data;
  
  if (!grades || grades.length === 0) {
    return { gpa: 0, totalCredits: 0, totalPoints: 0, letterGrade: 'N/A' };
  }
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  for (const g of grades) {
    const points = typeof g.grade === 'string' 
      ? letterToPoints(g.grade) 
      : numberToPoints(g.grade);
    totalPoints += points * g.credits;
    totalCredits += g.credits;
  }
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    totalCredits,
    totalPoints: Math.round(totalPoints * 100) / 100,
    letterGrade: pointsToLetter(gpa),
    gradeDistribution: analyzeGradeDistribution(grades)
  };
}

function analyzeGradeDistribution(grades: any[]) {
  const distribution: Record<string, number> = {
    'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
  };
  
  for (const g of grades) {
    const points = typeof g.grade === 'string' 
      ? letterToPoints(g.grade) 
      : numberToPoints(g.grade);
    const letter = pointsToLetter(points);
    distribution[letter] = (distribution[letter] || 0) + 1;
  }
  
  return distribution;
}

async function analyzePlan(data: any, supabase: any) {
  const { student_id, department } = data;
  
  // Get student's completed courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      course:courses(code, name, credits, year_level),
      grade,
      status
    `)
    .eq('student_id', student_id)
    .eq('status', 'completed');
  
  // Get all required courses for department
  const { data: requiredCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('department', department)
    .eq('is_active', true);
  
  const completedCodes = new Set(enrollments?.map((e: any) => e.course?.code) || []);
  const remainingCourses = requiredCourses?.filter((c: any) => !completedCodes.has(c.code)) || [];
  
  const completedCredits = enrollments?.reduce((sum: number, e: any) => 
    sum + (e.course?.credits || 0), 0) || 0;
  const totalRequiredCredits = requiredCourses?.reduce((sum: number, c: any) => 
    sum + c.credits, 0) || 0;
  
  return {
    completedCourses: enrollments?.length || 0,
    remainingCourses: remainingCourses.length,
    completedCredits,
    remainingCredits: totalRequiredCredits - completedCredits,
    progressPercentage: Math.round((completedCredits / totalRequiredCredits) * 100),
    recommendations: generateRecommendations(remainingCourses, completedCredits),
    warnings: generateWarnings(enrollments || [], remainingCourses)
  };
}

function generateRecommendations(remainingCourses: any[], completedCredits: number): string[] {
  const recommendations: string[] = [];
  
  if (remainingCourses.length > 0) {
    const nextCourses = remainingCourses
      .sort((a, b) => a.year_level - b.year_level)
      .slice(0, 3);
    recommendations.push(
      `المقررات المقترحة للتسجيل: ${nextCourses.map(c => c.name_ar || c.name).join('، ')}`
    );
  }
  
  if (completedCredits < 30) {
    recommendations.push('ننصح بالتركيز على المقررات الأساسية في السنة الأولى');
  }
  
  return recommendations;
}

function generateWarnings(enrollments: any[], remaining: any[]): string[] {
  const warnings: string[] = [];
  
  // Check for low grades
  const failedCourses = enrollments.filter(e => 
    (typeof e.grade === 'number' && e.grade < 60) || 
    (typeof e.grade === 'string' && e.grade === 'F')
  );
  
  if (failedCourses.length > 0) {
    warnings.push(`لديك ${failedCourses.length} مقرر(ات) يجب إعادتها`);
  }
  
  return warnings;
}

async function simulateDrop(data: any, supabase: any) {
  const { student_id, course_code, current_gpa, current_credits } = data;
  
  // Get course info
  const { data: course } = await supabase
    .from('courses')
    .select('*, prerequisites:course_prerequisites(prerequisite_id)')
    .eq('code', course_code)
    .single();
  
  if (!course) {
    throw new Error(`Course not found: ${course_code}`);
  }
  
  // Find dependent courses
  const { data: dependents } = await supabase
    .from('course_prerequisites')
    .select('course:courses(code, name, name_ar)')
    .eq('prerequisite_id', course.id);
  
  // Calculate graduation delay
  let graduationDelay = 0;
  if (dependents && dependents.length > 0) {
    graduationDelay = 1; // At least one semester delay
  }
  
  return {
    impact: {
      gpaChange: 0, // W grade doesn't affect GPA
      graduationDelay,
      affectedCourses: dependents?.map((d: any) => d.course?.code) || [],
      creditLoss: course.credits
    },
    recommendations: [
      graduationDelay > 0 
        ? 'الانسحاب سيؤثر على المقررات التالية ويسبب تأخيراً' 
        : 'الانسحاب لن يؤثر بشكل كبير على خطتك الدراسية',
      'تأكد من مراجعة المرشد الأكاديمي قبل اتخاذ القرار'
    ],
    warnings: graduationDelay > 0 
      ? [`هذا المقرر متطلب سابق لـ ${dependents?.length} مقرر(ات)`] 
      : []
  };
}

function simulateRetake(data: any) {
  const { current_gpa, current_credits, course_credits, old_grade, target_grade } = data;
  
  const oldPoints = typeof old_grade === 'string' 
    ? letterToPoints(old_grade) 
    : numberToPoints(old_grade);
  const targetPoints = typeof target_grade === 'string' 
    ? letterToPoints(target_grade) 
    : numberToPoints(target_grade);
  
  // Calculate new GPA
  const totalOldPoints = current_gpa * current_credits;
  const gradeImprovement = (targetPoints - oldPoints) * course_credits;
  const newGPA = (totalOldPoints + gradeImprovement) / current_credits;
  
  return {
    impact: {
      newGpa: Math.round(newGPA * 100) / 100,
      gpaImprovement: Math.round((newGPA - current_gpa) * 100) / 100
    },
    recommendations: [
      targetPoints > oldPoints 
        ? 'إعادة المقرر ستحسن معدلك التراكمي'
        : 'تأكد من أنك مستعد جيداً قبل الإعادة',
      'راجع المحتوى الذي واجهت صعوبة فيه سابقاً'
    ]
  };
}

function projectGrades(data: any) {
  const { current_gpa, current_credits, scenarios } = data;
  
  const results = scenarios.map((scenario: any) => {
    let scenarioPoints = 0;
    let scenarioCredits = 0;
    
    for (const course of scenario.courses) {
      const points = numberToPoints(course.expected_grade);
      scenarioPoints += points * course.credits;
      scenarioCredits += course.credits;
    }
    
    const totalPoints = (current_gpa * current_credits) + scenarioPoints;
    const totalCredits = current_credits + scenarioCredits;
    const projectedGPA = totalPoints / totalCredits;
    
    return {
      name: scenario.name,
      projectedGpa: Math.round(projectedGPA * 100) / 100,
      gpaChange: Math.round((projectedGPA - current_gpa) * 100) / 100,
      letterGrade: pointsToLetter(projectedGPA)
    };
  });
  
  // Find best and worst scenarios
  results.sort((a: any, b: any) => b.projectedGpa - a.projectedGpa);
  
  return {
    scenarios: results,
    bestScenario: results[0]?.name,
    worstScenario: results[results.length - 1]?.name
  };
}

function assessRisk(data: any) {
  const { gpa, credits_completed, year_level, failed_courses = 0 } = data;
  
  let riskScore = 0;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const factors: { name: string; weight: number; description: string }[] = [];
  const recommendations: string[] = [];
  
  // GPA Risk
  if (gpa < 2.0) {
    riskScore += 40;
    factors.push({ 
      name: 'معدل منخفض جداً', 
      weight: 40, 
      description: 'المعدل أقل من الحد الأدنى المطلوب' 
    });
    recommendations.push('التواصل مع المرشد الأكاديمي فوراً');
  } else if (gpa < 2.5) {
    riskScore += 25;
    factors.push({ 
      name: 'معدل منخفض', 
      weight: 25, 
      description: 'المعدل يحتاج إلى تحسين' 
    });
    recommendations.push('التركيز على تحسين الأداء الأكاديمي');
  }
  
  // Credit Progress Risk
  const expectedCredits = year_level * 30;
  if (credits_completed < expectedCredits * 0.7) {
    riskScore += 20;
    factors.push({ 
      name: 'تأخر في الساعات', 
      weight: 20, 
      description: 'الساعات المكتملة أقل من المتوقع' 
    });
    recommendations.push('زيادة عدد الساعات المسجلة في الفصول القادمة');
  }
  
  // Failed Courses Risk
  if (failed_courses > 0) {
    riskScore += failed_courses * 10;
    factors.push({ 
      name: 'مقررات راسبة', 
      weight: failed_courses * 10, 
      description: `${failed_courses} مقرر(ات) تحتاج إعادة` 
    });
    recommendations.push('إعادة المقررات الراسبة في أقرب وقت');
  }
  
  // Determine risk level
  if (riskScore >= 50) riskLevel = 'critical';
  else if (riskScore >= 35) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'medium';
  
  return {
    riskLevel,
    riskScore,
    factors,
    recommendations,
    predictedGpa: gpa + (riskScore > 30 ? -0.2 : 0.1) // Simple prediction
  };
}

async function getCriticalPath(data: any, supabase: any) {
  const { target_course, completed_courses = [] } = data;
  
  // Get target course with prerequisites
  const { data: course } = await supabase
    .from('courses')
    .select(`
      *,
      prerequisites:course_prerequisites(
        prerequisite:courses!course_prerequisites_prerequisite_id_fkey(
          code, name, name_ar, credits, year_level
        )
      )
    `)
    .eq('code', target_course)
    .single();
  
  if (!course) {
    throw new Error(`Course not found: ${target_course}`);
  }
  
  // Build path
  const path: any[] = [];
  const completedSet = new Set(completed_courses);
  
  // Add missing prerequisites
  for (const prereq of course.prerequisites || []) {
    if (!completedSet.has(prereq.prerequisite.code)) {
      path.push({
        code: prereq.prerequisite.code,
        name: prereq.prerequisite.name,
        name_ar: prereq.prerequisite.name_ar,
        credits: prereq.prerequisite.credits,
        semester: prereq.prerequisite.year_level
      });
    }
  }
  
  // Add target course
  path.push({
    code: course.code,
    name: course.name,
    name_ar: course.name_ar,
    credits: course.credits,
    semester: Math.max(...path.map((p: any) => p.semester), 0) + 1
  });
  
  const totalCredits = path.reduce((sum, p) => sum + p.credits, 0);
  const totalSemesters = Math.ceil(path.length / 4); // Assume 4 courses per semester max
  
  return {
    path,
    totalSemesters,
    totalCredits
  };
}
