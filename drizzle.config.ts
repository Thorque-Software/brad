import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./migrations/local",
    schema: "./tests/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: "postgres://root:a12345@localhost:5432/template"
    }
});
