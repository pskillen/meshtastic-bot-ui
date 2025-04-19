import { Message, MessageReply } from '@/lib/models';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';

// Memoized component for rendering a single reply
const ReplyItem = memo(({ reply }: { reply: MessageReply }) => {
  const formattedTime = useMemo(() => {
    return reply.rx_time ? format(new Date(reply.rx_time), 'MMM d, h:mm a') : '';
  }, [reply.rx_time]);

  return (
    <div className="ml-6 mt-2 flex flex-col rounded-md bg-muted p-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{reply.from_node.short_name}</span>
        <span className="text-xs text-muted-foreground">{formattedTime}</span>
      </div>
      <p>{reply.message_text}</p>
    </div>
  );
});

interface MessageItemProps {
  message: Message;
}

// Memoize the entire component to prevent unnecessary re-renders
export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
  // Memoize expensive operations
  const formattedTime = useMemo(() => {
    return message.rx_time ? format(new Date(message.rx_time), 'MMM d, yyyy h:mm a') : 'Unknown time';
  }, [message.rx_time]);

  // Memoize filtered replies (excluding emoji reactions)
  const textReplies = useMemo(() => {
    return message.replies.filter((reply) => !reply.emoji);
  }, [message.replies]);

  // Memoize emoji reaction check
  const hasEmojis = useMemo(() => {
    return message.emojis && message.emojis.length > 0;
  }, [message.emojis]);

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-8 w-8">
          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
            {message.from_node.short_name.charAt(0)}
          </div>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold">{message.from_node.short_name}</div>
          <div className="text-xs text-muted-foreground">{formattedTime}</div>
        </div>
        <Badge variant="outline" className="ml-auto">
          Channel {message.channel}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{message.message_text}</p>
      </CardContent>
      {(hasEmojis || textReplies.length > 0) && (
        <CardFooter className="flex flex-col items-start gap-2 pt-0">
          {/* Emoji reactions */}
          {hasEmojis && (
            <div className="flex flex-wrap gap-2">
              {message.emojis.map((emojiObj) => (
                <Badge key={emojiObj.emoji} variant="secondary" className="text-sm">
                  {emojiObj.emoji} {emojiObj.count}
                </Badge>
              ))}
            </div>
          )}

          {/* Replies (excluding emoji reactions) */}
          {textReplies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </CardFooter>
      )}
    </Card>
  );
});
