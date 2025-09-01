import z from "zod";

export const serviceSchema = z.object({
    id: z.number(),
    serviceTypeId: z.number(),
    providerId: z.number(),
    name: z.string(),
    suggestedMaxCapacity: z.number(),
    locationLat: z.number(),
    locationLong: z.number(),
    price: z.number(),
    duration: z.number(),
    deletedAt: z.date().nullable()
});

export const serviceFilterSchema = serviceSchema
.pick({
    name: true,
    serviceTypeId: true,
    providerId: true
})
.partial();
export type ServiceFilterSchema = z.infer<typeof serviceFilterSchema>;

export const serviceCreateSchema = serviceSchema.omit({
    id: true,
    deletedAt: true
});

export const serviceUpdateSchema = serviceCreateSchema.partial();
