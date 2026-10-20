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

## Guía de uso de base de datos y Prisma ORM

### Modelo y relaciones

`prisma/schema.prisma` modela las 12 tablas. `Usuario` se relaciona con `InformacionAcademicaAlumno` y `Carrera`; `Carrera` contiene `Materia`, y cada `Materia` tiene `GrupoMateria` y puede referenciar una materia prerrequisito. `Ticket` pertenece a un alumno y a un periodo, y agrupa `DetalleTicket`, `AdjuntoTicket`, `MensajeTicket` y `BitacoraAuditoria`. `BannerAnuncio` es independiente. Los nombres físicos de PostgreSQL se mantienen en snake_case mediante `@@map` y `@map`.

Ejemplo de consulta relacional para una bandeja de tickets:

```ts
const tickets = await prisma.ticket.findMany({
	where: { alumnoId },
	include: {
		periodo: true,
		detalles: {
			include: {
				materia: true,
				grupoDestino: true,
			},
		},
		adjuntos: true,
	},
});
```

Usa `select` para limitar campos sensibles y `include` para cargar relaciones. Agrupa escrituras que deban ser atómicas con `prisma.$transaction`; evita hacer `prisma db push`, porque `tablas.sql` y las migraciones conservan objetos PostgreSQL que el schema de Prisma no representa completamente.

### Datos de prueba

Define `SEED_DEMO_PASSWORD` en el `.env` local con una contraseña de al menos 12 caracteres. El seed la guarda con bcrypt (cost factor 12) para las cuentas de prueba `coordinacion.seed@siam.local`, `alumno1.seed@siam.local` y `alumno2.seed@siam.local`; la contraseña nunca se imprime ni se versiona. Ejecuta:

```powershell
npx prisma db seed
```

El seed es idempotente: crea o actualiza su carrera, materias, grupos, periodos y usuarios, y reemplaza solo dos tickets con UUIDs reservados para esos fixtures. No borra tablas, cuentas ajenas ni tickets reales. Para volver a ejecutar la prueba con una base vacía usa `npx prisma migrate reset`; **ese comando elimina todos los datos**, pide confirmación y vuelve a ejecutar el seed al final. No lo uses sobre datos que necesites conservar.

### Primera migración y cambios futuros

Esta base ya fue creada mediante `tablas.sql`. No ejecutes `npx prisma migrate dev` sobre ella antes de marcar la estructura existente como baseline, porque Prisma podría intentar crear otra vez las tablas. La carpeta `prisma/migrations` contiene el baseline y la migración del trigger. En una copia existente que ya tiene las 12 tablas e índice parcial, registra el baseline con:

```powershell
npx prisma migrate resolve --applied 20261020120000_baseline
npx prisma migrate dev
```

El primer comando solo registra la migración como aplicada; no ejecuta su DDL. El segundo aplica las migraciones pendientes, incluida la actualización automática de `tickets.actualizado_en`. Antes de baselinar otra instalación, compara su estructura e índice único con `tablas.sql`; no marques el baseline si esa base no tiene la misma estructura. Para una base nueva, usa `npx prisma migrate dev` sin ejecutar antes `npm run db:setup`.

La regla de un ticket activo de inglés por alumno y periodo se conserva como índice parcial SQL (`indice_unico_ticket_ingles_activo`), porque Prisma 6.19 no soporta declararla en `schema.prisma`. El trigger `trg_tickets_actualizado_en` se define en una migración SQL y actualiza `actualizado_en` en cada modificación del ticket.

### Operación del equipo

- `npm run db:generate`: regenera Prisma Client después de editar el schema.
- `npx prisma migrate dev --name nombre_del_cambio`: genera y aplica una migración nueva en desarrollo.
- `npx prisma migrate status`: muestra el estado de las migraciones.
- `npm run db:studio`: abre una interfaz para explorar datos; evita editar producción desde Studio.
- `npm run db:seed`: ejecuta los fixtures idempotentes.

Para una sesión técnica del equipo, revisar en este orden: recorrido de las 12 tablas y claves foráneas; consulta de tickets con `include`/`select`; transacción para crear ticket, detalle y adjuntos; migraciones y objetos SQL manuales; seed y verificación del índice parcial/trigger. La lectura de documentación y la guía no sustituyen una sesión impartida ni pruebas en cada entorno.
