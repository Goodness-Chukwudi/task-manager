
type DbSortQuery = Record<string, 1|-1> | null;
type DbPopulation = string[] | {path: string, select: string|string[]}[];

export {
    DbSortQuery,
    DbPopulation
}