import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface GraphNode {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  credits: number;
  department: string;
  year_level: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'REQUIRES';
}

interface GraphQueryRequest {
  operation: 'prerequisites' | 'dependents' | 'path' | 'full_graph' | 'critical_path';
  course_code?: string;
  target_code?: string;
  department?: string;
}

// Simulates Neo4j graph queries using course_prerequisites table
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { operation, course_code, target_code, department }: GraphQueryRequest = await req.json();

    console.log(`Graph query: ${operation}, course: ${course_code}`);

    // Get all courses
    let coursesQuery = supabase
      .from('courses')
      .select('id, code, name, name_ar, credits, department, year_level')
      .eq('is_active', true);

    if (department) {
      coursesQuery = coursesQuery.eq('department', department);
    }

    const { data: courses, error: coursesError } = await coursesQuery;
    if (coursesError) throw coursesError;

    // Get all prerequisites
    const { data: prerequisites, error: prereqError } = await supabase
      .from('course_prerequisites')
      .select(`
        course_id,
        prerequisite_id,
        course:courses!course_prerequisites_course_id_fkey(code, name),
        prerequisite:courses!course_prerequisites_prerequisite_id_fkey(code, name)
      `);

    if (prereqError) throw prereqError;

    // Build course map
    const courseMap = new Map<string, GraphNode>();
    const codeToId = new Map<string, string>();
    const idToCode = new Map<string, string>();

    if (courses) {
      for (const course of courses) {
        const node: GraphNode = {
          id: course.id,
          code: course.code,
          name: course.name,
          name_ar: course.name_ar,
          credits: course.credits,
          department: course.department,
          year_level: course.year_level
        };
        courseMap.set(course.id, node);
        codeToId.set(course.code, course.id);
        idToCode.set(course.id, course.code);
      }
    }

    // Build adjacency lists
    const prerequisitesOf = new Map<string, Set<string>>(); // course -> its prerequisites
    const dependentsOf = new Map<string, Set<string>>(); // course -> courses that require it

    if (prerequisites) {
      for (const prereq of prerequisites) {
        const courseId = prereq.course_id;
        const prereqId = prereq.prerequisite_id;

        if (!prerequisitesOf.has(courseId)) {
          prerequisitesOf.set(courseId, new Set());
        }
        prerequisitesOf.get(courseId)!.add(prereqId);

        if (!dependentsOf.has(prereqId)) {
          dependentsOf.set(prereqId, new Set());
        }
        dependentsOf.get(prereqId)!.add(courseId);
      }
    }

    // Helper: Get all prerequisites recursively (DFS)
    const getAllPrerequisites = (courseId: string, visited = new Set<string>()): string[] => {
      if (visited.has(courseId)) return [];
      visited.add(courseId);

      const directPrereqs = prerequisitesOf.get(courseId) || new Set();
      const allPrereqs: string[] = [];

      for (const prereqId of directPrereqs) {
        allPrereqs.push(prereqId);
        allPrereqs.push(...getAllPrerequisites(prereqId, visited));
      }

      return [...new Set(allPrereqs)];
    };

    // Helper: Get all dependents recursively
    const getAllDependents = (courseId: string, visited = new Set<string>()): string[] => {
      if (visited.has(courseId)) return [];
      visited.add(courseId);

      const directDeps = dependentsOf.get(courseId) || new Set();
      const allDeps: string[] = [];

      for (const depId of directDeps) {
        allDeps.push(depId);
        allDeps.push(...getAllDependents(depId, visited));
      }

      return [...new Set(allDeps)];
    };

    // Helper: Find shortest path (BFS)
    const findPath = (startId: string, endId: string): string[] => {
      const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const { id, path } = queue.shift()!;
        
        if (id === endId) {
          return path;
        }

        if (visited.has(id)) continue;
        visited.add(id);

        const prereqs = prerequisitesOf.get(id) || new Set();
        for (const prereqId of prereqs) {
          if (!visited.has(prereqId)) {
            queue.push({ id: prereqId, path: [...path, prereqId] });
          }
        }
      }

      return [];
    };

    // Helper: Find critical path (longest path to course with no prerequisites)
    const findCriticalPath = (courseId: string): string[] => {
      const prereqs = getAllPrerequisites(courseId);
      if (prereqs.length === 0) return [courseId];

      // Find course with no prerequisites
      let longestPath: string[] = [];
      
      const dfs = (current: string, path: string[]): void => {
        const currentPrereqs = prerequisitesOf.get(current) || new Set();
        
        if (currentPrereqs.size === 0) {
          if (path.length > longestPath.length) {
            longestPath = [...path];
          }
          return;
        }

        for (const prereqId of currentPrereqs) {
          if (!path.includes(prereqId)) {
            dfs(prereqId, [...path, prereqId]);
          }
        }
      };

      dfs(courseId, [courseId]);
      return longestPath.reverse();
    };

    let result: any;

    switch (operation) {
      case 'prerequisites': {
        if (!course_code) {
          return new Response(
            JSON.stringify({ error: "course_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const courseId = codeToId.get(course_code);
        if (!courseId) {
          return new Response(
            JSON.stringify({ error: `Course ${course_code} not found` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const prereqIds = getAllPrerequisites(courseId);
        const prereqNodes = prereqIds
          .map(id => courseMap.get(id))
          .filter(Boolean)
          .sort((a, b) => (a?.year_level || 0) - (b?.year_level || 0));

        result = {
          course: courseMap.get(courseId),
          prerequisites: prereqNodes,
          total: prereqNodes.length
        };
        break;
      }

      case 'dependents': {
        if (!course_code) {
          return new Response(
            JSON.stringify({ error: "course_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const courseId = codeToId.get(course_code);
        if (!courseId) {
          return new Response(
            JSON.stringify({ error: `Course ${course_code} not found` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const depIds = getAllDependents(courseId);
        const depNodes = depIds
          .map(id => courseMap.get(id))
          .filter(Boolean)
          .sort((a, b) => (a?.year_level || 0) - (b?.year_level || 0));

        result = {
          course: courseMap.get(courseId),
          dependents: depNodes,
          total: depNodes.length
        };
        break;
      }

      case 'path': {
        if (!course_code || !target_code) {
          return new Response(
            JSON.stringify({ error: "course_code and target_code are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const startId = codeToId.get(course_code);
        const endId = codeToId.get(target_code);

        if (!startId || !endId) {
          return new Response(
            JSON.stringify({ error: "One or both courses not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const pathIds = findPath(startId, endId);
        const pathNodes = pathIds.map(id => courseMap.get(id)).filter(Boolean);

        result = {
          from: courseMap.get(startId),
          to: courseMap.get(endId),
          path: pathNodes,
          exists: pathIds.length > 0
        };
        break;
      }

      case 'critical_path': {
        if (!course_code) {
          return new Response(
            JSON.stringify({ error: "course_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const courseId = codeToId.get(course_code);
        if (!courseId) {
          return new Response(
            JSON.stringify({ error: `Course ${course_code} not found` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const pathIds = findCriticalPath(courseId);
        const pathNodes = pathIds.map(id => courseMap.get(id)).filter(Boolean);

        result = {
          course: courseMap.get(courseId),
          critical_path: pathNodes,
          length: pathNodes.length,
          total_credits: pathNodes.reduce((sum, n) => sum + (n?.credits || 0), 0)
        };
        break;
      }

      case 'full_graph': {
        const nodes: GraphNode[] = Array.from(courseMap.values());
        const edges: GraphEdge[] = [];

        if (prerequisites) {
          for (const prereq of prerequisites) {
            const fromCode = idToCode.get(prereq.course_id);
            const toCode = idToCode.get(prereq.prerequisite_id);
            if (fromCode && toCode) {
              edges.push({
                from: fromCode,
                to: toCode,
                type: 'REQUIRES'
              });
            }
          }
        }

        result = {
          nodes,
          edges,
          total_nodes: nodes.length,
          total_edges: edges.length
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Graph query error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Query failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
