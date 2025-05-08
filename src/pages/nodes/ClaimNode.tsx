import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNodeSuspense, useManagedNodesSuspense } from '@/hooks/api/useNodes';
import { useMeshtasticApi } from '@/hooks/api/useApi';
import { ConstellationsMap } from '@/components/nodes/ConstellationsMap';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NodeClaim } from '@/lib/models';

export function ClaimNode() {
  const { id } = useParams<{ id: string }>();
  const nodeId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const api = useMeshtasticApi();

  const [claimKey, setClaimKey] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<NodeClaim | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const node = useNodeSuspense(nodeId);
  const { managedNodes } = useManagedNodesSuspense();
  const isLoadingManagedNodes = !managedNodes;
  const managedNodesError = false; // Suspense disables error state, so just set to false

  // On mount, check for existing claim status and start polling if in progress
  useEffect(() => {
    let cancelled = false;
    async function checkInitialClaim() {
      try {
        const status = await api.getClaimStatus(nodeId);
        if (cancelled) return;
        if (status) {
          setClaimStatus(status);
          setClaimKey(status.claim_key);
        } else {
          // If not claimed, start polling for updates
          startStatusPolling();
        }
        // If claimed, redirect is handled by existing logic
      } catch {
        // Ignore error, user can still initiate claim
      }
    }
    checkInitialClaim();
    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  // Function to initiate the claim
  const initiateNodeClaim = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.claimNode(nodeId);
      setClaimKey(response.claim_key);
      // Start polling for status updates
      startStatusPolling();
    } catch (err) {
      setError('Failed to initiate claim. Please try again.');
      console.error('Error claiming node:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check claim status
  const checkClaimStatus = async () => {
    try {
      const status = await api.getClaimStatus(nodeId);
      setClaimStatus(status);

      if (status && status.accepted_at) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setTimeout(() => {
          navigate(`/nodes/${nodeId}`);
        }, 3000);
      }
    } catch (err) {
      console.error('Error checking claim status:', err);
    }
  };

  // Start polling for status updates
  const startStatusPolling = () => {
    // Check immediately
    checkClaimStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkClaimStatus, 5000);
    setPollingInterval(interval);
  };

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // If the node is already claimed, redirect to node details
  if (node.owner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Already Claimed</AlertTitle>
          <AlertDescription>
            This node is already claimed by {node.owner.username}. You will be redirected to the node details page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(`/nodes/${nodeId}`)}>Go to Node Details</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Link to={`/nodes/${nodeId}`} replace={true} className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
        ← Back to Node Details
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Claim Node: {node.short_name}</h1>
        <p className="text-gray-600">{node.long_name}</p>
      </div>

      {claimStatus === undefined ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Claim This Node</CardTitle>
            <CardDescription>
              Claiming this node will associate it with your account, allowing you to manage it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Node ID: <span className="font-medium">{node.node_id}</span>
            </p>
            <p className="mb-4">
              Last Heard:{' '}
              <span className="font-medium">
                {node.last_heard ? formatDistanceToNow(node.last_heard, { addSuffix: true }) : 'Never'}
              </span>
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={initiateNodeClaim} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Claim...
                </>
              ) : (
                'Claim Node'
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {claimKey && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Claim Key Generated</CardTitle>
                <CardDescription>Use this key to complete the claim process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-100 rounded-md mb-4">
                  <p className="text-xl font-mono text-center">{claimKey}</p>
                </div>

                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Instructions</AlertTitle>
                  <AlertDescription>
                    <ol className="list-decimal list-inside space-y-2 mt-2">
                      <li>Send a direct message from your node to one of the managed nodes shown on the map below.</li>
                      <li>The message should contain only the claim key shown above.</li>
                      <li>Once the message is received, your node will be associated with your account.</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{claimStatus.accepted_at ? 'Claim Complete' : 'Claim In Progress'}</CardTitle>
              <CardDescription>
                {claimStatus.accepted_at
                  ? 'Your node has been successfully claimed. You will be redirected to the node details page.'
                  : 'Waiting for your message to be received by a managed node.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert
                className={claimStatus.accepted_at ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}
              >
                {claimStatus.accepted_at ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <AlertTitle>{claimStatus.accepted_at ? 'Claim Successful!' : 'Waiting for Claim Message'}</AlertTitle>
                <AlertDescription>
                  {claimStatus.accepted_at
                    ? 'Your node has been successfully claimed. You will be redirected to the node details page.'
                    : `Waiting for your message to be received by a managed node.`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Managed Nodes</CardTitle>
              <CardDescription>Send your claim message to one of these nodes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingManagedNodes ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : managedNodesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load managed nodes. Please refresh the page and try again.
                  </AlertDescription>
                </Alert>
              ) : managedNodes && managedNodes.length > 0 ? (
                <>
                  <div className="mb-4">
                    <div className="h-[400px] w-full">
                      <ConstellationsMap nodes={managedNodes} />
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Managed Nodes</AlertTitle>
                  <AlertDescription>
                    There are no managed nodes available to receive your claim message.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
