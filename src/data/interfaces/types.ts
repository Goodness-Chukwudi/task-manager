
type DbSortQuery = Record<string, 1|-1> | null;
type DbPopulation = {path: string, select: string|string[]}[];

export {
    DbSortQuery,
    DbPopulation
}