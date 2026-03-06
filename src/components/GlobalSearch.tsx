import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, ListTodo, User, Building2 } from 'lucide-react';

interface SearchResult {
  type: 'task' | 'user' | 'department';
  id: string;
  label: string;
  sublabel?: string;
}

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const q = `%${query}%`;
      const [tasksRes, profilesRes, deptsRes] = await Promise.all([
        supabase.from('tasks').select('id, title, status').ilike('title', q).limit(5),
        supabase.from('profiles').select('user_id, full_name, email').ilike('full_name', q).limit(5),
        supabase.from('departments').select('id, name').ilike('name', q).limit(5),
      ]);

      const r: SearchResult[] = [
        ...(tasksRes.data || []).map(t => ({ type: 'task' as const, id: t.id, label: t.title, sublabel: t.status })),
        ...(profilesRes.data || []).map(p => ({ type: 'user' as const, id: p.user_id, label: p.full_name, sublabel: p.email })),
        ...(deptsRes.data || []).map(d => ({ type: 'department' as const, id: d.id, label: d.name })),
      ];
      setResults(r);
      setOpen(r.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    setQuery('');
    if (r.type === 'task') navigate('/tracker');
    else if (r.type === 'user') navigate('/users');
    else navigate('/departments');
  };

  const iconMap = { task: ListTodo, user: User, department: Building2 };

  return (
    <div className="relative" ref={ref}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search tasks, users, departments..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="pl-9 h-9 bg-muted/50 w-full"
      />
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map((r, i) => {
            const Icon = iconMap[r.type];
            return (
              <button
                key={`${r.type}-${r.id}-${i}`}
                onClick={() => handleSelect(r)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors text-sm"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.label}</p>
                  {r.sublabel && <p className="text-xs text-muted-foreground truncate capitalize">{r.sublabel}</p>}
                </div>
                <span className="ml-auto text-xs text-muted-foreground capitalize shrink-0">{r.type}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
