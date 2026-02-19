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

export const staticInscriptions = [
    { idStudent: 1, idEvent: 1 }, // Alice en EVT01
    { idStudent: 1, idEvent: 2 }, // Alice en EVT02
    { idStudent: 2, idEvent: 1 }, // Bob en EVT01
    { idStudent: 1, idEvent: 3 }, // Alice en EVT03
    { idStudent: 1, idEvent: 4 }, // Alice en EVT04
    { idStudent: 1, idEvent: 5 }, // Alice en EVT05
    { idStudent: 1, idEvent: 6 }, // Alice en EVT06
    { idStudent: 2, idEvent: 7 }, // Bob en EVT07
    { idStudent: 2, idEvent: 8 }, // Bob en EVT08
    { idStudent: 1, idEvent: 8 }, // Bob en EVT08
    { idStudent: 2, idEvent: 9 }, // Bob en EVT09
    { idStudent: 2, idEvent: 10 }, // Bob en EVT10
    { idStudent: 1, idEvent: 11 }, // Alice en EVT11
    { idStudent: 2, idEvent: 12 }, // Bob en EVT12
];

// Seeders
async function main() {
    console.log("Deleting tables");

    await resetIdentity("student");
    await resetIdentity("event");
    await resetIdentity("inscription");

    await db.insert(eventTable).values(events);
    await db.insert(studentTable).values(students);
    await db.insert(inscriptionTable).values(staticInscriptions);
};

export async function resetIdentity(tableName: string) {
    await db.execute(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
}

main().catch((err) => {
    console.error("Error seeding database:", err);
    process.exit(1);
});
