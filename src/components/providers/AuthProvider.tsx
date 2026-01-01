import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// Priority order: admin > advisor > student (higher = more privileges)
const ROLE_PRIORITY: Record<string, number> = {
  admin: 100,
  advisor: 50,
  student: 10,
};

const getHighestRole = (roles: { role: string }[]): 'student' | 'advisor' | 'admin' | null => {
  if (!roles || roles.length === 0) return null;
  
  // Find role with highest priority
  let highestRole: string | null = null;
  let highestPriority = -1;
  
  for (const r of roles) {
    const priority = ROLE_PRIORITY[r.role] ?? 0;
    if (priority > highestPriority) {
      highestPriority = priority;
      highestRole = r.role;
    }
  }
  
  return highestRole as 'student' | 'advisor' | 'admin' | null;
};

const fetchAndSetRole = async (userId: string, setUserRole: (role: 'student' | 'advisor' | 'admin' | null) => void) => {
  try {
    const { data: rolesData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching roles:', error);
      return;
    }
    
    if (rolesData && rolesData.length > 0) {
      const highestRole = getHighestRole(rolesData);
      console.log('User roles:', rolesData, '-> Highest:', highestRole);
      setUserRole(highestRole);
    } else {
      setUserRole(null);
    }
  } catch (err) {
    console.error('Error in fetchAndSetRole:', err);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setIsLoading, setUserRole } = useAuthStore();
  const rolesFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only fetch roles if we haven't fetched for this user yet
          if (rolesFetchedRef.current !== session.user.id) {
            rolesFetchedRef.current = session.user.id;
            // Use setTimeout to prevent Supabase auth deadlock
            setTimeout(() => {
              if (isMounted) {
                fetchAndSetRole(session.user.id, setUserRole);
              }
            }, 0);
          }
        } else {
          rolesFetchedRef.current = null;
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && rolesFetchedRef.current !== session.user.id) {
        rolesFetchedRef.current = session.user.id;
        await fetchAndSetRole(session.user.id, setUserRole);
      }
      
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setIsLoading, setUserRole]);

  return <>{children}</>;
}
