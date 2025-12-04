import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ServiceBuilder } from '../src/service';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { BadRequest, Duplicated, NotFound } from '../src/errors';

describe('ServiceBuilder Integration Tests', () => {
    let pool: Pool;
    const userData = { name: 'John', email: 'john@test.com', password: 'asdfghjk', role: 'admin' }

    const DATABASE_URL="postgres://root:a12345@localhost:5432/template"
        pool = new Pool({
        connectionString: DATABASE_URL,
    });
    const db = drizzle(pool);
    const builder = new ServiceBuilder(db, users, {
        name: (value: string) => eq(users.name, value),
        email: (value: string) => eq(users.email, value),
        role: (value: string) => eq(users.role, value)
    });

    const seedUsers = [
        { name: `User1`, email: `user1@test.com`, password: '12345', role: 'admin' },
        { name: `User2`, email: `user2@test.com`, password: '12345', role: 'provider'},
        { name: `User3`, email: `user3@test.com`, password: '12345', role: 'provider' },
        { name: `User4`, email: `user4@test.com`, password: '12345', role: 'provider' },
        { name: `User5`, email: `user5@test.com`, password: '12345', role: 'provider' },
        { name: `User6`, email: `user6@test.com`, password: '12345', role: 'finalUser' },
        { name: `User7`, email: `user7@test.com`, password: '12345', role: 'finalUser' },
        { name: `User8`, email: `user8@test.com`, password: '12345', role: 'finalUser' },
        { name: `User9`, email: `user9@test.com`, password: '12345', role: 'finalUser' },
        { name: `User10`, email: `user10@test.com`, password: '12345', role: 'finalUser' }
    ];

    // TODO: i cant pass the same query to findAll and findOne
    const userService = {
        create: builder.create(),
        findOne: builder.findOne(db.select().from(users).$dynamic()),
        count: builder.count(),
        update: builder.update(),
        findAll: builder.findAll(db.select().from(users).$dynamic()),
        delete: builder.delete()
    }

    type a = typeof builder.pks["length"];

    console.log("PKS", builder.pks["length"]);

    beforeAll(async () => {
        // Limpiar datos antes de cada test
        await db.delete(users);
        await db.execute(`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
        await db.insert(users).values(seedUsers);
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('find One', () => {
        it('should throw an error if the user does not exists', async () => {
            await expect(userService.findOne(99)).rejects.toThrow(NotFound);
        });

        it('should return an object if exists', async () => {
            const user = await userService.findOne(1)
            expect(user).toMatchObject(seedUsers[0]);
        });
    });

    describe('find all', () => {
        it('should return only specified fields', async () => {
            const fn = builder.findAll(
                db.select({
                    name: users.name,
                    password: users.password
                }).from(users).$dynamic()
            );

            const items = await fn();
            for (const i of items) {
                expect(i).toHaveProperty('name');
                expect(i).toHaveProperty('password');
            }
        });

        it('should return only value filtered', async () => {
            const items = await userService.findAll({role: 'provider'});
            expect(items.length).toBe(4);

            for (const i of items) {
                expect(i).toHaveProperty('name');
                expect(i).toHaveProperty('password');
                expect(i).toHaveProperty('role');
                expect(i.role).toBe('provider');
            }
        });

        it('should return only specified fields', async () => {
            const fn = builder.findAll(
                db.select({
                    name: users.name,
                    password: users.password
                }).from(users).$dynamic()
            );

            const items = await fn();
            for (const i of items) {
                expect(i).toHaveProperty('name');
                expect(i).toHaveProperty('password');
            }
        });

        it('should findAll with pagination', async () => {
            const page1 = await userService.findAll(undefined, 1, 6);
            expect(page1).toHaveLength(6);

            const page2 = await userService.findAll(undefined, 2, 6);
            expect(page2).toHaveLength(4);
        });

        it('if the service has "delete at" should not find that', async () => {
            const page1 = await userService.findAll();

            const page2 = await userService.findAll(undefined, 2, 6);
            expect(page2).toHaveLength(4);
        });
    })

    describe('update', () => {
        it('should update user', async () => {
            const updatedUser = await userService.update(1, { name: 'John Updated' });

            expect(updatedUser.name).toBe('John Updated');
            expect(updatedUser.email).toBe(seedUsers[0].email);
        });

        it('update should throw an error if the user does not exists', async () => {
            await expect(userService.update(99, {name: 'New name'})).rejects.toThrow(NotFound);
        });

        it('update should throw if not pass any fields', async () => {
            await expect(userService.update(99, {})).rejects.toThrow(BadRequest);
        });

        it('rollback in transaction must not have effect', async () => {
            try {
                await db.transaction(async (tx) => {
                    await userService.update(1, {name: 'John new updated'}, tx);
                    tx.rollback();
                });
            } catch {
                const user = await userService.findOne(1);
                expect(user.name).toBe('John Updated');
                expect(user.email).toBe(seedUsers[0].email);
            }
        });
    });

    describe('create', () => {
        it('should create a user', async () => {
            const createdUser = await userService.create(userData);

            expect(createdUser.name).toBe(userData.name);
            expect(createdUser.email).toBe(userData.email);
            expect(createdUser.id).toBeDefined();

            // Test findOne
            const foundUser = await userService.findOne(createdUser.id);
            expect(foundUser).toEqual(createdUser);
        });

        it('create should throw an error if the email already exists', async () => {
            await expect(userService.create(userData)).rejects.toThrow(Duplicated);
        });

        it('create should throw an error if the pk already exists', async () => {
            await expect(userService.create({
                ...userData,
                id: 1
            })).rejects.toThrow(Duplicated);
        });

        it('hooks', async () => {
            type HookType = {
                name: string;
                email: string;
                password: string;
            };
            // The hook adds the role provider
            const hookCreate = builder.create(async (data: HookType) => {
                return {
                    ...data,
                    role: "provider"
                }
            });

            const data = { name: 'prov', email: 'prov@test.com', password: '123' }
            const user = await hookCreate(data);
            expect(user.role).toBe("provider");
        });

        it('rollback in transaction must not have effect', async () => {
            try {
                await db.transaction(async (tx) => {
                    await userService.create({...userData, email: "roll@back.com"}, tx);
                    tx.rollback();
                });
            } catch {
                const items = await userService.findAll({email: "roll@back.com"});
                expect(items.length).toBe(0);
            }
        });
    });

    describe('delete', () => {
        it('should delete user (soft delete)', async () => {
            await userService.delete(2);

            // Verificar que el usuario no se encuentra en las consultas normales
            await expect(userService.findOne(2)).rejects.toThrow(NotFound);
        });

        it('delete should throw an error if the user does not exists', async () => {
            await expect(userService.delete(99)).rejects.toThrow(NotFound);
        });

        it('rollback in transaction must not have effect', async () => {
            try {
                await db.transaction(async (tx) => {
                    await userService.delete(3, tx);
                    tx.rollback();
                });
            } catch {
                const user = await userService.findOne(3);
                expect(user).toMatchObject(seedUsers[2]);
            }
        });
    });

    describe('count', () => {
        it('should count users correctly', async () => {
            const total = await userService.count();
            expect(total).toBe(11);
        });

        it('count filtered fields', async () => {
            const count = await userService.count({role: 'provider'});
            expect(count).toBe(4);
        });
    });

});
