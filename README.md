# Sistema de tickets

Base Next.js para integrar SIAM, un sistema de solicitudes academicas de alta, baja y cambio de materias. Este workspace incluye el esquema PostgreSQL del repositorio [SIAM](https://github.com/tr1p-alosky/SIAM).

## Requisitos

- Node.js compatible con Next.js 16
- PostgreSQL 15 o 16

## Desarrollo

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

En `.env`, sustituye `YOUR_PASSWORD` por la contrasena de tu instancia PostgreSQL. Crea la base de datos `siam_db` y ejecuta el esquema:

```powershell
psql -U postgres -d postgres -c "CREATE DATABASE siam_db;"
npm run db:setup
```

Genera Prisma Client después de instalar dependencias o cambiar `prisma/schema.prisma`:

```powershell
npm run db:generate
npm run db:studio
```

`npm run db:setup` aplica las 12 tablas, tipos enum e índices de `tablas.sql` usando `DATABASE_URL` de `.env`; se puede volver a ejecutar sin recrear objetos existentes. El script conserva el índice único parcial para tickets activos que no está representado en el schema Prisma. `tablas.sql` es la fuente de verdad para crear el esquema; no ejecutes `prisma db push` sobre esta base.

## Interfaz

La configuración de shadcn/ui está en `components.json`, preparada para Tailwind CSS 4. El primer componente disponible es `@/components/ui/button`; instala otros con `npx shadcn@latest add <componente>`.

## Clientes de servicios

`@/lib/prisma` exporta el cliente Prisma reutilizable para consultas PostgreSQL del lado del servidor. `@/lib/supabase` exporta `getSupabaseClient()` para acceder a Supabase Storage desde código de servidor. Configura `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env`; la clave de servicio es secreta y no debe usarse desde componentes cliente.

El esquema crea 12 tablas, tipos enum e indices para filtrar tickets, consultar el historial por alumno y evitar tickets activos duplicados de ingles en un mismo periodo.

## Estado de la integracion

SIAM aportaba el esquema SQL y notas de preparacion. Sus archivos `sistema`, `componente`, `LIB.placeholder` y `Prisma.placeholder` solo contienen comentarios de marcador; la autenticacion y las interfaces de negocio siguen pendientes de implementacion.
