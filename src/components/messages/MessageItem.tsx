import { TextMessage } from '@/lib/models';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';

interface MessageItemProps {
  message: TextMessage;
}

// Memoize the entire component to prevent unnecessary re-renders
export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
  const formattedTime = useMemo(() => {
    return message.sent_at ? format(new Date(message.sent_at), 'MMM d, yyyy h:mm a') : 'Unknown time';
  }, [message.sent_at]);

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-8 w-8">
          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
            {String(message.sender).charAt(0)}
          </div>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold">Sender {message.sender}</div>
          <div className="text-xs text-muted-foreground">{formattedTime}</div>
        </div>
        <Badge variant="outline" className="ml-auto">
          Channel {message.channel}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{message.message_text}</p>
        {message.is_emoji && <span className="ml-2">(emoji)</span>}
      </CardContent>
    </Card>
  );
});
