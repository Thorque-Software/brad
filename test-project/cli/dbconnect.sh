#!/bin/bash

# Cargar las variables del .env
export $(grep -v '^#' .env | xargs)

# Ejecutar psql usando las variables
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME
