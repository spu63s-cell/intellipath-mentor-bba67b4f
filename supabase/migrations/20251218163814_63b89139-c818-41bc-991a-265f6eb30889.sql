-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Advisors can view all profiles" ON public.profiles;

-- Create a more restrictive policy that only allows advisors to view profiles of their assigned students
CREATE POLICY "Advisors can view assigned student profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always view their own profile
  auth.uid() = user_id
  OR
  -- Admins can view all profiles
  has_role(auth.uid(), 'admin')
  OR
  -- Advisors can only view profiles of students assigned to them
  (
    has_role(auth.uid(), 'advisor') 
    AND EXISTS (
      SELECT 1 
      FROM public.students s
      INNER JOIN public.advisor_student_assignments asa ON asa.student_id = s.id
      WHERE s.user_id = profiles.user_id
        AND asa.advisor_id = auth.uid()
    )
  )
);

-- Drop the redundant "Users can view their own profile" policy since it's now included above
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;