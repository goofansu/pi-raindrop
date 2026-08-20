# pi-raindrop

List, create, update, and manage Raindrop.io bookmarks, tags, and collections from pi.

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

### Local development

`make dev` runs the extension through [secretspec](https://secretspec.dev), which reads
`RAINDROP_API_KEY` from the declaration in `secretspec.toml`. Install the `secretspec` CLI
first, or run the `pi` command from that target directly with `RAINDROP_API_KEY` exported.

## Tools

This package registers a single resource tool, `raindrop`, covering bookmark get, create, and update actions plus collection listing.

It also provides the `raindrop` skill in `skills/raindrop/SKILL.md` so agents get workflow guidance when working with Raindrop.io bookmarks.

## `raindrop`

Actions:

- `get_one`: fetch one bookmark by `id`.
- `get_many`: list or search bookmarks by `collectionId`, `search`, `sort`, `page`, and `perpage`.
- `create_one`: create one bookmark from `link`. Creating takes only the URL; Raindrop fetches the page metadata itself.
- `create_many`: create 1 to 100 bookmarks from `links`; prefer `create_one` for one bookmark.
- `update_one`: update one bookmark by `id` with partial `item` fields.
- `update_many`: update bookmarks in a non-zero `collectionId` with an intentional `search` or `ids` scope in `body`.
- `get_collections`: list root collections and their IDs.

Examples:

```json
{ "action": "get_many", "collectionId": 0, "search": "typescript", "perpage": 10 }
```

```json
{ "action": "create_one", "link": "https://example.com" }
```

```json
{ "action": "create_many", "links": ["https://example.com/a", "https://example.com/b"] }
```

```json
{ "action": "get_collections" }
```

Because creating takes only a URL, new bookmarks land in Unsorted (collection `-1`). To give one a title, tags, or a collection, create it and then apply those fields with `update_one`. Call `get_collections` first when you need a destination collection ID.

Account-wide tag administration (renaming, merging, or removing a tag everywhere) is not exposed. Tags on specific bookmarks are set through `update_one` and `update_many`.
