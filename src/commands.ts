import { promises as fs } from 'fs';
import path from 'path';

type BradConfig = {
    dbConnection?: string;
    schemas?: string;
    routesDir?: string;
    controllerDir?: string;
    serviceDir?: string;
}

const defaultConfig = {
    routesDir: "routers",
    controllerDir: "controllers",
    serviceDir: "services"
}

class Commander {
    config: Required<Omit<BradConfig, 'dbConnection' | 'schemas'>>;

    constructor(config: BradConfig = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private toCamelCase(str: string): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    private formatImportPath(importPath: string): string {
        const parsed = path.parse(importPath);
        return path.join(parsed.dir, parsed.name).replace(/\\/g, '/');
    }

    async createEntity(entityName: string, basePath: string = 'src', config: BradConfig = {}) {
        const capitalizedName = this.capitalize(entityName);
        const camelCaseName = this.toCamelCase(entityName);

        const controllerDir = path.resolve(basePath, this.config.controllerDir);
        const serviceDir = path.resolve(basePath, this.config.serviceDir);
        const routerDir = path.resolve(basePath, this.config.routesDir);

        try {
            await fs.mkdir(controllerDir, { recursive: true });
            await fs.mkdir(serviceDir, { recursive: true });
            await fs.mkdir(routerDir, { recursive: true });

            await this.createServiceFile(serviceDir, entityName, camelCaseName, config);
            await this.createControllerFile(controllerDir, entityName, camelCaseName);
            await this.createRouterFile(routerDir, entityName, camelCaseName);

            console.log(`Entity ${entityName} created successfully!`);
            console.log(`- ${path.join(serviceDir, `${entityName}.service.ts`)}`);
            console.log(`- ${path.join(controllerDir, `${entityName}.controller.ts`)}`);
            console.log(`- ${path.join(routerDir, `${entityName}.router.ts`)}`);

        } catch (error) {
            console.error("Error creating entity:", error);
        }
    }

    private async createServiceFile(dir: string, name: string, camelCaseName: string, config: BradConfig) {
        let dbImport = `import { db } from '../db'; // fallback`;
        let schemaImport = `import { ${camelCaseName}Table } from '../schema'; // fallback`;

        if (config.dbConnection) {
            const dbPath = path.relative(dir, path.resolve(config.dbConnection));
            dbImport = `import { db } from '${this.formatImportPath(dbPath)}';`;
        }
        if (config.schemas) {
            const schemaPath = path.relative(dir, path.resolve(config.schemas));
            schemaImport = `import { ${camelCaseName}Table } from '${this.formatImportPath(schemaPath)}';`;
        }

        const serviceTemplate = `import { ServiceBuilder } from 'bradb';
${dbImport}
${schemaImport}

// TODO: Define your filter map
// import { ${camelCaseName}FilterMap } from '../filter';

const builder = new ServiceBuilder(db, ${camelCaseName}Table, {});

export const ${camelCaseName}Service = {
    create: builder.create(),
    update: builder.update(),
    delete: builder.softDelete(),
    findOne: builder.findOne(
        db.select().from(${camelCaseName}Table).$dynamic()
    ),
    findAll: builder.findAll(
        db.select().from(${camelCaseName}Table).$dynamic()
    ),
    count: builder.count()
};
`;
        await fs.writeFile(path.join(dir, `${name}.service.ts`), serviceTemplate);
    }

    private async createControllerFile(dir: string, name: string, camelCaseName: string) {
        const controllerTemplate = `import { createBuilder, findAllBuilder, findOneBuilder, updateBuilder, deleteBuilder } from 'bradb';
import { ${camelCaseName}Service } from '../services/${name}.service';
// import { ${camelCaseName}CreateSchema, ${camelCaseName}UpdateSchema } from '../validators'; // Adjust this import

export const ${camelCaseName}Controller = {
    create: createBuilder(${camelCaseName}Service), // Add schema validator as second argument
    findAll: findAllBuilder(${camelCaseName}Service),
    findOne: findOneBuilder(${camelCaseName}Service),
    update: updateBuilder(${camelCaseName}Service), // Add schema validator as second argument
    delete: deleteBuilder(${camelCaseName}Service)
};
`;
        await fs.writeFile(path.join(dir, `${name}.controller.ts`), controllerTemplate);
    }

    private async createRouterFile(dir: string, name: string, camelCaseName: string) {
        const routerTemplate = `import { Router } from 'express';
import { ${camelCaseName}Controller } from '../controllers/${name}.controller';

const router = Router();

router.get('/', ${camelCaseName}Controller.findAll);
router.get('/:id', ${camelCaseName}Controller.findOne);
router.post('/', ${camelCaseName}Controller.create);
router.put('/:id', ${camelCaseName}Controller.update);
router.delete('/:id', ${camelCaseName}Controller.delete);

export default router;
`;
        await fs.writeFile(path.join(dir, `${name}.router.ts`), routerTemplate);
    }
}

export default new Commander();
