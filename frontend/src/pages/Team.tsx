import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import UserAvatar from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Mail, ShieldCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  department: string;
  department_id: string;
}

const ITEMS_PER_PAGE = 9;

const ROLE_STYLES: Record<string, string> = {
  admin:    'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/40',
  manager:  'bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-900/30   dark:text-blue-300   dark:border-blue-700/40',
  employee: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
  user:     'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
};

/* ── skeleton card ── */
const SkeletonCard = () => (
  <div className="rounded-2xl border border-border/50 bg-card p-5 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-5 bg-muted rounded w-1/4 mt-1" />
      </div>
    </div>
  </div>
);

const Team = () => {
  const { user, profile, role } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user || role !== 'manager') return;
      try {
        setLoading(true);
        const token = localStorage.getItem('b1g_token');
        const res = await fetch(`${API_BASE}/users/team`, {
          credentials: 'include',
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (!res.ok) return;
        const data = await res.json();
        setMembers(data.data || []);
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamMembers();
  }, [user, profile, role]);

  /* ── access denied ── */
  if (role !== 'manager') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <UserX className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>
          <p className="font-semibold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground">This page is only available to managers.</p>
        </div>
      </AppLayout>
    );
  }

  /* ── flatten members for pagination ── */
  const allMembers = members;
  const totalPages = Math.ceil(allMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = allMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ── department grouping ── */
  const grouped = paginatedMembers.reduce<Record<string, TeamMember[]>>((acc, m) => {
    const dept = m.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(m);
    return acc;
  }, {});

  const deptNames = Object.keys(grouped).sort();

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-8 w-full">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 w-full">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Manager View</p>
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">My Team</h1>
          </div>

          {/* Member count pill — top right aligned under navbar */}
          {!loading && members.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/60 shadow-sm shrink-0 self-start">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{members.length}</span>
              <span className="text-xs text-muted-foreground">{members.length === 1 ? 'member' : 'members'}</span>
            </div>
          )}
        </div>

        {/* ── Skeleton loading ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && members.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
              <Users className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground">No team members found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ensure you're assigned to a department and members have been added.
            </p>
          </div>
        )}

        {/* ── Department groups ── */}
        {!loading && deptNames.map(dept => (
          <div key={dept} className="space-y-3">

            {/* Department label */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary shrink-0">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{dept}</span>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {grouped[dept].length} {grouped[dept].length === 1 ? 'person' : 'people'}
              </span>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[dept].map((m, idx) => (
                <div
                  key={m.user_id}
                  className="group relative rounded-2xl border border-border/60 bg-card text-card-foreground
                    shadow-sm hover:shadow-md hover:border-primary/30
                    transition-all duration-200 overflow-hidden"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Subtle top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="p-5 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="shrink-0 mt-0.5">
                      <UserAvatar
                        fullName={m.full_name}
                        avatarUrl={m.avatar_url}
                        size="md"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate leading-tight">
                        {m.full_name}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`capitalize text-[10px] font-semibold px-2 py-0.5 border
                            ${ROLE_STYLES[m.role.toLowerCase()] ?? ROLE_STYLES['user']}`}
                        >
                          <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                          {m.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {!loading && members.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium
              hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                  ${currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-accent text-foreground'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium
              hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Showing X of Y ── */}
      {!loading && members.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pt-2">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, members.length)} of {members.length} members
        </p>
      )}
    </AppLayout>
  );
};

export default Team;