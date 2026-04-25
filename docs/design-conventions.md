# Design Conventions

This document captures UI design conventions for Meshtastic Bot UI. It is intentionally small for now and will grow as we settle more patterns.

## Node Labels

When displaying nodes, prefer human-readable names as the primary label:

- Use the short name, long name, or both where available.
- Treat the Meshtastic string ID (`node_id_str`, for example `!12345678`) as supporting detail, not the main label.
- Use the string ID as the fallback only when no short or long name is available.

## Detail Views

Use popup modals for focused detail views. Avoid slide-out drawers unless a future site-wide pattern deliberately introduces them.

For example, traceroute detail uses a centered modal; similar inspection flows should follow that pattern for consistency.
