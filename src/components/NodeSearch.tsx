import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNodes } from '@/hooks/api/useNodes';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NodeSearchProps {
  onNodeSelect?: (nodeId: number) => void;
}

export function NodeSearch({ onNodeSelect }: NodeSearchProps) {
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

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search nodes..."
          className="h-9 w-full"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <SearchIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {isOpen && (query.length >= 2 || searchResults) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 bg-popover rounded-lg shadow-lg border border-border">
          {isSearching ? (
            <div className="p-2 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mx-auto"></div>
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
                      if (onNodeSelect) {
                        onNodeSelect(node.node_id);
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
