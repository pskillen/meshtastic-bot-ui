import { useAuth } from '@/providers/AuthProvider';

export function OAuthCallback() {
  const { isLoading, error } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4 text-center">
        {error ? (
          <div className="text-red-500">
            <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
            <p>{error}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-2">Authenticating...</h2>
            <p className="text-muted-foreground">
              {isLoading ? 'Please wait while we complete the authentication process.' : 'Redirecting...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
