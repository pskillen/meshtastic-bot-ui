import { useEffect, useState, useMemo } from 'react';
import { Message, MessageResponse } from '@/lib/models';
import { MeshtasticApi } from '@/lib/api/meshtastic';
import { useConfig } from '@/providers/ConfigProvider';
import { MessageItem } from './MessageItem';
import { Button } from '@/components/ui/button';

interface MessageListProps {
  channel?: number;
  nodeId?: number;
}

export function MessageList({ channel, nodeId }: MessageListProps) {
  const config = useConfig();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create API instance - memoized to prevent recreation on every render
  const api = useMemo(() => new MeshtasticApi(config.apis.meshBot), [config.apis.meshBot]);

  useEffect(() => {
    // Reset state when channel or nodeId changes
    setMessages([]);
    setLoading(true);
    setError(null);
    setNextUrl(null);

    const fetchMessages = async () => {
      try {
        let response: MessageResponse;

        if (channel !== undefined) {
          response = await api.getMessagesByChannel(channel, { limit: 25 });
        } else if (nodeId !== undefined) {
          response = await api.getMessagesByNode(nodeId, { limit: 25 });
        } else {
          // If neither channel nor nodeId is provided, don't fetch anything
          setLoading(false);
          setError('Please select a channel or node to view messages');
          return;
        }

        setMessages(response.results);
        setNextUrl(response.next);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [channel, nodeId, api]);

  const loadMoreMessages = async () => {
    if (!nextUrl || loadingMore) return;

    setLoadingMore(true);
    try {
      // Extract the query parameters from the nextUrl
      const url = new URL(nextUrl);
      const params: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      let response: MessageResponse;
      if (channel !== undefined) {
        response = await api.getMessagesByChannel(channel, {
          limit: Math.min(parseInt(params.limit || '25'), 25),
          offset: parseInt(params.offset || '0'),
        });
      } else if (nodeId !== undefined) {
        response = await api.getMessagesByNode(nodeId, {
          limit: Math.min(parseInt(params.limit || '25'), 25),
          offset: parseInt(params.offset || '0'),
        });
      } else {
        return;
      }

      setMessages((prev) => [...prev, ...response.results]);
      setNextUrl(response.next);
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load more messages. Please try again later.');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading messages...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  if (messages.length === 0) {
    return <div className="flex justify-center p-8">No messages found.</div>;
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {nextUrl && (
        <div className="flex justify-center pb-4 pt-2">
          <Button variant="outline" onClick={loadMoreMessages} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
