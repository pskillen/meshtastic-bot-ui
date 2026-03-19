# Messages Page

The Messages page displays mesh text messages from the Meshflow network. Users can view messages by channel (within a constellation) or by node.

## Layout

### Compact Message Design

Each message uses a compact layout to fit more content on screen and reduce scrolling:

- **Header (single row)**: Avatar, sender name, relative time (e.g. "2h ago"), overflow menu
- **Body**: Message text, emoji reactions (inline badges), replies (indented with left border)

### Information Priority

| Priority  | Content                                      | Notes            |
| --------- | -------------------------------------------- | ---------------- |
| Essential | Sender, message text, timestamp              | Always visible   |
| Secondary | Emoji reactions, replies                     | Inline, compact  |
| Tertiary  | long_name, node_id_str, "heard" observations | In overflow menu |

### Node Links

- **Desktop**: Sender name is a link to the node's details page (`/nodes/{nodeId}`)
- **Mobile**: Sender name + small external-link icon (subtle, to avoid accidental taps when scrolling)

Node ID is derived from `node_id_str` (e.g. `!a1b2c3d4` → parsed as hex to numeric ID).

## Emoji Reactions

Emoji reactions are stored as separate messages with `is_emoji: true` and `reply_to_message_id` pointing to the parent message's `packet_id`. The UI groups them by parent and displays counts (e.g. "👍 3") with a tooltip listing who reacted.

**API requirement**: The messages API must return `packet_id` (mesh packet ID) for grouping to work. See meshflow-api `TextMessageSerializer`.

## Responsive Behavior

- **Desktop**: Horizontal layout, sender name as primary link, overflow menu for "heard" dialog
- **Mobile**: Same compact layout; small icon link next to sender for node details (reduces accidental navigation)

## Tabs

- **Channels**: Select constellation and channel; messages filtered by channel
- **By Node**: Search and select a node; messages filtered by `sender_node_id` (API param)

## Related

- API: `GET /api/messages/text/` with `channel_id`, `constellation_id`, `sender_node_id`
- WebSocket: Real-time message updates when connected
