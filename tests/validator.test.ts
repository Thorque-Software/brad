
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateValidator } from '../src/generators';
import fs from 'fs';
import path from 'path';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name'),
    email: text('email').notNull(),
});

describe('generateValidator', () => {
    const config = {
        dbImportPath: 'src/db',
        validatorDir: 'tests/temp/validators',
        schemasDir: 'tests/temp/schemas',
        serviceDir: 'tests/temp/services',
        controllerDir: 'tests/temp/controllers',
        routesDir: 'tests/temp/routes',
        cwd: process.cwd(),
    };

    beforeAll(() => {
        // Create temp directories
        fs.mkdirSync(path.join(config.cwd, config.validatorDir), { recursive: true });
        fs.mkdirSync(path.join(config.cwd, config.schemasDir), { recursive: true });

        // Create brad.config.json
        fs.writeFileSync(path.join(config.cwd, 'brad.config.json'), JSON.stringify(config, null, 2));

        // Create a mock schema file
        const schemaContent = `import { pgTable, serial, text } from 'drizzle-orm/pg-core';

        export const usersTable = pgTable('users', {
            id: serial('id').primaryKey(),
            name: text('name'),
            email: text('email').notNull(),
        });
        `;
        fs.writeFileSync(path.join(config.cwd, config.schemasDir, 'users.schema.ts'), schemaContent);
    });

    afterAll(() => {
        // Clean up generated files and directories
        fs.unlinkSync(path.join(config.cwd, 'brad.config.json'));
        fs.rmSync(path.join(config.cwd, 'tests/temp'), { recursive: true, force: true });
    });

    it('should generate a validator file with the correct content', () => {
        const imports = ['import a from b', 'import c from d'];
        const content = generateValidator('users', usersTable, imports);

        // expect to contain an inmport
        for (const i of imports) {
            expect(content).toContain(i);
        }

        expect(content).toContain('export const usersSelectSchema = createSelectSchema(usersTable);');
        expect(content).toContain('export const usersInsertSchema = createInsertSchema(usersTable);');
        expect(content).toContain('export const usersUpdateSchema = usersInsertSchema.partial();');
        expect(content).toContain('export const usersFilterSchema = usersSelectSchema.partial();');

        // Expect to pick only the id
        expect(content).toContain('id: true');
    });
});
