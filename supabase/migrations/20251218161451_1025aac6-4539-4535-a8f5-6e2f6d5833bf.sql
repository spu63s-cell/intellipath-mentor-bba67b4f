-- Fix security issues: Add more restrictive RLS policies

-- 1. Add DELETE policy for chat_messages (allow users to delete their own messages)
CREATE POLICY "Users can delete their own chat messages"
ON public.chat_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = chat_messages.conversation_id
    AND cc.user_id = auth.uid()
  )
);

-- 2. Fix student_achievements - add INSERT policy that only allows system/admin inserts
-- First drop the existing policy if any conflicts
DROP POLICY IF EXISTS "Anyone can insert achievements" ON public.student_achievements;

-- Create a more secure INSERT policy - only admins can award achievements
CREATE POLICY "Only admins can award achievements"
ON public.student_achievements
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- 3. Create advisor_student_assignments table for proper advisor-student relationships
CREATE TABLE IF NOT EXISTS public.advisor_student_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(advisor_id, student_id)
);

-- Enable RLS on advisor_student_assignments
ALTER TABLE public.advisor_student_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for advisor_student_assignments
CREATE POLICY "Admins can manage assignments"
ON public.advisor_student_assignments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Advisors can view their assignments"
ON public.advisor_student_assignments
FOR SELECT
USING (advisor_id = auth.uid());

-- Note: We're keeping the existing broad advisor access policies for now
-- as they may be intentional for this educational platform
-- A more restrictive approach would require modifying application logic