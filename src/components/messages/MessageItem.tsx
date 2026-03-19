import { TextMessage } from '@/lib/models';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ExternalLink } from 'lucide-react';

interface MessageItemProps {
  message: TextMessage;
  replies?: TextMessage[];
  emojiReactions?: TextMessage[];
}

/** Parse node_id_str (!hex) to numeric node_id for routing */
function parseNodeId(nodeIdStr: string): number | null {
  const match = nodeIdStr?.replace(/^!/, '').match(/^[0-9a-fA-F]+$/);
  return match ? parseInt(match[0], 16) : null;
}

// Memoize the entire component to prevent unnecessary re-renders
export const MessageItem = memo(function MessageItem({ message, replies = [], emojiReactions = [] }: MessageItemProps) {
  const nodeId = useMemo(() => parseNodeId(message.sender.node_id_str), [message.sender.node_id_str]);
  const relativeTime = useMemo(() => {
    return message.sent_at ? formatDistanceToNow(new Date(message.sent_at), { addSuffix: true }) : '';
  }, [message.sent_at]);
  const fullTime = useMemo(() => {
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

  const senderName = message.sender.short_name || message.sender.node_id_str;

  return (
    <article className="mb-3 rounded-lg border bg-card p-3">
      {/* Compact single-row header */}
      <header className="flex flex-row items-center gap-2 pb-1.5">
        <Avatar className="h-6 w-6 shrink-0">
          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-xs">
            {senderName.charAt(0)}
          </div>
        </Avatar>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {/* Desktop: sender name as link. Mobile: sender name + subtle icon link */}
          {nodeId != null ? (
            <>
              <Link
                to={`/nodes/${nodeId}`}
                className="font-medium text-foreground hover:underline truncate md:max-w-[200px]"
              >
                {senderName}
              </Link>
              <Link
                to={`/nodes/${nodeId}`}
                className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground md:sr-only"
                aria-label={`View node ${senderName} details`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <span className="font-medium truncate">{senderName}</span>
          )}
        </div>
        <time className="shrink-0 text-xs text-muted-foreground" title={fullTime}>
          {relativeTime}
        </time>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Message options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  {message.heard?.length || 0} heard
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Message Heard By</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {message.heard?.length ? (
                    message.heard.map((observation) => (
                      <div
                        key={observation.observer.node_id}
                        className="flex items-start space-x-4 p-2 border rounded-md"
                      >
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
                              {observation.rx_snr && (
                                <div className="text-xs">SNR: {observation.rx_snr.toFixed(1)}</div>
                              )}
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
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="pl-8">
        <p className="whitespace-pre-wrap text-sm">{message.message_text}</p>
        {/* Emoji reactions row */}
        {Object.keys(emojiCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {Object.entries(emojiCounts).map(([emoji, { count, senders }]) => (
              <Badge key={emoji} variant="secondary" className="text-xs font-normal" title={senders.join(', ')}>
                {emoji} {count > 1 ? count : ''}
              </Badge>
            ))}
          </div>
        )}
        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-2 ml-3 border-l-2 border-muted pl-3 space-y-1">
            {replies.map((reply) => (
              <div key={reply.id} className="text-sm">
                <span className="font-medium">{reply.sender.short_name || reply.sender.node_id_str}:</span>{' '}
                {reply.message_text}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {reply.sent_at ? format(new Date(reply.sent_at), 'MMM d, h:mm a') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
        {message.is_emoji && <span className="ml-1 text-xs text-muted-foreground">(emoji)</span>}
      </div>
    </article>
  );
});
