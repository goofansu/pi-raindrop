import type { RaindropOperation } from "../../core/types.ts";
import { createMany } from "./create-many.ts";
import { createOne } from "./create-one.ts";
import { getMany } from "./get-many.ts";
import { getOne } from "./get-one.ts";
import { updateMany } from "./update-many.ts";
import { updateOne } from "./update-one.ts";

export { createMany } from "./create-many.ts";
export { createOne } from "./create-one.ts";
export { getMany } from "./get-many.ts";
export { getOne } from "./get-one.ts";
export { updateMany } from "./update-many.ts";
export { updateOne } from "./update-one.ts";

export const bookmarkOperations: RaindropOperation[] = [
  getOne,
  getMany,
  createOne,
  createMany,
  updateOne,
  updateMany,
];
