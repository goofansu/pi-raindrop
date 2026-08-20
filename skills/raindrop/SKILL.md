---
name: raindrop
description: Workflow judgment for the pi-raindrop `raindrop` tool - scoping bulk updates and handling background metadata parsing. Use when working with Raindrop.io bookmarks or collections.
---

# Raindrop

The `raindrop` tool's own guidelines cover which action to use for a request.
This skill covers the judgment those guidelines cannot express.

## Scoping bulk updates

- Before `update_many`, inspect the target set with `get_many` unless the user already gave explicit bookmark IDs, a search query, or another clear scope.
- `update_many` needs an intentional scope, such as `body.ids` or a deliberate search filter. A collection alone is not a scope; avoid broad, ambiguous bulk updates.

## Metadata after creating

- Creating a bookmark starts a background metadata parse. The immediate response has the URL as a placeholder title and an empty excerpt and cover; the real title, excerpt, and cover fill in within seconds (checked against single creates).
- Do not promise that specific fields will appear, and do not claim a created bookmark has no metadata until the parse completes.
- To re-parse metadata of an existing bookmark, call `update_one` with `item.pleaseParse: {}`.
