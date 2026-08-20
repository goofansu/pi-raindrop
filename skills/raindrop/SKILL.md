---
name: raindrop
description: Guidance for using the pi-raindrop tool to find, create, update, and organize Raindrop.io bookmarks and collections. Use when working with Raindrop.io bookmarks.
---

# Raindrop

Use this skill when working with Raindrop.io bookmarks or collections.

## Tool selection

- Use `raindrop` for everything: getting, searching, creating, and updating bookmarks, and listing collections with `get_collections`.
- Account-wide tag administration (renaming, merging, or removing a tag everywhere) is not available; this package no longer exposes it.

## Safe workflow rules

- Prefer the narrowest action that matches the request: `get_one` or `update_one` when the user gives a bookmark ID; `create_one` for a single bookmark.
- Use `create_many` only for batches of 1 to 100 bookmarks.
- Before `update_many`, first inspect the target set with `get_many` unless the user already provided explicit bookmark IDs, a search query, or another clear scope.
- Use `update_many` only with a non-zero `collectionId` and an intentional scope, such as `body.ids` or a deliberate search/filter. Avoid broad, ambiguous bulk updates.
- When a collection ID is needed, call `raindrop` with `{ "action": "get_collections" }` rather than guessing.
- To add or remove tags on specific bookmarks, use `update_one` or `update_many`.
- Do not attempt bookmark deletion; this package version does not expose bookmark remove actions.

## Creating bookmarks and metadata

- `create_one` takes a single `link` and `create_many` takes an array of `links`. Creating a bookmark accepts nothing else: no title, excerpt, tags, or collection.
- Both actions always send `pleaseParse: {}`, so Raindrop fetches the page metadata in the background. The immediate response has the URL as a placeholder title and an empty excerpt and cover; the real title, excerpt, and cover fill in within seconds (checked against single creates).
- Do not promise that specific fields will appear, and do not claim a created bookmark has no metadata until the parse completes.
- New bookmarks land in Unsorted (collection `-1`), since creating does not take a collection. To set a title, tags, or a collection, create the bookmark first and then call `update_one` with those fields.
- To re-parse metadata of an existing bookmark, call `update_one` with `item.pleaseParse: {}`.
