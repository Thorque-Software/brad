import { describe, expect, it } from "vitest";
import { eventValidator } from "../src/validators/event.validator";
import { z } from "zod";
import request from "supertest";
import { app } from "../app";

const req = request(app);

const newEvent = {
    year: "2026",
    minCapacity: 1,
    maxCapacity: 50,
    cod: "COD04",
    duration: 3,
    dayOfWeek: 2
};

describe("Event controller (integration)", () => {
    let createdEventId: number;

    it("POST /events - should create a event successfully", async () => {
        let res = await req
            .post("/events")
            .send(newEvent)
            .expect(201)

        expect(res.body).toEqual({
            ...newEvent,
            id: expect.any(Number)
        });

        createdEventId = res.body.id;

        res = await req
            .get(`/events/${createdEventId}`)
            .expect(200);

        const { success } = eventValidator.select.safeParse(res.body);
        expect(success).toBe(true);
        expect(res.body).toEqual({
            ...newEvent,
            id: createdEventId
        });
    });

    it("POST /events - should fail to create a event if fields are missing", async () => {
        const newEvent = { year: "2025" };
        const res = await req
            .post("/events")
            .send(newEvent)
            .expect(400);

        expectError(res, "Validation failed", 400);
    });

    it("POST /events - should fail to create a event if it already exists", async () => {
        const res = await req
            .post("/events")
            .send(newEvent)

        expectError(res, `Key (cod)=(COD04) already exists.`, 409);
    });

    it("GET /events/:id - should retrieve a specific event successfully", async () => {
        const res = await req
            .get(`/events/${createdEventId}`)
            .expect(200);

        const { success } = eventValidator.select.safeParse(res.body);
        expect(success).toBe(true);
        expect(res.body).toEqual({
            ...newEvent,
            id: createdEventId
        });
    });

    it("GET /events/:id - should fail to retrieve a specific event if it doesn't exist", async () => {
        const res = await req
            .get("/events/9999")
            .expect(404);

        expectError(res, "event with id=9999 not found", 404);
    });

    it("PUT /events/:id - should update a event successfully", async () => {
        const updatedEvent = { maxCapacity: 56 };

        const res = await req
            .put(`/events/${createdEventId}`)
            .send(updatedEvent)
            .expect(200);

        const { success } = eventValidator.select.safeParse(res.body);
        expect(success).toBe(true);
    });

    it("PUT /events/:id - should fail to update a specific event if it doesn't exist", async () => {
        const res = await req
            .put(`/events/9999`)
            .send({ maxCapacity: 55 })
            .expect(404);

        expectError(res, `event with id=9999 not found`, 404);
    });

    it("PUT /events/:id - should fail to update a specific event if the data is not valid", async () => {
        const res = await req
            .put(`/events/${createdEventId}`)
            .send({ foo: 55 }) // invalid field
            .expect(400);

        expectError(res, "update needs at least one field", 400);
    });

    it("GET /events - should retrieve all events successfully", async () => {
        const res = await req
            .get("/events")
            .expect(200);

        expect(res.body).toHaveProperty('items');
        expect(res.body).toHaveProperty('total');
        const { success } = z.array(eventValidator.select).safeParse(res.body.items);
        expect(success).toBe(true);
    });

    it("DELETE /events/:id - should delete a specific event successfuly", async () => {
        const res = await req
            .delete(`/events/${createdEventId}`)
            .expect(204);
    });

    it("DELETE /events/:id - should fail to delete a specific event if it doesn't exist", async () => {
        const res = await req
            .delete(`/events/${createdEventId}`)
            .expect(404);

        expectError(res, `event with id=${createdEventId} not found`, 404);
    });
});

describe("Event filters", () => {
    it("should filter events by year", async () => {
        const res = await req.get("/events?year=2023").expect(200);
        expect(res.body.items).toHaveLength(3);
        expect(res.body.total).toBe(3);
        expect(res.body.items[0].year).toBe("2023");
        expect(res.body.items[1].year).toBe("2023");
        expect(res.body.items[2].year).toBe("2023");
    });

    it("should filter events by minCapacity", async () => {
        const res = await req.get("/events?minCapacity=2").expect(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.total).toBe(2);
        expect(res.body.items[0].minCapacity).toBe(2);
        expect(res.body.items[1].minCapacity).toBe(2);
    });

    it("should filter events by maxCapacity", async () => {
        const res = await req.get("/events?maxCapacity=15").expect(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.total).toBe(1);
        expect(res.body.items[0].maxCapacity).toBe(15);
    });

    it("should filter events by cod", async () => {
        const res = await req.get("/events?cod=EVT10").expect(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].cod).toBe("EVT10");
        expect(res.body.total).toBe(1);
    });

    it("should filter events by duration", async () => {
        const res = await req.get("/events?duration=3").expect(200);
        expect(res.body.items).toHaveLength(3);
        expect(res.body.total).toBe(3);
        expect(res.body.items[0].duration).toBe(3);
        expect(res.body.items[1].duration).toBe(3);
        expect(res.body.items[2].duration).toBe(3);
    });

    it("should filter events by dayOfWeek", async () => {
        const res = await req.get("/events?dayOfWeek=2").expect(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.total).toBe(2);
        expect(res.body.items[0].dayOfWeek).toBe(2);
        expect(res.body.items[1].dayOfWeek).toBe(2);
    });

    it("should filter events by multiple criteria", async () => {
        const res = await req.get("/events?year=2023&dayOfWeek=1").expect(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.total).toBe(1);
        expect(res.body.items[0].year).toBe("2023");
        expect(res.body.items[0].dayOfWeek).toBe(1);
    });
});

function expectError(res: any, msg: string, code: number) {
    const body = res.body;
    expect(res.status).toBe(code);
    expect(body).toHaveProperty('success');
    expect(body.success).toBe(false);
    expect(body).toHaveProperty('message');
    expect(body.message).toBe(msg);
    expect(body).toHaveProperty('code');
    expect(body.code).toBe(code);
}
