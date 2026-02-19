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

const findAllDefault = builder.findAll(); 
const findOneDefault = builder.findOne(); 

/* Types tests */

type Expect<T extends true> = T;
type TypesMatch<T, U> = T extends U ? true : false;

type ResultFindOne = Awaited<ReturnType<typeof inscriptionService.findOne>>;
type ResultFindAll = Awaited<ReturnType<typeof inscriptionService.findAllFields>>;
type ResultFindAllDefault = Awaited<ReturnType<typeof findAllDefault>>;
type ResultFindOneDefault = Awaited<ReturnType<typeof findOneDefault>>;

/* TESTS */
type T1 = Expect<TypesMatch<ResultFindAllDefault, {
    idStudent: number,
    idEvent: number
}[]>>;

type T2 = Expect<TypesMatch<ResultFindOneDefault, {
    idStudent: number,
    idEvent: number
}>>;

type T3 = Expect<TypesMatch<ResultFindOne, {
    idFoo: number,
    idAaa: number
}>>;

type T4 = Expect<TypesMatch<ResultFindAll, {
    foo: number,
    bar: string
}[]>>;
