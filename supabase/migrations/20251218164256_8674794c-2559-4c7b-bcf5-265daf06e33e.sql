-- Drop existing SELECT policies on students table
DROP POLICY IF EXISTS "Advisors can view all students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;

-- Create new combined policy that explicitly requires authentication
CREATE POLICY "Authenticated users can view students"
ON public.students
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'advisor'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);