import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id, student_id, full_name } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Attempting to link user ${user_id} with student_id: ${student_id}, name: ${full_name}`);

    let linkedStudent = null;

    // Strategy 1: Link by student_id if provided
    if (student_id) {
      const { data: student, error } = await supabase
        .from("students")
        .select("id, student_id, user_id")
        .eq("student_id", student_id)
        .single();

      if (student && !student.user_id) {
        // Student exists and not linked - link them
        const { error: updateError } = await supabase
          .from("students")
          .update({ user_id: user_id })
          .eq("id", student.id);

        if (!updateError) {
          linkedStudent = student;
          console.log(`Successfully linked user ${user_id} to student ${student_id}`);
        } else {
          console.error(`Error linking student: ${updateError.message}`);
        }
      } else if (student && student.user_id === user_id) {
        // Already linked to this user
        linkedStudent = student;
        console.log(`Student ${student_id} already linked to user ${user_id}`);
      } else if (student && student.user_id) {
        // Linked to different user
        console.log(`Student ${student_id} already linked to different user`);
      } else {
        console.log(`Student ${student_id} not found in system`);
      }
    }

    // Strategy 2: Try linking by name if student_id didn't work
    if (!linkedStudent && full_name) {
      // Find unlinked student with similar name
      const { data: students } = await supabase
        .from("students")
        .select("id, student_id, user_id")
        .is("user_id", null)
        .limit(100);

      // Get profiles to compare names
      if (students && students.length > 0) {
        // We don't have name in students table, so this is limited
        // In production, you'd want to add a name field to students
        console.log(`Found ${students.length} unlinked students, but name matching requires name in students table`);
      }
    }

    // Update the profiles table if we have data
    if (full_name) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user_id)
        .single();

      if (!existingProfile) {
        // Get user email
        const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
        
        if (user) {
          await supabase
            .from("profiles")
            .insert({
              user_id: user_id,
              full_name: full_name,
              email: user.email || '',
            });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        linked: !!linkedStudent,
        student_id: linkedStudent?.student_id || null,
        message: linkedStudent 
          ? `Successfully linked to student ${linkedStudent.student_id}`
          : student_id 
            ? `Student ${student_id} not found or already linked`
            : "No student_id provided for linking",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in link-student:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
        linked: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
