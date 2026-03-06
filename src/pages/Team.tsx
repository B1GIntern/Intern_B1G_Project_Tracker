import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  department: string;
}

const Team = () => {
  const { user, role } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (!user || role !== 'manager') return;
    const fetchTeam = async () => {
      // Get manager's departments
      const { data: myDepts } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', user.id);

      if (!myDepts?.length) return;

      const deptIds = myDepts.map(d => d.department_id);

      // Get all users in those departments
      const { data: deptUsers } = await supabase
        .from('user_departments')
        .select('user_id, department_id')
        .in('department_id', deptIds);

      if (!deptUsers?.length) return;

      const userIds = [...new Set(deptUsers.map(u => u.user_id))];

      const [profilesRes, rolesRes, deptsRes] = await Promise.all([
        supabase.from('profiles').select('*').in('user_id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('departments').select('id, name').in('id', deptIds),
      ]);

      const profiles = profilesRes.data || [];
      const allRoles = rolesRes.data || [];
      const depts = deptsRes.data || [];

      const teamMembers: TeamMember[] = profiles.map(p => {
        const r = allRoles.find(r => r.user_id === p.user_id);
        const ud = deptUsers.find(d => d.user_id === p.user_id);
        const dept = depts.find(d => d.id === ud?.department_id);
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          avatar_url: p.avatar_url,
          role: r?.role || 'user',
          department: dept?.name || '—',
        };
      });

      setMembers(teamMembers);
    };
    fetchTeam();
  }, [user, role]);

  if (role !== 'manager') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Manager only.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-display font-bold">My Team</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <Card key={m.user_id} className="border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <UserAvatar fullName={m.full_name} avatarUrl={m.avatar_url} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{m.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize text-xs">{m.role}</Badge>
                    <span className="text-xs text-muted-foreground">{m.department}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && (
            <Card className="border-border/50 col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No team members found. Ensure you're assigned to a department.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Team;
