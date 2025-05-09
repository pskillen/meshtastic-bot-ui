import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserClaims } from '@/hooks/api/useNodeClaims';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function MyNodes() {
  const { data: claims, isLoading, error } = useUserClaims();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Node Claims</CardTitle>
          <CardDescription>View your pending and approved node claims</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">Error loading claims: {error.message}</div>
          ) : claims && claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim) => {
                const isPending = !claim.accepted_at;
                return (
                  <div key={claim.node.node_id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{claim.node.short_name || claim.node.node_id_str}</h3>
                        <p className="text-sm text-gray-500">{claim.node.long_name}</p>
                        <p className="text-xs text-gray-400">Node ID: {claim.node.node_id_str}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Claimed {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant={isPending ? 'outline' : 'default'}>{isPending ? 'Pending' : 'Approved'}</Badge>
                    </div>
                    <div className="mt-2">
                      <Link to={`/nodes/${claim.node.node_id}`} className="text-blue-500 hover:text-blue-700 text-sm">
                        View Node
                      </Link>
                      {isPending && (
                        <div className="mt-2">
                          <p className="text-sm">
                            Claim Key: <span className="font-mono">{claim.claim_key}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Send this key as a direct message message from your node to one of the managed nodes to
                            complete the claim process.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 py-4">You don't have any node claims yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
