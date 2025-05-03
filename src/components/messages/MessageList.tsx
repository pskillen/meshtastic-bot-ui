import { useEffect, useState, useMemo } from 'react';
import { TextMessage, TextMessageResponse } from '@/lib/models';
import { MeshtasticApi } from '@/lib/api/meshtastic';
import { useConfig } from '@/providers/ConfigProvider';
import { MessageItem } from './MessageItem';
import { Button } from '@/components/ui/button';

interface MessageListProps {
  channel?: number; // channelId
  constellationId?: number;
  nodeId?: number;
}

export function MessageList({ channel, constellationId, nodeId }: MessageListProps) {
  const config = useConfig();
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const api = useMemo(() => new MeshtasticApi(config.apis.meshBot), [config.apis.meshBot]);

  // Helper to extract next page number from nextUrl
  function getNextPageFromUrl(url: string | null): number | null {
    if (!url) return null;
    try {
      const u = new URL(url, window.location.origin);
      const page = u.searchParams.get('page');
      return page ? parseInt(page, 10) : null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setError(null);
    setNextUrl(null);
    setNextPage(null);

    const fetchMessages = async () => {
      try {
        let response: TextMessageResponse;
        if (channel !== undefined && constellationId !== undefined) {
          response = await api.getTextMessagesByChannelAndConstellation({
            channelId: channel,
            constellationId,
            page: 1,
            page_size: 25,
          });
        } else if (nodeId !== undefined) {
          response = await api.getMessagesByNode(nodeId, { limit: 25 });
        } else {
          setLoading(false);
          setError('Please select a channel and constellation or a node to view messages');
          return;
        }
        setMessages(response.results);
        setNextUrl(response.next);
        setNextPage(getNextPageFromUrl(response.next));
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [channel, constellationId, nodeId, api]);

  const loadMoreMessages = async () => {
    if (!nextUrl || !nextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      let response: TextMessageResponse;
      if (channel !== undefined && constellationId !== undefined) {
        response = await api.getTextMessagesByChannelAndConstellation({
          channelId: channel,
          constellationId,
          page: nextPage,
          page_size: 25,
        });
      } else if (nodeId !== undefined) {
        const url = new URL(nextUrl, window.location.origin);
        const params: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        response = await api.getMessagesByNode(nodeId, {
          limit: Math.min(parseInt(params.limit || '25'), 25),
          offset: parseInt(params.offset || '0'),
        });
      } else {
        return;
      }
      setMessages((prev) => [...prev, ...response.results]);
      setNextUrl(response.next);
      setNextPage(getNextPageFromUrl(response.next));
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load more messages. Please try again later.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Group messages by packet_id for threading and emoji reactions
  const mainMessages = useMemo(() => messages.filter((msg) => !msg.reply_to_message_id), [messages]);
  const repliesByPacketId = useMemo(() => {
    const map: Record<number, TextMessage[]> = {};
    for (const msg of messages) {
      if (msg.reply_to_message_id && !msg.is_emoji) {
        if (!map[msg.reply_to_message_id]) map[msg.reply_to_message_id] = [];
        map[msg.reply_to_message_id].push(msg);
      }
    }
    return map;
  }, [messages]);
  const emojiReactionsByPacketId = useMemo(() => {
    const map: Record<number, TextMessage[]> = {};
    for (const msg of messages) {
      if (msg.reply_to_message_id && msg.is_emoji) {
        if (!map[msg.reply_to_message_id]) map[msg.reply_to_message_id] = [];
        map[msg.reply_to_message_id].push(msg);
      }
    }
    return map;
  }, [messages]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading messages...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  if (mainMessages.length === 0) {
    return <div className="flex justify-center p-8">No messages found.</div>;
  }

  return (
    <div className="space-y-4">
      {mainMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          replies={repliesByPacketId[message.packet_id] || []}
          emojiReactions={emojiReactionsByPacketId[message.packet_id] || []}
        />
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
