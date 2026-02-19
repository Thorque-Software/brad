import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app-joined";

const req = request(app);

const route = (idStudent: number, idEvent: number) => `/inscriptions/student/${idStudent}/event/${idEvent}`;

describe("joined", () => {
    it("Get all", async () => {
        const res = await req
            .get("/inscriptions")
            .expect(200);

        expect(res.body).toHaveProperty('pagination');
        expect(res.body).toHaveProperty('items');
        const items = res.body.items;
        expect(items[0]).toEqual({
            event: expect.any(Object),
            inscription: expect.any(Object)
        });
        const pagin = res.body.pagination;
        expect(pagin).toHaveProperty('total');
        expect(pagin).toHaveProperty('page');
        expect(pagin).toHaveProperty('pageSize');
    });

    it("with pagination - page 1", async () => {
        const res = await req
            .get("/inscriptions?page=1&pageSize=5")
            .expect(200);

        expect(res.body).toHaveProperty('pagination');
        expect(res.body).toHaveProperty('items');
        const items = res.body.items;
        expect(items[0]).toEqual({
            event: expect.any(Object),
            inscription: expect.any(Object)
        });
        const pagin = res.body.pagination;
        expect(pagin).toHaveProperty('total');
        expect(pagin).toHaveProperty('page');
        expect(pagin).toHaveProperty('pageSize');
        expect(pagin.page).toBe(1)
        expect(pagin.total).toBe(14)
        expect(pagin.pageSize).toBe(5)
        expect(items.length).toBe(5);
    });

    it("Last page should give only 4 items", async () => {
        const res = await req
            .get("/inscriptions?page=3&pageSize=5")
            .expect(200);

        expect(res.body).toHaveProperty('pagination');
        expect(res.body).toHaveProperty('items');
        const items = res.body.items;
        expect(items[0]).toEqual({
            event: expect.any(Object),
            inscription: expect.any(Object)
        });
        const pagin = res.body.pagination;
        expect(pagin).toHaveProperty('total');
        expect(pagin).toHaveProperty('page');
        expect(pagin).toHaveProperty('pageSize');
        expect(pagin.page).toBe(3)
        expect(pagin.total).toBe(14)
        expect(pagin.pageSize).toBe(5)
        expect(items.length).toBe(4);
    });

    it("Should retrieve inscriptions with cod event filter", async () => {
        const res = await req
            .get("/inscriptions?codEvent=EVT08&pageSize=1")
            .expect(200);

        expect(res.body).toHaveProperty('pagination');
        expect(res.body).toHaveProperty('items');
        const items = res.body.items;
        expect(items[0]).toEqual({
            event: expect.any(Object),
            inscription: expect.any(Object)
        });
        const pagin = res.body.pagination;
        expect(pagin).toHaveProperty('total');
        expect(pagin).toHaveProperty('page');
        expect(pagin).toHaveProperty('pageSize');
        expect(pagin.page).toBe(1)
        expect(pagin.total).toBe(2)
        expect(pagin.pageSize).toBe(1)
        expect(items.length).toBe(1);
    });

    it("GET /inscriptions/student/:idStudent/event/:idEvent - should fail to retrieve a specific inscription if event doesn't exist", async () => {
        const res = await req
            .get(route(1, 1))
            .expect(200);

        expect(res.body).toEqual({
            idFoo: expect.any(Number),
            idAaa: expect.any(Number)
        });
    });
})

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
