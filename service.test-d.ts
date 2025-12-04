// test/types/service.test-d.ts
import { expectType, expectError } from 'tsd';
import { ServiceBuilder } from './src/service';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './tests/schema';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Types base
type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

// Mock setup
const createTestSetup = () => {
    const pool = new Pool({ 
        connectionString: 'postgres://root:a12345@localhost:5432/template' 
    });
        const db = drizzle(pool);

        const builder = new ServiceBuilder(db, users, {
            name: (value: string) => eq(users.name, value),
                email: (value: string) => eq(users.email, value),
                role: (value: string) => eq(users.role, value)
        });

        const selectAll = db.select().from(users).$dynamic();

        return {
            builder,
            selectAll,
            userService: {
                create: builder.create(),
                findOne: builder.findOne(selectAll),
                count: builder.count(selectAll),
                update: builder.update(),
                findAll: builder.findAll(selectAll),
                delete: builder.delete()
            }
        };
};

const { builder, userService, selectAll } = createTestSetup();

// ==================== TESTS DE TIPOS ====================

// Test: create method
expectType<Promise<User>>(
    userService.create({
        name: 'Test',
        email: 'test@test.com',
        password: 'password'
    })
);

expectError(
    userService.create({
        name: 'Test',
        password: 'password'
        // Missing email - should error
    })
);

expectError(
    userService.create({
        name: 'Test',
        email: 'test@test.com',
        password: 'password',
        invalidField: 'value' // Invalid field - should error
    })
);

// Test: findOne method
expectType<Promise<User>>(userService.findOne(1));

expectError(
    userService.findOne('1') // Wrong type - should error
);

// Test: findAll method
expectType<Promise<User[]>>(userService.findAll());
expectType<Promise<User[]>>(userService.findAll({ name: 'test' }));
expectType<Promise<User[]>>(userService.findAll(undefined, 1, 10));

expectError(
    userService.findAll({ invalidFilter: 'value' }) // Invalid filter - should error
);

expectError(
    userService.findAll({ name: 123 }) // Wrong filter type - should error  
);

// Test: update method
expectType<Promise<User>>(
    userService.update(1, { name: 'New Name' })
);

expectError(
    userService.update(1, { invalidField: 'value' }) // Invalid field - should error
);

expectError(
    userService.update(1, { name: 123 }) // Wrong field type - should error
);

// Test: count method
expectType<Promise<number>>(userService.count());
expectType<Promise<number>>(userService.count({ role: 'admin' }));

// Test: delete method  
expectType<Promise<void>>(userService.delete(1));

expectError(
    userService.delete('1') // Wrong type - should error
);

// Test: ServiceBuilder properties
expectType<string>(builder.tableName);
expectType<boolean>(builder.haveSoftDelete);

// Test: Partial selections
const partialSelect = db.select({
    id: users.id,
    name: users.name,
    email: users.email
}).from(users).$dynamic();

const partialFindAll = builder.findAll(partialSelect);
expectType<Promise<Array<{ id: number; name: string; email: string }>>>(
    partialFindAll()
);

const partialFindOne = builder.findOne(partialSelect);
expectType<Promise<{ id: number; name: string; email: string }>>(
    partialFindOne(1)
);
