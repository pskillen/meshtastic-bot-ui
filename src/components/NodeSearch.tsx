import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNodes } from '@/hooks/api/useNodes';
import { SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NodeSearchProps {
  onNodeSelect?: (
    nodeId: number,
    node?: { short_name?: string | null; long_name?: string | null; node_id_str?: string }
  ) => void;
  /** When set, shows the selected node name instead of search (e.g. after selection from map) */
  displayValue?: string | null;
  /** Called when user clears the selection */
  onClearSelection?: () => void;
}

export function NodeSearch({ onNodeSelect, displayValue, onClearSelection }: NodeSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { searchNodes, searchResults, isSearching } = useNodes();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchNodes(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchNodes]);

  const searchFieldShell =
    'rounded-lg border-2 border-slate-300 bg-white shadow-md shadow-slate-900/10 dark:border-slate-500 dark:bg-slate-950 dark:shadow-md dark:shadow-black/35';

  const searchInputClass =
    'h-9 w-full border-0 bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-teal-500/45 dark:focus-visible:ring-teal-400/35';

  if (displayValue != null && displayValue !== '') {
    return (
      <div className="flex items-center gap-2">
        <div className={`relative min-w-0 flex-1 ${searchFieldShell}`}>
          <Input type="text" readOnly className={`${searchInputClass} pr-3`} value={displayValue} />
        </div>
        {onClearSelection && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className={`relative ${searchFieldShell}`}>
        <Input
          type="text"
          placeholder="Search nodes..."
          className={`${searchInputClass} pr-10`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <SearchIcon
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          aria-hidden
        />
      </div>

      {isOpen && (query.length >= 2 || searchResults) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-lg border-2 border-slate-300 bg-popover shadow-lg shadow-slate-900/15 dark:border-slate-600 dark:shadow-black/50">
          {isSearching ? (
            <div className="p-2 text-center">
              <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400 dark:border-t-transparent" />
            </div>
          ) : searchResults?.length === 0 ? (
            <div className="p-2 text-muted-foreground">No nodes found</div>
          ) : (
            <ul className="py-1">
              {searchResults?.map((node) => (
                <li key={node.internal_id}>
                  <Link
                    to={onNodeSelect ? '#' : `/nodes/${node.node_id}`}
                    className="block px-4 py-2 hover:bg-accent"
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                      if (onNodeSelect) {
                        onNodeSelect(node.node_id, node);
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{node.short_name}</span>
                      <span className="text-sm text-muted-foreground">{node.long_name}</span>
                      <span className="text-sm text-muted-foreground">{node.node_id_str}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
