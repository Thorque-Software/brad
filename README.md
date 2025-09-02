# Bradb API Utilities

**Bradb** is a utility library designed to dramatically speed up the development of RESTful APIs in Node.js. It natively integrates [Express](https://expressjs.com/), [Drizzle ORM](https://orm.drizzle.team/), and [Zod](https://zod.dev/) to provide a solid and efficient foundation for your projects.

The philosophy of `bradb` is simple: reduce repetitive boilerplate code to a minimum, allowing you to focus on business logic.

## Core Features

-   **Base CRUD Controller:** Automatically generates endpoints for `getAll`, `getById`, `create`, `update`, and `delete`.
-   **Standardized Services:** A `ServiceBuilder` to create database access logic (`findAll`, `findOne`, `create`, etc.).
-   **Automatic Pagination and Filtering:** Extracts pagination (`page`, `pageSize`) and filter parameters from the URL.
-   **Validation with Zod:** Uses Zod schemas to validate input data.
-   **Integrated Error Handling:** An Express `errorHandler` that catches and formats errors from `Zod`, `Drizzle`, and custom service errors.

## Installation

```bash
npm install bradb
```

Make sure to also install the `peer` dependencies:

```bash
npm install express drizzle-orm pg zod
npm install -D @types/express @types/pg
```

## Quickstart Guide

Here is an example of how to structure an API with `bradb`.

### 1. Define Your Drizzle Schema

Create your database schema as you normally would with Drizzle.

`src/schema.ts`:
```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const serviceTable = pgTable("services", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    // ... other fields
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" })
});
```

### 2. Create the Service

Use `bradb`'s `ServiceBuilder` to create a CRUD service for your table.

`src/services.ts`:
```typescript
import { db } from "./db"; // Your Drizzle instance
import { serviceTable } from "./schema";
import { ServiceBuilder } from "bradb";
import { eq } from "drizzle-orm";

// Filter map for queries
const filterMap = {
    name: (value: string) => eq(serviceTable.name, value)
};

export const serviceService = new ServiceBuilder({
    db: db,
    table: serviceTable,
    filterMap: filterMap,
});
```

### 3. Create the Controller

Extend `bradb`'s `BaseController`, passing it the service and Zod validation schemas.

`src/controllers.ts`:
```typescript
import { BaseController } from "bradb";
import { serviceService } from "./services";
import { serviceTable } from "./schema";
import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";

// Base Zod schema from the Drizzle schema
const serviceSchema = createSelectSchema(serviceTable);

export const serviceController = new BaseController(
    serviceService,
    serviceSchema,
    serviceSchema.pick({ name: true }).partial() // Schema for filters
);
```

### 4. Set up the Router and Server

Connect the routes to the controller methods and don't forget to add the `errorHandler`.

`src/router.ts`:
```typescript
import { Router } from "express";
import { serviceController } from "./controllers";

const router = Router();

router.get("/", serviceController.getAll);
router.get("/:id", serviceController.getById);
router.post("/", serviceController.create);
router.put("/:id", serviceController.update);
router.delete("/:id", serviceController.delete);

export default router;
```

`src/index.ts`:
```typescript
import express from "express";
import serviceRouter from "./router";
import { errorHandler } from "bradb";

const app = express();
app.use(express.json());

app.use("/services", serviceRouter);

// Important! Add the error handler at the end
app.use(errorHandler);

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
```
