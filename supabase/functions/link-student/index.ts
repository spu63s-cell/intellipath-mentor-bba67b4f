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

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the JWT and get the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { student_id, full_name } = body;
    
    // Security: User can only link themselves, not other users
    const user_id = user.id;

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
        // Linked to different user - security issue, don't allow
        console.log(`Student ${student_id} already linked to different user - access denied`);
        return new Response(
          JSON.stringify({ 
            error: "This student ID is already linked to another account",
            success: false,
            linked: false,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.log(`Student ${student_id} not found in system`);
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
        await supabase
          .from("profiles")
          .insert({
            user_id: user_id,
            full_name: full_name,
            email: user.email || '',
          });
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
