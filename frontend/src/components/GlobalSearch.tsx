import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, ListTodo, User, Building2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Search failed');
        const data: SearchResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      }
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