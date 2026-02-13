import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { studentValidator } from "../src/validators/student.validator";
import { z } from "zod";

const req = request(app);

const newStudent = {
    legajo: "12345",
    doc: "987654321",
    name: "John",
    lastname: "Doe"
};

describe("Student controller (integration)", () => {
    let createdStudentId: number;

    it("POST /students - should create a student successfully", async () => {
        let res = await req
            .post("/students")
            .send(newStudent)
            .expect(201);

        expect(res.body).toEqual({
            ...newStudent,
            id: expect.any(Number)
        });

        createdStudentId = res.body.id;

        res = await req
            .get(`/students/${createdStudentId}`)
            .expect(200);

        const { success } = studentValidator.select.safeParse(res.body);
        expect(success).toBe(true);
        expect(res.body).toEqual({
            ...newStudent,
            id: createdStudentId
        });
    });

    it("POST /students - should fail to create a student if fields are missing", async () => {
        const studentMissingField = { legajo: "67890" };
        const res = await req
            .post("/students")
            .send(studentMissingField)
            .expect(400);

        expectError(res, "Validation failed", 400);
    });

    it("GET /students/:id - should retrieve a specific student successfully", async () => {
        const res = await req
            .get(`/students/${createdStudentId}`)
            .expect(200);

        const { success } = studentValidator.select.safeParse(res.body);
        expect(success).toBe(true);
        expect(res.body).toEqual({
            ...newStudent,
            id: createdStudentId
        });
    });

    it("GET /students/:id - should fail to retrieve a specific student if it doesn't exist", async () => {
        const res = await req
            .get("/students/9999")
            .expect(404);

        expectError(res, "student with id=9999 not found", 404);
    });

    it("PUT /students/:id - should update a student successfully", async () => {
        const updatedStudent = { name: "Jane" };

        const res = await req
            .put(`/students/${createdStudentId}`)
            .send(updatedStudent)
            .expect(200);

        const { success } = studentValidator.select.safeParse(res.body);
        expect(success).toBe(true);
        expect(res.body).toEqual({
            ...newStudent,
            ...updatedStudent,
            id: createdStudentId
        });
    });

    it("PUT /students/:id - should fail to update a specific student if it doesn't exist", async () => {
        const res = await req
            .put(`/students/9999`)
            .send({ name: "NonExistent" })
            .expect(404);

        expectError(res, `student with id=9999 not found`, 404);
    });

    it("PUT /students/:id - should fail to update a specific student if the data is not valid", async () => {
        const res = await req
            .put(`/students/${createdStudentId}`)
            .send({ foo: "bar" }) // invalid field
            .expect(400);

        expectError(res, "update needs at least one field", 400);
    });

    it("GET /students - should retrieve all students successfully", async () => {
        const res = await req
            .get("/students")
            .expect(200);

        expect(res.body).toHaveProperty('items');
        expect(res.body).toHaveProperty('total');
        const { success } = z.array(studentValidator.select).safeParse(res.body.items);
        expect(success).toBe(true);
    });

    it("DELETE /students/:id - should delete a specific student successfully", async () => {
        const res = await req
            .delete(`/students/${createdStudentId}`)
            .expect(204);
    });

    it("DELETE /students/:id - should fail to delete a specific student if it doesn't exist", async () => {
        const res = await req
            .delete(`/students/${createdStudentId}`)
            .expect(404);

        expectError(res, `student with id=${createdStudentId} not found`, 404);
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
