import type { RaindropOperation } from "../../core/types.ts";
import { getCollections } from "./get.ts";

export const collectionOperations: RaindropOperation[] = [getCollections];
