import { SortOrder } from "mongoose";

type DbSortQuery = Record<string, SortOrder> | null;
type DbPopulation = {path: string, select: string|string[]}[];

export {
    DbSortQuery,
    DbPopulation
}