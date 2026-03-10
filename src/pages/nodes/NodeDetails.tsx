import { useParams } from 'react-router-dom';
import { NodeDetailContent } from '@/components/nodes/NodeDetailContent';
import { Suspense } from 'react';

export function NodeDetails() {
  const { id } = useParams<{ id: string }>();
  const nodeId = parseInt(id || '0', 10);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      }
    >
      <NodeDetailContent nodeId={nodeId} />
    </Suspense>
  );
}
