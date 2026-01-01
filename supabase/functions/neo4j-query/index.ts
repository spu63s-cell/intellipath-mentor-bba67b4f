import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Neo4jRequest {
  operation: 'query' | 'import_all' | 'get_courses' | 'get_prerequisites' | 'get_majors' | 'get_full_graph' | 'get_major_graph';
  cypher?: string;
  params?: Record<string, any>;
  major_id?: string;
  course_code?: string;
}

interface Neo4jResponse {
  results: any[];
  errors?: string[];
}

async function executeNeo4jQuery(cypher: string, params: Record<string, any> = {}): Promise<Neo4jResponse> {
  const neo4jUri = Deno.env.get('NEO4J_URI');
  const neo4jUsername = Deno.env.get('NEO4J_USERNAME');
  const neo4jPassword = Deno.env.get('NEO4J_PASSWORD');

  if (!neo4jUri || !neo4jUsername || !neo4jPassword) {
    throw new Error('Neo4j connection details not configured');
  }

  console.log('Original NEO4J_URI:', neo4jUri);

  // Handle Neo4j Aura URIs - extract the host properly
  let httpUri: string;
  
  if (neo4jUri.includes('databases.neo4j.io')) {
    // Already a Neo4j Aura URI
    httpUri = neo4jUri
      .replace('neo4j+s://', 'https://')
      .replace('neo4j://', 'https://')
      .replace('bolt+s://', 'https://')
      .replace('bolt://', 'https://');
  } else if (neo4jUri.includes('.')) {
    // Might be just the host without protocol
    httpUri = `https://${neo4jUri.replace(/^(neo4j\+s|neo4j|bolt\+s|bolt):\/\//, '')}`;
  } else {
    // Just an instance ID - construct full Aura URL
    httpUri = `https://${neo4jUri}.databases.neo4j.io`;
  }

  // Ensure protocol is correct
  if (!httpUri.startsWith('http')) {
    httpUri = 'https://' + httpUri;
  }

  const apiUrl = `${httpUri}/db/neo4j/tx/commit`;

  console.log('Connecting to Neo4j HTTP API:', apiUrl);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${neo4jUsername}:${neo4jPassword}`),
    },
    body: JSON.stringify({
      statements: [{
        statement: cypher,
        parameters: params,
      }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Neo4j HTTP error:', response.status, errorText);
    throw new Error(`Neo4j request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    console.error('Neo4j query errors:', data.errors);
    return { results: [], errors: data.errors.map((e: any) => e.message) };
  }

  // Extract results
  const results: any[] = [];
  for (const result of data.results) {
    for (const record of result.data) {
      const row: Record<string, any> = {};
      result.columns.forEach((col: string, idx: number) => {
        row[col] = record.row[idx];
      });
      results.push(row);
    }
  }

  return { results };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: Neo4jRequest = await req.json();
    console.log('Neo4j operation:', request.operation);

    let result: any;

    switch (request.operation) {
      case 'query':
        if (!request.cypher) {
          throw new Error('Cypher query required');
        }
        result = await executeNeo4jQuery(request.cypher, request.params || {});
        break;

      case 'get_majors':
        result = await executeNeo4jQuery(`
          MATCH (m:Major)
          RETURN m.id as id, m.name as name, m.name_en as name_en, 
                 m.description as description, m.total_credits as total_credits
          ORDER BY m.name
        `);
        break;

      case 'get_courses':
        result = await executeNeo4jQuery(`
          MATCH (c:Course)
          OPTIONAL MATCH (c)-[:BELONGS_TO]->(m:Major)
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab,
                 c.description as description, c.objectives as objectives,
                 collect(DISTINCT m.name) as majors
          ORDER BY c.code
        `);
        break;

      case 'get_prerequisites':
        result = await executeNeo4jQuery(`
          MATCH (c1:Course)-[r:IS_PREREQUISITE_FOR]->(c2:Course)
          RETURN c1.code as prerequisite_code, c1.name as prerequisite_name,
                 c2.code as course_code, c2.name as course_name,
                 r.type as relationship_type
          ORDER BY c2.code, c1.code
        `);
        break;

      case 'get_full_graph':
        // Get all nodes and relationships
        const courses = await executeNeo4jQuery(`
          MATCH (c:Course)
          OPTIONAL MATCH (c)-[:BELONGS_TO]->(m:Major)
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab,
                 collect(DISTINCT m.id) as major_ids
          ORDER BY c.year_level, c.semester, c.code
        `);

        const prerequisites = await executeNeo4jQuery(`
          MATCH (c1:Course)-[:IS_PREREQUISITE_FOR]->(c2:Course)
          RETURN c1.code as from_code, c2.code as to_code
        `);

        const majors = await executeNeo4jQuery(`
          MATCH (m:Major)
          RETURN m.id as id, m.name as name, m.name_en as name_en
        `);

        result = {
          results: [{
            nodes: courses.results,
            edges: prerequisites.results,
            majors: majors.results,
            total_nodes: courses.results.length,
            total_edges: prerequisites.results.length
          }]
        };
        break;

      case 'get_major_graph':
        if (!request.major_id) {
          throw new Error('major_id required');
        }

        const majorCourses = await executeNeo4jQuery(`
          MATCH (c:Course)-[:BELONGS_TO]->(m:Major {id: $major_id})
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab
          ORDER BY c.year_level, c.semester, c.code
        `, { major_id: request.major_id });

        const courseCodes = majorCourses.results.map(c => c.code);

        const majorPrereqs = await executeNeo4jQuery(`
          MATCH (c1:Course)-[:IS_PREREQUISITE_FOR]->(c2:Course)
          WHERE c1.code IN $codes OR c2.code IN $codes
          RETURN c1.code as from_code, c2.code as to_code
        `, { codes: courseCodes });

        const majorInfo = await executeNeo4jQuery(`
          MATCH (m:Major {id: $major_id})
          RETURN m.id as id, m.name as name, m.name_en as name_en, 
                 m.description as description, m.total_credits as total_credits
        `, { major_id: request.major_id });

        result = {
          results: [{
            nodes: majorCourses.results,
            edges: majorPrereqs.results,
            major: majorInfo.results[0] || null,
            total_nodes: majorCourses.results.length,
            total_edges: majorPrereqs.results.length
          }]
        };
        break;

      case 'import_all':
        // Get all data from Neo4j for syncing to Supabase
        const allCourses = await executeNeo4jQuery(`
          MATCH (c:Course)
          OPTIONAL MATCH (c)-[:BELONGS_TO]->(m:Major)
          OPTIONAL MATCH (c)-[:TEACHES_SKILL]->(s:Skill)
          OPTIONAL MATCH (c)-[:COVERS_TOPIC]->(t:Topic)
          OPTIONAL MATCH (c)-[:TEACHES_TOOL]->(tool:Tool)
          OPTIONAL MATCH (c)-[:LEADS_TO_CAREER]->(cp:CareerPath)
          RETURN c.id as id, c.code as code, c.name as name, c.name_ar as name_ar,
                 c.credits as credits, c.department as department, c.year_level as year_level,
                 c.semester as semester, c.hours_theory as hours_theory, c.hours_lab as hours_lab,
                 c.description as description, c.objectives as objectives,
                 c.is_bottleneck as is_bottleneck, c.critical_path_depth as critical_path_depth,
                 collect(DISTINCT m.id) as major_ids,
                 collect(DISTINCT s.name) as skills,
                 collect(DISTINCT t.name) as topics,
                 collect(DISTINCT tool.name) as tools,
                 collect(DISTINCT cp.name) as career_paths
          ORDER BY c.code
        `);

        const allPrereqs = await executeNeo4jQuery(`
          MATCH (c1:Course)-[r:IS_PREREQUISITE_FOR]->(c2:Course)
          RETURN c1.code as from_code, c2.code as to_code, r.type as type
        `);

        const allMajors = await executeNeo4jQuery(`
          MATCH (m:Major)
          RETURN m.id as id, m.name as name, m.name_en as name_en,
                 m.description as description, m.total_credits as total_credits
        `);

        const allSkills = await executeNeo4jQuery(`
          MATCH (s:Skill)
          RETURN s.name as name, s.description as description, s.category as category
        `);

        const allTopics = await executeNeo4jQuery(`
          MATCH (t:Topic)
          RETURN t.name as name, t.description as description
        `);

        const allTools = await executeNeo4jQuery(`
          MATCH (t:Tool)
          RETURN t.name as name, t.description as description, t.category as category
        `);

        const allCareerPaths = await executeNeo4jQuery(`
          MATCH (cp:CareerPath)
          RETURN cp.name as name, cp.name_en as name_en, cp.description as description
        `);

        result = {
          results: [{
            courses: allCourses.results,
            prerequisites: allPrereqs.results,
            majors: allMajors.results,
            skills: allSkills.results,
            topics: allTopics.results,
            tools: allTools.results,
            career_paths: allCareerPaths.results,
            stats: {
              courses: allCourses.results.length,
              prerequisites: allPrereqs.results.length,
              majors: allMajors.results.length,
              skills: allSkills.results.length,
              topics: allTopics.results.length,
              tools: allTools.results.length,
              career_paths: allCareerPaths.results.length
            }
          }]
        };
        break;

      default:
        throw new Error(`Unknown operation: ${request.operation}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    console.error('Neo4j function error:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
