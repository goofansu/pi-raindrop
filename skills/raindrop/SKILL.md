---
name: raindrop
description: Blast radius of an `update_many`, and reporting a bookmark whose metadata parse is still in flight - the two Raindrop.io judgments the `raindrop` tool cannot enforce. Use before bulk-updating bookmarks, or after creating one.
---

# Raindrop

## Blast radius

`update_many` mutates every bookmark its scope matches, and the validator only checks that a scope exists, not that it is the one the user meant. Establish the blast radius first: run the same `collectionId` and `search` through `get_many` and read the count, unless the user gave explicit bookmark IDs.

## Metadata in flight

Creating a bookmark returns before its metadata does. The immediate response carries the URL as a placeholder title with an empty excerpt and cover; the real title, excerpt, and cover land within seconds.

Report a fresh bookmark as created with its metadata in flight, and name fields only once a read shows them. To put an existing bookmark's metadata back in flight, call `update_one` with `item.pleaseParse: {}`.
