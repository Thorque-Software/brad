import { ServiceBuilder } from "bradb";
import { eventTable, inscriptionTable } from "./schemas"
import { inscriptionFilterMap } from "./filters"
import { db } from "../src/db";
import { eq } from "drizzle-orm";

const builder = new ServiceBuilder(db, inscriptionTable, inscriptionFilterMap);

export const inscriptionService = {
    create: builder.create(),
    update: builder.update(),
    delete: builder.delete(),
    findAll: builder.findAll(() => 
        db
            .select()
            .from(inscriptionTable)
            .innerJoin(eventTable,
                eq(eventTable.id, inscriptionTable.idEvent)
            )
            .$dynamic()
    ),
    findAllFields: builder.findAll(() => 
        db
            .select({
                foo: inscriptionTable.idEvent,
                bar: eventTable.year
            })
            .from(inscriptionTable)
            .innerJoin(eventTable,
                eq(eventTable.id, inscriptionTable.idEvent)
            )
            .$dynamic()
    ),
    findOne: builder.findOne(() => 
        db
            .select({
                idFoo: inscriptionTable.idEvent,
                idAaa: inscriptionTable.idEvent,
            })
            .from(inscriptionTable)
            .$dynamic()
    ) 
};

/* Types tests */

type Expect<T extends true> = T;
type ResultFindOne = Awaited<ReturnType<typeof inscriptionService.findOne>>;

type ResultFindAll = Awaited<ReturnType<typeof inscriptionService.findAllFields>>;

type TypesMatch<T, U> = T extends U ? true : false;

type Match = TypesMatch<ResultFindOne, {
    idFoo: number,
    idAaa: number
}>;

type MatchAll = TypesMatch<ResultFindAll, {
    foo: number,
    bar: string
}>

type Res = Expect<Match>;
type Res1 = Expect<MatchAll>;
