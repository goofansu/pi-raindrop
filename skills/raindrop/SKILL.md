---
name: raindrop
description: Guidance for using pi-raindrop tools to find, create, update, and organize Raindrop.io bookmarks, tags, and collections. Use when working with Raindrop.io bookmarks or tags.
---

# Raindrop

Use this skill when working with Raindrop.io bookmarks, tags, or collections.

## Tool selection

- Use `raindrop_bookmarks` to get, search, create, or update bookmarks.
- Use `raindrop_tags` to list, rename, merge, or remove tag names across bookmarks.
- Use `raindrop_collections` to discover collection IDs before collection-scoped work.

## Safe workflow rules

- Prefer the narrowest action that matches the request: `get_one` or `update_one` when the user gives a bookmark ID; `create_one` for a single bookmark.
- Use `create_many` only for batches of 1 to 100 bookmarks.
- Before `update_many`, first inspect the target set with `raindrop_bookmarks` `get_many` unless the user already provided explicit bookmark IDs, a search query, or another clear scope.
- Use `update_many` only with a non-zero `collectionId` and an intentional scope, such as `body.ids` or a deliberate search/filter. Avoid broad, ambiguous bulk updates.
- When a collection ID is needed, call `raindrop_collections` with `{ "action": "get" }` rather than guessing.
- Use `raindrop_tags` only for tag administration operations. To add or remove tags on specific bookmarks, use `raindrop_bookmarks` create/update actions instead.
- Do not attempt bookmark deletion; this package version does not expose bookmark remove actions.
