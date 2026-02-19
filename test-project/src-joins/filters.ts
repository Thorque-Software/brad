import { FilterMap } from "bradb";
import { eq } from "drizzle-orm";
import { eventTable, inscriptionTable } from "./schemas"
import { inscriptionValidator } from "./validators";

export const inscriptionFilterMap: FilterMap<typeof inscriptionValidator.filter> = {
    idStudent: (val) => eq(inscriptionTable.idStudent, val),
	idEvent: (val) => eq(inscriptionTable.idEvent, val),
    codEvent: (val) => eq(eventTable.cod, val)
}
