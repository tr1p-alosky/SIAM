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

`@/lib/prisma` exporta el cliente Prisma reutilizable para consultas PostgreSQL del lado del servidor. `@/lib/supabase` exporta `getSupabaseAuthClient()` para validar sesiones, `getSupabaseClient()` para operaciones administrativas de Storage y `getSupabaseStorageBucket()` para acceder al bucket configurado. Los clientes se crean al usarse, no durante el build.

Para activar Supabase, copia los valores de **Project URL**, **anon/public key** y **service_role key** desde la configuración del proyecto a `.env`; conserva `SUPABASE_STORAGE_BUCKET` con el nombre exacto de un bucket creado en Storage (por defecto, `ticket-attachments`). Crea el bucket como privado para proteger documentos académicos. `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública; `SUPABASE_SERVICE_ROLE_KEY` es un secreto de servidor y nunca debe exponerse a componentes cliente ni subirse al repositorio. Sin estas credenciales la aplicación puede compilar, pero los endpoints autenticados responderán con error de configuración al recibir solicitudes.

El esquema crea 12 tablas, tipos enum e indices para filtrar tickets, consultar el historial por alumno y evitar tickets activos duplicados de ingles en un mismo periodo.

## Estado de la integracion

El login y el panel de coordinación incluidos actualmente son prototipos: el acceso de coordinación usa credenciales simuladas y el panel presenta datos locales que no modifican la base de datos. No usar en producción. Siguen pendientes la autenticación real y el middleware de roles, el panel de estudiante, la carga de documentos a Supabase Storage, el filtro de solicitudes y la resolución conectada a la API con observación obligatoria. Estos puntos corresponden a los requisitos de la interfaz del sistema.
