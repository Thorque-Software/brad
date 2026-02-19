import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createFilterSchema, createPkSchema } from "bradb";
import { z } from "zod";
import { inscriptionTable } from "./schemas";

const select = createSelectSchema(inscriptionTable);
const insert = createInsertSchema(inscriptionTable);
const update = insert.partial();
const filter = createFilterSchema(inscriptionTable)
    .extend({
        codEvent: z.string()
    })
    .partial();
const pk = createPkSchema(inscriptionTable).pick({
    idStudent: true,
	idEvent: true
});

type Inscription = z.infer<typeof select>;
type InscriptionInsert = z.infer<typeof insert>;
type InscriptionUpdate = z.infer<typeof update>;
type InscriptionFilter = z.infer<typeof filter>;
type InscriptionPk = z.infer<typeof pk>;

export const inscriptionValidator = {
    select,
    insert,
    update,
    filter,
    pk
};
