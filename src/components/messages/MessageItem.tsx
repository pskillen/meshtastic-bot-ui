import { TextMessage } from '@/lib/models';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { memo, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MessageItemProps {
  message: TextMessage;
  replies?: TextMessage[];
  emojiReactions?: TextMessage[];
}

// Memoize the entire component to prevent unnecessary re-renders
export const MessageItem = memo(function MessageItem({ message, replies = [], emojiReactions = [] }: MessageItemProps) {
  const formattedTime = useMemo(() => {
    return message.sent_at ? format(new Date(message.sent_at), 'MMM d, yyyy h:mm a') : 'Unknown time';
  }, [message.sent_at]);

  // Group emoji reactions by message_text (the emoji character)
  const emojiCounts = useMemo(() => {
    const map: Record<string, { count: number; senders: string[] }> = {};
    for (const emoji of emojiReactions) {
      const key = emoji.message_text;
      if (!map[key]) map[key] = { count: 0, senders: [] };
      map[key].count++;
      map[key].senders.push(emoji.sender.short_name || emoji.sender.node_id_str);
    }
    return map;
  }, [emojiReactions]);

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-8 w-8">
          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
            {message.sender.short_name ? message.sender.short_name.charAt(0) : message.sender.node_id_str.charAt(0)}
          </div>
        </Avatar>
        <div className="flex flex-col">
          <div className="font-semibold">{message.sender.short_name || message.sender.node_id_str}</div>
          {message.sender.long_name && <div className="text-xs text-muted-foreground">{message.sender.long_name}</div>}
          <div className="text-xs text-muted-foreground" title={message.sender.node_id_str}>
            {message.sender.node_id_str}
          </div>
          <div className="text-xs text-muted-foreground">{formattedTime}</div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              {message.heard?.length || 0} heard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message Heard By</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {message.heard?.length ? (
                message.heard.map((observation) => (
                  <div key={observation.observer.node_id} className="flex items-start space-x-4 p-2 border rounded-md">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {observation.observer.short_name || observation.observer.node_id_str}
                      </div>
                      {observation.observer.long_name && (
                        <div className="text-sm text-muted-foreground">{observation.observer.long_name}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(observation.rx_time), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <div className="text-right">
                      {observation.direct_from_sender ? (
                        <div>
                          <Badge variant="secondary">Direct</Badge>
                          {observation.rx_rssi && (
                            <div className="text-xs mt-1">RSSI: {observation.rx_rssi.toFixed(1)}</div>
                          )}
                          {observation.rx_snr && <div className="text-xs">SNR: {observation.rx_snr.toFixed(1)}</div>}
                        </div>
                      ) : (
                        <Badge variant="outline">Hop: {observation.hop_count}</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">No observation data available</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{message.message_text}</p>
        {/* Emoji reactions row */}
        {Object.keys(emojiCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(emojiCounts).map(([emoji, { count, senders }]) => (
              <Badge key={emoji} variant="secondary" className="text-sm" title={senders.join(', ')}>
                {emoji} {count > 1 ? count : ''}
              </Badge>
            ))}
          </div>
        )}
        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-4 ml-6 border-l-2 border-muted pl-4 space-y-2">
            {replies.map((reply) => (
              <div key={reply.id} className="text-sm">
                <span className="font-semibold">{reply.sender.short_name || reply.sender.node_id_str}:</span>{' '}
                {reply.message_text}
                <span className="ml-2 text-xs text-muted-foreground">
                  {reply.sent_at ? format(new Date(reply.sent_at), 'MMM d, h:mm a') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
        {message.is_emoji && <span className="ml-2">(emoji)</span>}
      </CardContent>
    </Card>
  );
});
