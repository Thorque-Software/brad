// test/types/service-types.test-d.ts
import { expectTypeOf } from 'vitest/expect';
import { ServiceBuilder } from '../src/service';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Este archivo solo se usa para verificación de tipos en compilación

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

// Setup para pruebas de tipos
const db = drizzle.mock();
const builder = new ServiceBuilder(db, users, {
    name: (value: string) => eq(users.name, value),
    email: (value: string) => eq(users.email, value),
    role: (value: string) => eq(users.role, value)
});

const selectAll = db.select().from(users).$dynamic();

const userService = {
    create: builder.create(),
    findOne: builder.findOne(selectAll),
    count: builder.count(),
    update: builder.update(),
    findAll: builder.findAll(selectAll),
    delete: builder.delete()
};

// Pruebas de tipos - estas líneas harán que TypeScript falle si los tipos no coinciden
const _testCreateReturn: Promise<User> = userService.create({
    name: 'Test',
    email: 'test@test.com',
    password: 'password'
});

const _testFindOneReturn: Promise<User> = userService.findOne(1);

const _testUpdateParams: (id: number, data: Partial<NewUser>) => Promise<User> = userService.update;

const _testFindAllReturn: Promise<User[]> = userService.findAll();

const _testCountReturn: Promise<number> = userService.count();

const _testDeleteReturn: Promise<void> = userService.delete(1);

// Verificar que tipos incorrectos fallen
// @ts-expect-error - email faltante
const _invalidCreate: Promise<User> = userService.create({
    name: 'Test',
    password: 'password'
});

// @ts-expect-error - campo inválido
const _invalidUpdate: Promise<User> = userService.update(1, {
    invalidField: 'value'
});
