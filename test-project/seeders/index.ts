import "dotenv/config";
import { db } from "../src/db";
import { eventTable, inscriptionTable, studentTable } from "../src/schemas";

const students = [
    {
        legajo: "S001",
        doc: "11111111",
        name: "Alice",
        lastname: "Smith"
    },
    {
        legajo: "S002",
        doc: "11111112",
        name: "Bob",
        lastname: "Patiño"
    }
];

const events = [
    {
        year: "2027",
        minCapacity: 1,
        maxCapacity: 10,
        cod: "EVT01",
        duration: 2,
        dayOfWeek: 1
    },
    {
        year: "2023",
        minCapacity: 5,
        maxCapacity: 12,
        cod: "EVT02",
        duration: 3,
        dayOfWeek: 1
    },
    {
        year: "2024",
        minCapacity: 3,
        maxCapacity: 8,
        cod: "EVT03",
        duration: 1,
        dayOfWeek: 2
    },
    {
        year: "2025",
        minCapacity: 7,
        maxCapacity: 15,
        cod: "EVT04",
        duration: 4,
        dayOfWeek: 3
    },
    {
        year: "2026",
        minCapacity: 2,
        maxCapacity: 6,
        cod: "EVT05",
        duration: 2,
        dayOfWeek: 4
    },
    {
        year: "2027",
        minCapacity: 4,
        maxCapacity: 11,
        cod: "EVT06",
        duration: 3,
        dayOfWeek: 5
    },
    {
        year: "2023",
        minCapacity: 6,
        maxCapacity: 9,
        cod: "EVT07",
        duration: 1,
        dayOfWeek: 6
    },
    {
        year: "2024",
        minCapacity: 8,
        maxCapacity: 13,
        cod: "EVT08",
        duration: 2,
        dayOfWeek: 0
    },
    {
        year: "2025",
        minCapacity: 1,
        maxCapacity: 5,
        cod: "EVT09",
        duration: 4,
        dayOfWeek: 1
    },
    {
        year: "2026",
        minCapacity: 3,
        maxCapacity: 10,
        cod: "EVT10",
        duration: 3,
        dayOfWeek: 2
    },
    {
        year: "2027",
        minCapacity: 5,
        maxCapacity: 14,
        cod: "EVT11",
        duration: 2,
        dayOfWeek: 3
    },
    {
        year: "2023",
        minCapacity: 2,
        maxCapacity: 7,
        cod: "EVT12",
        duration: 1,
        dayOfWeek: 4
    }
];

// Seeders
async function main() {
    console.log("Deleting tables");
    // await db.delete(eventTable);
    // await db.delete(studentTable);
    // await db.delete(inscriptionTable);

    await resetIdentity("student");
    await resetIdentity("event");
    await resetIdentity("inscription");

    await db.insert(eventTable).values(events);
    await db.insert(studentTable).values(students);
};

export async function resetIdentity(tableName: string) {
    await db.execute(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
}

main().catch((err) => {
    console.error("Error seeding database:", err);
    process.exit(1);
});
