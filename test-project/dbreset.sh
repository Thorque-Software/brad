set -e

# Cargar solo las variables necesarias del .env
export $(grep -v '^#' .env | grep -E 'DB_HOST|DB_PORT|DB_USER|DB_PASSWORD|DB_NAME' | xargs)

# 🔴 Eliminar la base de datos
echo "🔴 Eliminando la base de datos $DB_NAME..."
PGPASSWORD=$DB_PASSWORD dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

# 🟢 Crear la base de datos
echo "🟢 Creando la base de datos $DB_NAME..."
PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

# 🔵 Limpiar Drizzle
rm -rf migrations/local
mkdir -p migrations/local/meta

# 📒 Crear _journal.json
cat <<EOF > migrations/local/meta/_journal.json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": []
}
EOF

# ⚡ Generar migración y aplicar con local
npx drizzle-kit generate --config drizzle.config.ts
npx drizzle-kit migrate --config drizzle.config.ts

echo "✅ Base de datos y Drizzle reseteados correctamente."
