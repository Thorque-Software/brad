import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { inscriptionValidator } from "../src/validators/inscription.validator";

const req = request(app);

let studentId: number = 2;
let eventId: number = 2;

const route = (idStudent: number, idEvent: number) => `/inscriptions/student/${idStudent}/event/${idEvent}`;

describe("inscription controller (integration)", () => {
    it("POST /inscriptions/ - should create an inscription successfully", async () => {
        const res = await req
            .post("/inscriptions")
            .send({
                idStudent: studentId,
                idEvent: eventId
            })
            .expect(201);

        expect(res.body).toEqual({
            idStudent: studentId,
            idEvent: eventId
        });

        const { success } = inscriptionValidator.select.safeParse(res.body);
        expect(success).toBe(true);
    });

    it("POST /inscriptions - should fail to create an inscription if it already exists", async () => {
        const res = await req
            .post("/inscriptions")
            .send({
                idStudent: studentId,
                idEvent: eventId
            })
            .expect(409);

        expectError(res, `Key ("idStudent", "idEvent")=(${studentId}, ${eventId}) already exists.`, 409);
    });

    it("POST /inscriptions - should fail to create an inscription if event does not exists", async () => {
        const res = await req
            .post("/inscriptions")
            .send({
                idStudent: studentId,
                idEvent: 9999
            })

        expectError(res, `Key (idEvent)=(9999) is not present in table "event".`, 404);
    });

    it("POST /inscriptions - should fail to create an inscription if student does not exists", async () => {
        const res = await req
            .post("/inscriptions")
            .send({
                idStudent: 9999,
                idEvent: eventId
            })

        expectError(res, `Key (idStudent)=(9999) is not present in table "student".`, 404);
    });

    // it("GET /events/:idEvent/inscriptions - should retrieve all inscriptions for an event successfully", async () => {
    //     const res = await req
    //         .get(`/events/${eventId}/inscriptions`)
    //         .expect(200);
    //
    //     expect(res.body).toHaveProperty('items');
    //     expect(res.body).toHaveProperty('total');
    //     expect(res.body.items).toEqual([
    //         { idStudent: studentId, idEvent: eventId }
    //     ]);
    //     const { success } = z.array(inscriptionValidator.select).safeParse(res.body.items);
    //     expect(success).toBe(true);
    // });
    //
    // it("GET /students/:idStudent/inscriptions - should retrieve all inscriptions for a student successfully", async () => {
    //     const res = await req
    //         .get(`/students/${studentId}/inscriptions`)
    //         .expect(200);
    //
    //     expect(res.body).toHaveProperty('items');
    //     expect(res.body).toHaveProperty('total');
    //     expect(res.body.items).toEqual([
    //         { idStudent: studentId, idEvent: eventId }
    //     ]);
    //     const { success } = z.array(inscriptionValidator.select).safeParse(res.body.items);
    //     expect(success).toBe(true);
    // });

    it("GET /inscriptions/student/:idStudent/event/:idEvent - should retrieve a specific inscription successfully", async () => {
        const res = await req
            .get(route(studentId, eventId))
            .expect(200);

        expect(res.body).toEqual({
            idStudent: studentId,
            idEvent: eventId
        });
        const { success } = inscriptionValidator.select.safeParse(res.body);
        expect(success).toBe(true);
    });

    it("GET /inscriptions/student/:idStudent/event/:idEvent - should fail to retrieve a specific inscription if event doesn't exist", async () => {
        const res = await req
            .get(route(9999, eventId))
            .expect(404);

        expectError(res, `inscription with idStudent=9999 and idEvent=${eventId} not found`, 404);
    });

    it("GET /inscriptions/student/:idStudent/event/:idEvent - should fail to retrieve a specific inscription if student doesn't exist", async () => {
        const res = await req
            .get(route(studentId, 9999))
            .expect(404);

        expectError(res, `inscription with idStudent=${studentId} and idEvent=9999 not found`, 404);
    });

    it("DELETE /inscriptions/student/:idStudent/event/:idEvent - should delete a specific inscription successfully", async () => {
        const res = await req
            .delete(route(studentId, eventId))
            .expect(204);
    });

    it("DELETE /inscriptions/student/:idStudent/event/:idEvent - should fail to delete a specific inscription if event doesn't exist", async () => {
        const res = await req
            .delete(route(9999, eventId))
            .expect(404);

        expectError(res, `inscription with idStudent=9999 and idEvent=${eventId} not found`, 404);
    });

    it("DELETE /inscriptions/student/:idStudent/event/:idEvent - should fail to retrieve a specific inscription if student doesn't exist", async () => {
        const res = await req
            .delete(route(studentId, 9999))
            .expect(404);

        expectError(res, `inscription with idStudent=${studentId} and idEvent=9999 not found`, 404);
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
