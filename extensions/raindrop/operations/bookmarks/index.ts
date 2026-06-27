import type { RaindropOperation } from "../../core/types.ts";
import { createMany } from "./create-many.ts";
import { createOne } from "./create-one.ts";
import { getMany } from "./get-many.ts";
import { getOne } from "./get-one.ts";
import { updateMany } from "./update-many.ts";
import { updateOne } from "./update-one.ts";

export const bookmarkOperations: RaindropOperation[] = [
  getOne,
  getMany,
  createOne,
  createMany,
  updateOne,
  updateMany,
];
