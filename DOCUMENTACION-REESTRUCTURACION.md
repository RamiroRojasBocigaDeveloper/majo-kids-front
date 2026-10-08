# Documentación de Reestructuración Frontend

Este documento detalla los cambios realizados en el frontend para adaptarlo al patrón plano de módulos (basado en `front_compras`), y enumera los módulos que faltan por implementar.

## Patrón de Arquitectura

El nuevo patrón elimina las carpetas `core/` y `features/`. Todos los módulos son carpetas de primer nivel bajo `src/app/`.

Cada módulo de entidad (ej. `categorias`) debe contener:
- `[singular].ts`: Define la **Interfaz** (modelo de datos) y el **Servicio** HTTP en el mismo archivo.
- `[plural].ts, .html, .css`: El componente principal (tabla/vista). Debe ser **Standalone Component**. La clase no lleva el sufijo `Component`.
- `[singular]-dialog/`: Carpeta con el modal para crear/editar registros (`.ts`, `.html`, `.css`).

- ✅ **Auth**: Configurado en `app/auth/`.
- ✅ **Login**: Configurado en `app/login/`.
- ✅ **Categorías**: Configurado en `app/categorias/`.
- ✅ **Usuarios**: Configurado en `app/usuarios/` (API `/api/usuarios`).
- ✅ **Gastos**: Configurado en `app/gastos/` (API `/api/gastos`).
- ✅ **Inventario**: Configurado en `app/inventario/` (API `/api/inventario`).
- ✅ **Sesiones Trabajo**: Configurado en `app/sesiones-trabajo/` (API `/api/sesiones-trabajo`).
- ✅ **Reportes**: Configurado en `app/reportes/` (API `/api/reportes`).
- 🟡 **Ventas (TPV)**: Migrado a `app/ventas/`, pero pendiente de limpieza/refactorización.
- 🟡 **Productos**: Servicio y Diálogo listos en `app/productos/`. Pendiente componente de lista (`productos.ts`).

## Pendientes Módulos Antiguos por Migrar

Los siguientes módulos del frontend todavía usan la estructura antigua o están en la ubicación incorrecta:

1. **Menú Principal**: Actualmente en `core/layout/main-layout.component.ts`. Falta extraer su HTML/CSS y moverlo a `app/menu-principal/`.
2. **Ventas (TPV)**: Actualmente en `features/ventas/venta.component.ts`. Falta moverlo a `app/ventas/ventas.ts` y separar sus archivos.
3. **Servicios de Producto y Venta**: Actualmente están en `core/services/`. Deben moverse a `app/productos/` y `app/ventas/` respectivamente con sus propios modelos e interfaces.

*Importante: `app.routes.ts` y los componentes viejos ya fueron actualizados para importar desde las nuevas ubicaciones (como `app/auth/auth`), por lo que el proyecto compila correctamente en su estado actual.*

## Módulos y Tareas Pendientes

1. **Productos** (`/api/productos`): Crear tabla principal en `app/productos/productos.ts`.
2. **Sueldos** (`/api/sueldos-pagados`): Pendiente creación.
3. **Subcat. Gasto** (`/api/subcategorias-gasto`): Pendiente integración en módulo de gastos.
4. **Menú Principal**: Extraer de `app/layout/layout.ts` y mover a `app/menu-principal/`.

### Notas sobre los Módulos Futuros
- `VentaRequest`: Se actualizó el envío para que solo solicite `{ sesionId, metodoPagoId, descuento, detalles }` según el backend.
- Cuando crees los módulos pendientes, consulta los DTOs en `src/main/java/com/chancla/chancla_lite_auth/dto/` dentro de tu proyecto backend para definir las interfaces correspondientes.
