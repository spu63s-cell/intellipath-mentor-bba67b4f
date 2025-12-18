-- Create deadlines table for tracking student deadlines
CREATE TABLE public.deadlines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    reminder_days INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

-- Students can view their own deadlines
CREATE POLICY "Students can view their deadlines"
ON public.deadlines
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = deadlines.student_id AND s.user_id = auth.uid()
    )
);

-- Students can create their own deadlines
CREATE POLICY "Students can create deadlines"
ON public.deadlines
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = deadlines.student_id AND s.user_id = auth.uid()
    )
);

-- Students can update their own deadlines
CREATE POLICY "Students can update their deadlines"
ON public.deadlines
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = deadlines.student_id AND s.user_id = auth.uid()
    )
);

-- Students can delete their own deadlines
CREATE POLICY "Students can delete their deadlines"
ON public.deadlines
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = deadlines.student_id AND s.user_id = auth.uid()
    )
);

-- Advisors can view all deadlines
CREATE POLICY "Advisors can view all deadlines"
ON public.deadlines
FOR SELECT
USING (has_role(auth.uid(), 'advisor') OR has_role(auth.uid(), 'admin'));

-- Update handle_new_user to use department from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    student_id_val TEXT;
    department_val TEXT;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email
    );
    
    -- Assign default student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
    
    -- Get student_id and department from metadata
    student_id_val := COALESCE(
        NEW.raw_user_meta_data ->> 'student_id',
        LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0')
    );
    
    department_val := COALESCE(
        NEW.raw_user_meta_data ->> 'department',
        'هندسة المعلوماتية'
    );
    
    -- Create student record
    INSERT INTO public.students (
        user_id,
        student_id,
        department,
        year_level,
        gpa,
        total_credits,
        xp_points,
        level,
        streak_days
    )
    VALUES (
        NEW.id,
        student_id_val,
        department_val,
        1,
        0.00,
        0,
        0,
        1,
        0
    );
    
    RETURN NEW;
END;
$$;