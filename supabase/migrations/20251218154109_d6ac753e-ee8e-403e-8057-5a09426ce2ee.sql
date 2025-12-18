-- Update the handle_new_user function to also create a student record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    student_id_val TEXT;
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
    
    -- Get student_id from metadata or generate one
    student_id_val := COALESCE(
        NEW.raw_user_meta_data ->> 'student_id',
        LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0')
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
        'هندسة المعلوماتية',
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