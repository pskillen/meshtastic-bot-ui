import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { NodeDetailContent } from '@/components/nodes/NodeDetailContent';
import { useNodeDetailPageTabs } from '@/pages/nodes/useNodeDetailPageTabs';

export function NodeDetails() {
  const { id } = useParams<{ id: string }>();
  const nodeId = parseInt(id || '0', 10);
  const { activeTab, onTabChange } = useNodeDetailPageTabs();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-teal-500"></div>
        </div>
      }
    >
      <NodeDetailContent nodeId={nodeId} activeTab={activeTab} onTabChange={onTabChange} />
    </Suspense>
  );
}
