# Raindrop API Tools Redesign

## Summary

Redesign the `pi-raindrop` package around resource-shaped tools backed by operation modules. The public tool surface will be small for agents, while the implementation keeps endpoint-specific behavior local and testable.

The redesign removes the existing single `raindrop` command-router tool. No backward compatibility is required.

## Goals

- Register tools according to Raindrop resources rather than one global command enum.
- Keep the agent-facing tool surface small and easy to choose from.
- Make endpoint behavior maintainable through operation modules.
- Make the codebase testable at clear seams.
- Add a Raindrop skill that guides agents in safe and effective tool use.
- Add collection discovery so agents can find collection IDs before create or update workflows.

## Non-goals

- Do not preserve the old `raindrop` tool.
- Do not add bookmark deletion/removal in this redesign.
- Do not add file upload, cover upload, cache, or suggest endpoints.
- Do not add explicit `pi` metadata to `package.json`; Pi discovers conventional `extensions/` and `skills/` directories by default.

## Public tool interface

Register exactly three public tools:

- `raindrop_bookmarks`
- `raindrop_tags`
- `raindrop_collections`

### `raindrop_bookmarks`

Handles single-bookmark and multi-bookmark operations.

Actions:

- `get_one`
- `get_many`
- `create_one`
- `create_many`
- `update_one`
- `update_many`

Representative inputs:

```json
{ "action": "get_one", "id": 123 }
```

```json
{
  "action": "get_many",
  "collectionId": 0,
  "search": "tag:docs",
  "nested": true,
  "sort": "-created",
  "page": 0,
  "perpage": 25
}
```

```json
{
  "action": "create_one",
  "item": { "link": "https://example.com", "tags": ["docs"] }
}
```

```json
{
  "action": "create_many",
  "items": [
    { "link": "https://a.example" },
    { "link": "https://b.example" }
  ]
}
```

```json
{
  "action": "update_one",
  "id": 123,
  "item": { "title": "New title", "tags": ["docs"] }
}
```

```json
{
  "action": "update_many",
  "collectionId": 456,
  "search": "tag:old",
  "nested": true,
  "body": { "tags": ["new"], "important": true }
}
```

Endpoint mapping:

- `get_one`: `GET /raindrop/{id}`
- `get_many`: `GET /raindrops/{collectionId}`
- `create_one`: `POST /raindrop`
- `create_many`: `POST /raindrops`
- `update_one`: `PUT /raindrop/{id}`
- `update_many`: `PUT /raindrops/{collectionId}`

### `raindrop_tags`

Handles tag listing and tag management.

Actions:

- `get`
- `rename`
- `merge`
- `remove`

Representative inputs:

```json
{ "action": "get", "collectionId": 0 }
```

```json
{ "action": "rename", "tags": ["old"], "replace": "new" }
```

```json
{ "action": "merge", "tags": ["old", "older"], "replace": "new" }
```

```json
{ "action": "remove", "tags": ["unused"] }
```

Endpoint mapping:

- `get`: `GET /tags/{collectionId}`
- `rename`: `PUT /tags/{collectionId}`
- `merge`: `PUT /tags/{collectionId}`
- `remove`: `DELETE /tags/{collectionId}`

### `raindrop_collections`

Handles collection discovery.

Actions:

- `get`

Representative input:

```json
{ "action": "get" }
```

Endpoint mapping:

- `get`: `GET /collections`

## Constraints and defaults

- `get_many` defaults to `collectionId: 0`.
- For multi-bookmark reads, collection IDs include Raindrop system collections: `0` all except Trash, `-1` Unsorted, and `-99` Trash.
- Tag operations default to `collectionId: 0`.
- `create_many` requires 1 to 100 items.
- `update_many` requires a non-zero `collectionId` because Raindrop batch update does not support collection `0`.
- `update_many` requires a body and should be constrained by explicit `ids` or an intentional `search` query.
- `get_one` and `update_one` require `id`.
- `create_one` requires `item.link`.
- `update_one` requires `item`.
- `tags.rename` requires exactly one source tag and `replace`.
- `tags.merge` requires at least one source tag and `replace`.
- `tags.remove` requires at least one tag.
- Pagination uses zero-based `page`; `perpage` must not exceed Raindrop's maximum of 50.

## Endpoint field reference

### Bookmark create and update fields

Single create and update operations accept Raindrop bookmark fields from the documented single-raindrop body:

- `link`: required for `create_one`, optional for `update_one`
- `title`
- `excerpt`
- `note`
- `type`
- `collection`: object such as `{ "$id": 123 }`
- `tags`: array of tag names
- `important`
- `cover`
- `media`
- `created`
- `lastUpdate`
- `order`: ascending sort order; `0` moves a raindrop to the first position
- `pleaseParse`: object; empty object asks Raindrop to parse or re-parse metadata in the background
- `highlights`
- `reminder`

The schema should model known scalar fields precisely and keep complex Raindrop-owned objects such as `media`, `highlights`, `reminder`, and `pleaseParse` permissive enough to avoid blocking valid API payloads.

### Multi-bookmark query fields

`get_many` supports these query parameters:

- `search`: Raindrop search string
- `sort`: `-created`, `created`, `score`, `-sort`, `title`, `-title`, `domain`, or `-domain`
- `page`: zero-based page number
- `perpage`: page size, maximum 50
- `nested`: include bookmarks from nested collections

`update_many` supports `search` and `nested` query parameters, plus a body with:

- `ids`: exact raindrop IDs to update
- `important`: mark or unmark favorite
- `tags`: append tags, or clear tags when `[]`
- `media`: append media, or clear media when `[]`
- `cover`: cover URL, including `<screenshot>` to set screenshots
- `collection`: object such as `{ "$id": 123 }` to move raindrops

### Tags fields

Tag mutation operations use the same endpoint with different validation rules:

- `rename`: `PUT /tags/{collectionId}` with exactly one source tag in `tags` and replacement name in `replace`
- `merge`: `PUT /tags/{collectionId}` with one or more source tags in `tags` and replacement name in `replace`
- `remove`: `DELETE /tags/{collectionId}` with one or more source tags in `tags`

Tag get responses contain `items` with `_id` and `count`.

### Collections fields

`collections.get` returns root collections from `GET /collections`. Formatting should prefer:

- `_id`
- `title`
- `count`
- `public`
- `view`
- `color`
- `created`
- `lastUpdate`

The raw response remains available in `details.data` for fields not shown in text output, such as access, collaborators, cover, sort, user, and expanded state.

### Explicitly out of scope

The Raindrop docs also define bookmark remove, multi-bookmark remove, file upload, cover upload, permanent cache, and suggest endpoints. Those endpoints stay out of v2 and should not appear as tool actions or skill-recommended workflows.

## Module design

Use deep modules with explicit seams. The public tools stay small for agents, while endpoint knowledge lives in operation modules.

Proposed structure:

```text
extensions/raindrop/
  index.ts
  core/
    client.ts
    config.ts
    errors.ts
    operation.ts
    render.ts
    resource-tool.ts
    schemas.ts
  operations/
    bookmarks/
      get-one.ts
      get-many.ts
      create-one.ts
      create-many.ts
      update-one.ts
      update-many.ts
      index.ts
    tags/
      get.ts
      rename.ts
      merge.ts
      remove.ts
      index.ts
    collections/
      get.ts
      index.ts
skills/
  raindrop/
    SKILL.md
```

### `RaindropClient` module

Interface:

```ts
client.request(request, signal): Promise<RaindropApiResponse>
```

The implementation hides:

- `RAINDROP_API_KEY` lookup
- bearer authentication
- base URL handling
- `fetch`
- JSON parsing
- API error formatting
- API key redaction

This is the HTTP seam. Tests can pass a fake fetch adapter rather than patching behavior throughout the codebase.

### `RaindropOperation` module

Interface:

```ts
{
  action: string;
  validate(input): ValidationResult;
  buildRequest(input): RaindropRequest;
  format(data): string;
  summarize(input): string;
}
```

Each operation module owns endpoint-specific knowledge. For example, `operations/bookmarks/update-one.ts` is the only place that knows `update_one` maps to `PUT /raindrop/{id}` and returns a single `item`.

### `registerResourceTool` module

Interface:

```ts
registerResourceTool(pi, {
  name,
  label,
  description,
  parameters,
  operations,
  guidelines,
})
```

The implementation hides:

- action dispatch
- validation failure result shape
- client invocation
- tool result details
- common rendering
- prompt snippet construction

This seam gives leverage: adding an endpoint should require one operation module plus exporting it from the relevant resource operation list.

## Data flow

Every tool call follows this path:

```text
agent calls resource tool
  -> resource-tool dispatches by action
  -> operation validates action-specific input
  -> operation builds RaindropRequest
  -> RaindropClient executes authenticated HTTP request
  -> operation formats response
  -> resource-tool returns AgentToolResult
  -> shared renderer displays compact or expanded text
```

Every successful tool result includes structured details:

```ts
{
  resource: "bookmarks" | "tags" | "collections";
  action: string;
  endpoint: string;
  status: number;
  count?: number;
  data?: unknown;
}
```

Failures return `isError: true` with a text explanation and details that do not expose secrets.

## Validation design

Validation has two layers.

First, each public resource tool has a TypeBox schema that includes its action enum and optional fields needed by that resource.

Second, each operation performs action-specific validation and returns clear errors. This keeps the public schema flexible for agents while preserving precise behavior and error messages.

## Formatting and rendering

Each operation formats its own success result because Raindrop response shapes differ:

- Single bookmark operations format one `item`.
- Multi-bookmark get and create operations format `items`.
- Multi-bookmark update formats `modified`.
- Tag get formats tag names and counts.
- Tag mutations return a simple mutation summary.
- Collections get formats collection title, id, count, visibility, and view.

Shared formatting helpers handle repeated bookmark and collection fields.

All three resource tools use a shared renderer that:

- displays success or error status
- shows the tool name and action summary
- collapses long list results unless expanded
- keeps raw response data in `details.data`

Representative call summaries:

```text
raindrop_bookmarks get_many collection 0
raindrop_bookmarks update_one 123
raindrop_tags rename old -> new
raindrop_collections get
```

## Raindrop skill

Add a package skill at:

```text
skills/raindrop/SKILL.md
```

The skill guides agents to use the three tools safely and effectively.

It should teach agents to:

- Use `raindrop_collections` with `action: "get"` when collection IDs are needed.
- Use `raindrop_bookmarks` with `action: "get_many"` before `update_many` unless the user gives an explicit query or scope.
- Use `update_one` when the user gives a bookmark ID.
- Use `update_many` only with a non-zero collection ID and an intentional scope.
- Use `create_one` for one bookmark and `create_many` for 2 to 100 bookmarks.
- Use `raindrop_tags` only for tag management, not for tagging bookmarks.
- Tag bookmarks through bookmark create or update operations.
- Avoid deletion requests because v2 does not expose bookmark deletion.

## Tests

Move tests from one monolithic test file toward the seams.

Core tests:

```text
extensions/raindrop/core/client.test.ts
extensions/raindrop/core/resource-tool.test.ts
```

Operation tests:

```text
extensions/raindrop/operations/bookmarks/*.test.ts
extensions/raindrop/operations/tags/*.test.ts
extensions/raindrop/operations/collections/*.test.ts
```

Registration tests:

```text
extensions/raindrop/index.test.ts
```

Test responsibilities:

- Operation tests prove validation, request building, and formatting for each endpoint.
- Client tests prove auth, base URL handling, JSON parsing, API errors, and redaction.
- Resource tool tests prove action dispatch, validation error shape, result details, and shared rendering.
- Registration tests prove exactly three public tools are registered with the expected names, descriptions, schemas, and prompt guidance.
- Skill tests or simple filesystem assertions prove `skills/raindrop/SKILL.md` exists.

## Migration

- Delete the old `raindrop` public tool.
- Register only `raindrop_bookmarks`, `raindrop_tags`, and `raindrop_collections`.
- Refactor implementation into core and operation modules.
- Replace old tests with seam-focused tests.
- Update `README.md` to document the new tools and included skill.
- Rely on Pi's conventional package discovery for `extensions/` and `skills/`.
