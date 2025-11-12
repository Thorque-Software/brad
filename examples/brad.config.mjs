// brad.config.ts
export default {
  // Ruta al archivo que exporta tu conexión de base de datos (instancia de Drizzle).
  dbConnection: './db.ts',

  // Ruta al archivo que exporta todas tus tablas (schemas) de Drizzle.
  schemas: './schema.ts'
};
