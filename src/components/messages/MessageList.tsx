import { useMemo } from 'react';
import { useMessagesSuspense } from '@/hooks/api/useMessages';
import { MessageItem } from './MessageItem';
import { Button } from '@/components/ui/button';

interface MessageListProps {
  channel?: number; // channelId
  constellationId?: number;
  nodeId?: number;
}

export function MessageList({ channel, constellationId, nodeId }: MessageListProps) {
  // Use the Suspense-enabled hook for fetching messages
  const { messages, fetchNextPage, hasNextPage } = useMessagesSuspense(
    channel !== undefined && constellationId !== undefined
      ? { channelId: channel, constellationId }
      : nodeId !== undefined
        ? { channelId: undefined, constellationId: undefined, pageSize: 25, enabled: false }
        : undefined
  );

  // Group messages by packet_id for threading and emoji reactions
  const mainMessages = useMemo(() => messages.filter((msg) => !msg.reply_to_message_id), [messages]);
  const repliesByPacketId = useMemo(() => {
    const map: Record<number, typeof messages> = {};
    for (const msg of messages) {
      if (msg.reply_to_message_id && !msg.is_emoji) {
        if (!map[msg.reply_to_message_id]) map[msg.reply_to_message_id] = [];
        map[msg.reply_to_message_id].push(msg);
      }
    }
    return map;
  }, [messages]);
  const emojiReactionsByPacketId = useMemo(() => {
    const map: Record<number, typeof messages> = {};
    for (const msg of messages) {
      if (msg.reply_to_message_id && msg.is_emoji) {
        if (!map[msg.reply_to_message_id]) map[msg.reply_to_message_id] = [];
        map[msg.reply_to_message_id].push(msg);
      }
    }
    return map;
  }, [messages]);

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

      {hasNextPage && (
        <div className="flex justify-center pb-4 pt-2">
          <Button variant="outline" onClick={() => fetchNextPage()}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
