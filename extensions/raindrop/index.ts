import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createRaindropClient } from "./core/client.ts";
import { registerResourceTool } from "./core/resource-tool.ts";
import {
  RaindropBookmarkUpdateItemSchema,
  RaindropLinkSchema,
  RaindropUpdateBodySchema,
} from "./core/schemas.ts";
import { bookmarkOperations } from "./operations/bookmarks/index.ts";
import { collectionOperations } from "./operations/collections/index.ts";

const RaindropActionSchema = StringEnum(
  [
    "get_one",
    "get_many",
    "create_one",
    "create_many",
    "update_one",
    "update_many",
    "get_collections",
  ],
  { description: "Raindrop action to perform." },
);

const RaindropParametersSchema = Type.Object({
  action: RaindropActionSchema,
  id: Type.Optional(Type.Number()),
  item: Type.Optional(RaindropBookmarkUpdateItemSchema),
  link: Type.Optional(RaindropLinkSchema),
  links: Type.Optional(
    Type.Array(RaindropLinkSchema, { minItems: 1, maxItems: 100 }),
  ),
  collectionId: Type.Optional(Type.Number()),
  search: Type.Optional(Type.String()),
  sort: Type.Optional(Type.String()),
  page: Type.Optional(Type.Number()),
  perpage: Type.Optional(Type.Number({ maximum: 50 })),
  body: Type.Optional(RaindropUpdateBodySchema),
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
      name: "raindrop",
      resource: "raindrop",
      label: "Raindrop",
      description:
        "Manage Raindrop.io: get, create, and update bookmarks, and list collections.",
      promptSnippet:
        "Use raindrop to get, create, or update Raindrop.io bookmarks and to list collections.",
      promptGuidelines: [
        "Use raindrop with action=get_many to search or list bookmarks; collectionId defaults to 0 for all non-trash raindrops.",
        "Use raindrop with action=get_one and id when the user asks for one known bookmark.",
        "Use raindrop with action=create_one and link for one new bookmark, or action=create_many with links for 1-100 bookmarks; creating a bookmark takes only the URL, and Raindrop fetches the page metadata itself.",
        "Bookmarks created this way land in Unsorted (collection -1); use action=update_one afterwards to set a title, tags, or a collection.",
        "Use raindrop with action=update_one for one id and item updates, or action=update_many with collectionId greater than 0 and body updates.",
        "Use raindrop with action=get_collections when you need collection ids or names before collection-scoped work.",
        "Do not use raindrop for deleting, uploading, caching, or suggesting bookmarks, or for renaming, merging, or removing tags account-wide.",
      ],
      parameters: RaindropParametersSchema,
      operations: [...bookmarkOperations, ...collectionOperations],
    },
    client,
  );
}
