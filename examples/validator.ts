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

export const providerSchema = z.object({
    id: z.number(),
    fullname: z.string(),
    email: z.string().email(),
    phoneNumber: z.string().optional(),
    cuil: z.string(),
    cityId: z.number(),
    userId: z.number(),
    deletedAt: z.date().nullable()
});

export const serviceCreateSchema = serviceSchema.omit({
    id: true,
    deletedAt: true
});

export const serviceUpdateSchema = serviceCreateSchema.partial();
