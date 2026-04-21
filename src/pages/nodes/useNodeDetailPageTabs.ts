import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isValidNodeDetailTab, parseNodeDetailTab, type NodeDetailTab } from '@/lib/node-detail-tab';

export function useNodeDetailPageTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = parseNodeDetailTab(rawTab);

  useEffect(() => {
    if (rawTab != null && !isValidNodeDetailTab(rawTab)) {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    }
  }, [rawTab, searchParams, setSearchParams]);

  const onTabChange = useCallback(
    (tab: NodeDetailTab) => {
      const next = new URLSearchParams(searchParams);
      if (tab === 'overview') {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return { activeTab, onTabChange };
}
