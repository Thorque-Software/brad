import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { inscriptionTable } from "../schemas/inscription.schema";

export const inscriptionSelectSchema = createSelectSchema(inscriptionTable);
export const inscriptionInsertSchema = createInsertSchema(inscriptionTable);
export const inscriptionUpdateSchema = inscriptionInsertSchema.partial();
export const inscriptionFilterSchema = inscriptionSelectSchema.partial();
export const inscriptionPkSchema = inscriptionSelectSchema.pick({
    idStudent: true,
	idEvent: true
});