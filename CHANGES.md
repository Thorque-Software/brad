# 14-02-2026

## Testing
Se agregó toda una suite de tests para código generado por la librería.

## Cambios controllers
Ahora los controllers reciben las funciones del service en lugar del service entero

```ts
export const eventController = {
    getAll: findAllBuilder(eventService.findAll, eventValidator.filter),
    getOne: findOneBuilder(eventService.findOne, eventValidator.pk),
    create: createBuilder(eventService.create, eventValidator.insert),
    update: updateBuilder(eventService.update, eventValidator.pk, eventValidator.update),
    remove: deleteBuilder(eventService.delete, eventValidator.pk)
};
```
En lugar de:
```ts
export const eventController = {
    getAll: findAllBuilder(eventService, eventValidator.filter),
    getOne: findOneBuilder(eventService, eventValidator.pk),
    create: createBuilder(eventService, eventValidator.insert),
    update: updateBuilder(eventService, eventValidator.pk, eventValidator.update),
    remove: deleteBuilder(eventService, eventValidator.pk)
};
```

Ahora los controllers reciben los validators de claves primarias
- create
- getOne
- update
- remove

## Objecto paginacion
Ahora la paginación se puede parsear con la función 
```ts
const pagination = newPagination(req.query);

## 
type Pagination = {
    page: number;
    pageSize: number;
    total?: number;
    count?: number;
};
```
El service recibe este objeto, y agregar el campo total y count directamente al
objeto. El service 'count' ya no es necesario para el getAll

## Fixes
El controller builder no handleaba bien los errores de claves duplicadas

En algunas instancias el instanceof dentro del errorHandler daba error 

La función count ahora cuenta correctamente las líneas de código joineadas
