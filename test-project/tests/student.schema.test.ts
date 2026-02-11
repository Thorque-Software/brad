import { describe, it, expect } from 'vitest';
import { studentTable } from '../src/schemas/student.schema';

describe('studentTable schema', () => {
  it('should have the correct table name', () => {
    expect(studentTable._.name).toBe('student');
  });

  it('should define the id column correctly', () => {
    const idColumn = studentTable.id;
    expect(idColumn).toBeDefined();
    expect(idColumn.getSQLType()).toBe('serial');
    expect(idColumn.primary).toBe(true);
    expect(idColumn.notNull).toBe(true);
  });

  it('should define the legajo column correctly', () => {
    const legajoColumn = studentTable.legajo;
    expect(legajoColumn).toBeDefined();
    expect(legajoColumn.getSQLType()).toBe('varchar(255)');
    expect(legajoColumn.notNull).toBe(true);
  });

  it('should define the doc column correctly', () => {
    const docColumn = studentTable.doc;
    expect(docColumn).toBeDefined();
    expect(docColumn.getSQLType()).toBe('varchar(255)');
    expect(docColumn.notNull).toBe(true);
  });

  it('should define the name column correctly', () => {
    const nameColumn = studentTable.name;
    expect(nameColumn).toBeDefined();
    expect(nameColumn.getSQLType()).toBe('varchar(255)');
    expect(nameColumn.notNull).toBe(true);
  });

  it('should define the lastname column correctly', () => {
    const lastnameColumn = studentTable.lastname;
    expect(lastnameColumn).toBeDefined();
    expect(lastnameColumn.getSQLType()).toBe('varchar(255)');
    expect(lastnameColumn.notNull).toBe(true);
  });
});
