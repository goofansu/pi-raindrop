import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createRaindropClient } from "./core/client.ts";
import { registerResourceTool } from "./core/resource-tool.ts";
import {
  RaindropBookmarkItemSchema,
  RaindropBookmarkUpdateItemSchema,
  RaindropUpdateBodySchema,
} from "./core/schemas.ts";
import { bookmarkOperations } from "./operations/bookmarks/index.ts";
import { collectionOperations } from "./operations/collections/index.ts";
import { tagOperations } from "./operations/tags/index.ts";

const BookmarkActionSchema = StringEnum(
  [
    "get_one",
    "get_many",
    "create_one",
    "create_many",
    "update_one",
    "update_many",
  ],
  { description: "Bookmark action to perform." },
);

const BookmarkParametersSchema = Type.Object({
  action: BookmarkActionSchema,
  id: Type.Optional(Type.Number()),
  item: Type.Optional(RaindropBookmarkUpdateItemSchema),
  items: Type.Optional(
    Type.Array(RaindropBookmarkItemSchema, { minItems: 1, maxItems: 100 }),
  ),
  collectionId: Type.Optional(Type.Number()),
  search: Type.Optional(Type.String()),
  sort: Type.Optional(Type.String()),
  page: Type.Optional(Type.Number()),
  perpage: Type.Optional(Type.Number({ maximum: 50 })),
  body: Type.Optional(RaindropUpdateBodySchema),
});

const TagParametersSchema = Type.Object({
  action: StringEnum(["get", "rename", "merge", "remove"], {
    description: "Tag action to perform.",
  }),
  collectionId: Type.Optional(Type.Number()),
  tags: Type.Optional(Type.Array(Type.String())),
  replace: Type.Optional(Type.String()),
});

const CollectionParametersSchema = Type.Object({
  action: StringEnum(["get"], { description: "Collection action to perform." }),
});

export default function raindropExtension(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    if (!process.env.RAINDROP_API_KEY) {
      ctx.ui.notify(
        "raindrop: RAINDROP_API_KEY is not set - raindrop resource tools will fail.",
        "warning",
      );
    }
  });

  const client = createRaindropClient();

  registerResourceTool(
    pi,
    {
      name: "raindrop_bookmarks",
      label: "Raindrop Bookmarks",
      description:
        "Manage Raindrop.io bookmarks: get, create, and update bookmarks.",
      promptSnippet:
        "Use raindrop_bookmarks to get, create, or update Raindrop.io bookmarks.",
      promptGuidelines: [
        "Use raindrop_bookmarks with action=get_many to search or list bookmarks; collectionId defaults to 0 for all non-trash raindrops.",
        "Use raindrop_bookmarks with action=get_one and id when the user asks for one known bookmark.",
        "Use raindrop_bookmarks with action=create_one and item.link for one new bookmark, or action=create_many with items for 1-100 bookmarks.",
        "Use raindrop_bookmarks with action=update_one for one id and item updates, or action=update_many with collectionId greater than 0 and body updates.",
        "Do not use raindrop_bookmarks for deleting, uploading, caching, or suggesting bookmarks.",
      ],
      parameters: BookmarkParametersSchema,
      operations: bookmarkOperations,
    },
    client,
  );

  registerResourceTool(
    pi,
    {
      name: "raindrop_tags",
      label: "Raindrop Tags",
      description:
        "Manage Raindrop.io tags: list, rename, merge, or remove tags.",
      promptSnippet:
        "Use raindrop_tags to list, rename, merge, or remove Raindrop.io tags.",
      promptGuidelines: [
        "Use raindrop_tags with action=get to list tags; collectionId is optional.",
        "Use raindrop_tags with action=rename when exactly one source tag should be renamed to replace.",
        "Use raindrop_tags with action=merge when one or more source tags should merge into replace.",
        "Use raindrop_tags with action=remove when tags should be removed from bookmarks.",
      ],
      parameters: TagParametersSchema,
      operations: tagOperations,
    },
    client,
  );

  registerResourceTool(
    pi,
    {
      name: "raindrop_collections",
      label: "Raindrop Collections",
      description: "List Raindrop.io collections.",
      promptSnippet:
        "Use raindrop_collections to list Raindrop.io collections.",
      promptGuidelines: [
        "Use raindrop_collections with action=get when the user needs available collection ids or names.",
      ],
      parameters: CollectionParametersSchema,
      operations: collectionOperations,
    },
    client,
  );
}
