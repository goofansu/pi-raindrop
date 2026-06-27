
## 2026-06-27 final review fixes

- Fixed `raindrop_tags` `get` to honor `collectionId` via `/tags/{collectionId}`, defaulting to `/tags/0`.
- Added `update_many` safety validation requiring non-zero `collectionId`, a body, and either non-empty `body.ids` or non-empty `search`.
- Changed structured result `resource` values to `bookmarks`, `tags`, or `collections` while keeping public tool names unchanged.
- Aligned README and raindrop skill guidance with `create_many` accepting 1–100 items while recommending `create_one` for one bookmark.
- Verification: focused tests passed; `npm test && npm run typecheck && npm run lint:check` passed.
