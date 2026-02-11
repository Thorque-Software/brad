import { describe, it, expect } from 'vitest';
import { eventTable } from '../src/schemas/event.schema';

describe('eventTable schema', () => {
  it('should have the correct table name', () => {
    expect(eventTable._.name).toBe('event');
  });

  it('should define the id column correctly', () => {
    const idColumn = eventTable.id;
    expect(idColumn).toBeDefined();
    expect(idColumn.getSQLType()).toBe('serial');
    expect(idColumn.primary).toBe(true);
    expect(idColumn.notNull).toBe(true);
  });

  it('should define the year column correctly', () => {
    const yearColumn = eventTable.year;
    expect(yearColumn).toBeDefined();
    expect(yearColumn.getSQLType()).toBe('varchar(4)');
  });

  it('should define the minCapacity column correctly', () => {
    const minCapacityColumn = eventTable.minCapacity;
    expect(minCapacityColumn).toBeDefined();
    expect(minCapacityColumn.getSQLType()).toBe('integer');
  });

  it('should define the maxCapacity column correctly', () => {
    const maxCapacityColumn = eventTable.maxCapacity;
    expect(maxCapacityColumn).toBeDefined();
    expect(maxCapacityColumn.getSQLType()).toBe('integer');
  });

  it('should define the cod column correctly', () => {
    const codColumn = eventTable.cod;
    expect(codColumn).toBeDefined();
    expect(codColumn.getSQLType()).toBe('varchar(255)');
  });

  it('should define the duration column correctly', () => {
    const durationColumn = eventTable.duration;
    expect(durationColumn).toBeDefined();
    expect(durationColumn.getSQLType()).toBe('integer');
  });

  it('should define the dayOfWeek column correctly', () => {
    const dayOfWeekColumn = eventTable.dayOfWeek;
    expect(dayOfWeekColumn).toBeDefined();
    expect(dayOfWeekColumn.getSQLType()).toBe('integer');
  });
});
