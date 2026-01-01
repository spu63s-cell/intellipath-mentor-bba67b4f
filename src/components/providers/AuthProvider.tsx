import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// Priority order: admin > advisor > student
const getRolePriority = (role: string): number => {
  switch (role) {
    case 'admin': return 3;
    case 'advisor': return 2;
    case 'student': return 1;
    default: return 0;
  }
};

const getHighestRole = (roles: { role: string }[]): 'student' | 'advisor' | 'admin' | null => {
  if (!roles || roles.length === 0) return null;
  
  const sortedRoles = roles.sort((a, b) => getRolePriority(b.role) - getRolePriority(a.role));
  return sortedRoles[0].role as 'student' | 'advisor' | 'admin';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setIsLoading, setUserRole, reset } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user roles with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(async () => {
            const { data: rolesData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id);
            
            if (rolesData && rolesData.length > 0) {
              const highestRole = getHighestRole(rolesData);
              setUserRole(highestRole);
            }
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .then(({ data: rolesData }) => {
            if (rolesData && rolesData.length > 0) {
              const highestRole = getHighestRole(rolesData);
              setUserRole(highestRole);
            }
          });
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setIsLoading, setUserRole]);

  return <>{children}</>;
}
