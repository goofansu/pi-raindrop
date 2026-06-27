import type { RaindropOperation } from "../../core/types.ts";
import { get } from "./get.ts";
import { merge } from "./merge.ts";
import { remove } from "./remove.ts";
import { rename } from "./rename.ts";

export const tagOperations: RaindropOperation[] = [get, rename, merge, remove];
