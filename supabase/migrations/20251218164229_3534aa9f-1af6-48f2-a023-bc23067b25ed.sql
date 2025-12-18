-- Drop the existing policy
DROP POLICY IF EXISTS "Advisors can view assigned student profiles" ON public.profiles;

-- Create new policy that explicitly requires authentication
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR (
      has_role(auth.uid(), 'advisor'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM students s
        JOIN advisor_student_assignments asa ON asa.student_id = s.id
        WHERE s.user_id = profiles.user_id AND asa.advisor_id = auth.uid()
      )
    )
  )
);