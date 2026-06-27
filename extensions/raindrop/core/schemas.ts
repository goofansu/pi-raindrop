import { Type } from "typebox";

export const RaindropCollectionRefSchema = Type.Object({
  $id: Type.Number(),
});

const RaindropBookmarkItemFields = {
  title: Type.Optional(Type.String()),
  excerpt: Type.Optional(Type.String()),
  note: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
  important: Type.Optional(Type.Boolean()),
  collection: Type.Optional(RaindropCollectionRefSchema),
  type: Type.Optional(Type.String()),
  created: Type.Optional(Type.String()),
  pleaseParse: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
};

export const RaindropBookmarkItemSchema = Type.Object({
  link: Type.String(),
  ...RaindropBookmarkItemFields,
});

export const RaindropBookmarkUpdateItemSchema = Type.Object({
  link: Type.Optional(Type.String()),
  ...RaindropBookmarkItemFields,
});

export const RaindropUpdateBodySchema = Type.Object({
  ids: Type.Optional(Type.Array(Type.Number())),
  important: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String())),
  replace: Type.Optional(Type.String()),
  collection: Type.Optional(RaindropCollectionRefSchema),
});

export const RaindropRequestSchema = Type.Object({
  method: Type.Union([
    Type.Literal("GET"),
    Type.Literal("POST"),
    Type.Literal("PUT"),
    Type.Literal("DELETE"),
  ]),
  path: Type.String(),
  query: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean()]),
    ),
  ),
  body: Type.Optional(Type.Unknown()),
});

export const ListRaindropsSchema = Type.Object({
  collectionId: Type.Optional(Type.Number()),
  search: Type.Optional(Type.String()),
  sort: Type.Optional(Type.String()),
  page: Type.Optional(Type.Number()),
  perpage: Type.Optional(Type.Number({ maximum: 50 })),
});

export const CreateManyRaindropsSchema = Type.Object({
  items: Type.Array(RaindropBookmarkItemSchema, { minItems: 1, maxItems: 100 }),
});

export const UpdateManyRaindropsSchema = Type.Object({
  collectionId: Type.Number({ exclusiveMinimum: 0 }),
  body: RaindropUpdateBodySchema,
});
