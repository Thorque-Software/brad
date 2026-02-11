import { describe, it, expect } from 'vitest';
import { inscriptionTable } from '../src/schemas/inscription.schema';

describe('inscriptionTable schema', () => {
  it('should have the correct table name', () => {
    expect(inscriptionTable._.name).toBe('inscription');
  });

  it('should define the idStudent column correctly', () => {
    const idStudentColumn = inscriptionTable.idStudent;
    expect(idStudentColumn).toBeDefined();
    expect(idStudentColumn.getSQLType()).toBe('integer');
    expect(idStudentColumn.notNull).toBe(true);
  });

  it('should define the idEvent column correctly', () => {
    const idEventColumn = inscriptionTable.idEvent;
    expect(idEventColumn).toBeDefined();
    expect(idEventColumn.getSQLType()).toBe('integer');
    expect(idEventColumn.notNull).toBe(true);
  });

  it('should define the composite primary key correctly', () => {
    const primaryKeys = inscriptionTable._.primaryKeys;
    expect(primaryKeys).toBeDefined();
    expect(primaryKeys.length).toBe(1);
    expect(primaryKeys[0].name).toBe('inscription_pkey');
    expect(primaryKeys[0].columns.map(col => col.name)).toEqual(['id_student', 'id_event']);
  });
});
