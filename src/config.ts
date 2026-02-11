import path from "path";
import { z, ZodError } from "zod";
import fs from "fs";

const ConfigSchema = z.object({
    dbImportPath: z.string().default("src/db.ts"),

    validatorDir: z.string().default("src/validators"),  
    schemaDir: z.string().default("src/schemas"),  
    serviceDir: z.string().default("src/services"),
    controllerDir: z.string().default("src/controllers"),
    routerDir: z.string().default("src/routes"),
    filterDir: z.string().default("src/filters"),

    cwd: z.string().default(process.cwd()),
    maxColumns: z.number().default(80)
});

export type BradConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(customPath?: string): BradConfig {
    const configName = "brad.config.json";

    const filePath = path.resolve(process.cwd(), configName);

    try {
        const file = fs.readFileSync(filePath, 'utf8'); 
        return ConfigSchema.parse(JSON.parse(file));
    } catch (err) {
        if (err instanceof ZodError) {
            error(err.message); 
        } else if (err instanceof SyntaxError) {
            error("File is not a valid JSON");
        }

        error('No config found. Create brad.config.json');
        process.exit(2);
    }
}

function error(msg: string) {
    console.error(`\x1b[41m${msg}\x1b[0m`);
    process.exit(2);
}
