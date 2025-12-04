import { describe, expectTypeOf, it } from 'vitest';
import { users } from './schema';
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { db } from './db';
import { ServiceBuilder } from '../src/service';

type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;

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
}

describe('Type Inference', () => {
        it('should infer correct types for create', () => {
            // Verificar que create devuelve el tipo correcto
            expectTypeOf(userService.create).returns.resolves.toEqualTypeOf<User>();
            
            // Verificar que el parámetro de create es del tipo correcto
            expectTypeOf(userService.create).parameter(0).toEqualTypeOf<{aa: string}>();
        });

        it('should infer correct types for findOne', () => {
            // findOne debería devolver un User
            expectTypeOf(userService.findOne).returns.resolves.toEqualTypeOf<User>();
            
            // findOne debería aceptar un number como ID
            expectTypeOf(userService.findOne).parameter(0).toBeNumber();
        });

        it('should infer correct types for update', () => {
            // update debería devolver un User
            expectTypeOf(userService.update).returns.resolves.toEqualTypeOf<User>();
            
            // Primer parámetro: ID (number)
            expectTypeOf(userService.update).parameter(0).toBeNumber();
            
            // Segundo parámetro: Partial<NewUser>
            expectTypeOf(userService.update).parameter(1).toEqualTypeOf<Partial<NewUser>>();
        });

        it('should infer correct types for findAll', () => {
            // findAll debería devolver un array de User
            expectTypeOf(userService.findAll).returns.resolves.toEqualTypeOf<User[]>();
            
            // Parámetros: filtros opcionales, page, pageSize
            expectTypeOf(userService.findAll).parameter(0).toEqualTypeOf<{ name?: string; email?: string; role?: string } | undefined>();
            expectTypeOf(userService.findAll).parameter(1).toBeNumber();
            expectTypeOf(userService.findAll).parameter(2).toBeNumber();
        });

        it('should infer correct types for count', () => {
            // count debería devolver un number
            expectTypeOf(userService.count).returns.resolves.toBeNumber();
            
            // count debería aceptar filtros opcionales
            expectTypeOf(userService.count).parameter(0).toEqualTypeOf<{ name?: string; email?: string; role?: string } | undefined>();
        });

        it('should infer correct types for delete', () => {
            // delete debería devolver Promise<void>
            expectTypeOf(userService.delete).returns.resolves.toBeVoid();
            
            // delete debería aceptar un number como ID
            expectTypeOf(userService.delete).parameter(0).toBeNumber();
        });

        it('should reject invalid types in create', () => {
            // @ts-expect-error - email faltante (campo requerido)
            userService.create({ name: 'John', password: '123' });
            
            // @ts-expect-error - campo inexistente
            userService.create({ name: 'John', email: 'john@test.com', password: '123', invalidField: 'value' });
        });

        it('should reject invalid types in update', () => {
            // @ts-expect-error - campo inexistente
            userService.update(1, { invalidField: 'value' });
            
            // @ts-expect-error - tipo incorrecto para name
            userService.update(1, { name: 123 });
        });

        it('should reject invalid filter types', () => {
            // @ts-expect-error - filtro inexistente
            userService.findAll({ invalidFilter: 'value' });
            
            // @ts-expect-error - tipo incorrecto para filtro existente
            userService.findAll({ name: 123 });
        });
    });
