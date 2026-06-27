# pi-raindrop

List, create, update, and manage Raindrop.io bookmarks, tags, and collections from Pi.

## Install

```bash
pi install https://github.com/goofansu/pi-raindrop
```

Pi discovers this package's `extensions/` and `skills/` directories by convention. No `pi` metadata is required in `package.json`.

## Configuration

Set `RAINDROP_API_KEY` to a Raindrop.io API key or test token used as a Bearer token.

```bash
export RAINDROP_API_KEY="your-raindrop-token"
```

## Tools

This package registers three resource tools:

- `raindrop_bookmarks` for bookmark get, create, and update actions.
- `raindrop_tags` for tag listing, renaming, merging, and removal.
- `raindrop_collections` for discovering root collection IDs.

It also provides the `raindrop` skill in `skills/raindrop/SKILL.md` so agents get workflow guidance when working with Raindrop.io bookmarks or tags.

## `raindrop_bookmarks`

Actions:

- `get_one`: fetch one bookmark by `id`.
- `get_many`: list or search bookmarks by `collectionId`, `search`, `sort`, `page`, and `perpage`.
- `create_one`: create one bookmark with `item`.
- `create_many`: create 1 to 100 bookmarks with `items`; prefer `create_one` for one bookmark.
- `update_one`: update one bookmark by `id` with partial `item` fields.
- `update_many`: update bookmarks in a non-zero `collectionId` with an intentional `search` or `ids` scope in `body`.

Examples:

```json
{ "action": "get_many", "collectionId": 0, "search": "typescript", "perpage": 10 }
```

```json
{ "action": "create_one", "item": { "link": "https://example.com", "title": "Example", "tags": ["inbox"] } }
```

## `raindrop_tags`

Actions:

- `get`: list tags, optionally within `collectionId`.
- `rename`: rename exactly one source tag from `tags` to `replace`.
- `merge`: merge one or more source tags from `tags` into `replace`.
- `remove`: remove `tags` from bookmarks.

Examples:

```json
{ "action": "get", "collectionId": 0 }
```

```json
{ "action": "merge", "tags": ["read-later", "to-read"], "replace": "reading" }
```

## `raindrop_collections`

Actions:

- `get`: list root collections and their IDs.

Examples:

```json
{ "action": "get" }
```

```text
Use raindrop_collections with { "action": "get" } before moving or bulk-updating bookmarks when you need the destination collection ID.
```
