---
name: raindrop
description: Guidance for using pi-raindrop tools to find, create, update, and organize Raindrop.io bookmarks, tags, and collections. Use when working with Raindrop.io bookmarks or tags.
---

# Raindrop

Use these tools for Raindrop.io work:

- `raindrop_bookmarks` for bookmark get/create/update actions.
- `raindrop_tags` for tag listing, renaming, merging, and removal.
- `raindrop_collections` for discovering root collection IDs.

## Workflow guidance

- Use `raindrop_collections` with `{ "action": "get" }` when collection IDs are needed.
- Use `raindrop_bookmarks` with `{ "action": "get_many" }` before `update_many` unless the user gives an explicit query, IDs, or scope.
- Use `raindrop_bookmarks` with `{ "action": "update_one" }` when the user gives a bookmark ID.
- Use `raindrop_bookmarks` with `{ "action": "update_many" }` only with a non-zero `collectionId` and an intentional `search` or `ids` scope.
- Use `create_one` for one bookmark; `create_many` accepts 1 to 100 bookmarks but is best for batches.
- Use `raindrop_tags` only for tag management. Add or remove tags on bookmarks through bookmark create or update actions.
- Do not attempt bookmark deletion; this package version does not expose bookmark remove actions.
