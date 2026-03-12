import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import UserAvatar from '@/components/UserAvatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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
      try {
        const res = await fetch(`${API_BASE}/team`, { credentials: 'include' });
        if (!res.ok) return;
        setMembers(await res.json());
      } catch {
        setMembers([]);
      }
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