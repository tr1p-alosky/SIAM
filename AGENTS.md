# AGENTS.md - Perfil y Directivas del Agente de Desarrollo (Módulo Alan Martín)

> Este documento define la configuración, responsabilidad, alcance técnico y prácticas de seguridad del Agente IA encargado del desarrollo del **Backend y Endpoints de la API (Sección 2.3)** para el proyecto **SIAM UAQ** (Sistema de Altas y Bajas de Materias).

---

## 🎯 Alcance y Responsabilidades (Sección 2.3 - Alan Martín)

El agente se enfoca exclusivamente en la implementación robusta, modular y segura de la capa de Backend y APIs de Next.js (`/app/api/...`), interactuando con la base de datos PostgreSQL mediante Prisma ORM.

### 1. 2.3.1 - API de Materias (`/api/materias`)
- **Consulta de Catálogo de Materias**: Endpoints para listar materias asignables por carrera y semestre.
- **Filtros Dinámicos**: Alimentación automática de menús desplegables en los formularios del panel de estudiante.

### 2. 2.3.2 - API de Solicitudes / Tickets (`/api/tickets`)
- **Creación de Tickets**: Recepción de solicitudes (tipo de trámite: ALTA, BAJA, CAMBIO), materia seleccionada, motivo de justificación y referencias a archivos adjuntos (Kardex e Identificación).
- **Bandeja Propia del Alumno**: Filtro automático para retornar únicamente los tickets creados por el alumno con sesión activa (usando NextAuth / JWT).
- **Bandeja de Entrada de Coordinación**: Consulta de solicitudes pendientes (`EN_REVISION_COORDINACION` / `CREADO`) destinadas a la interfaz del coordinador.

### 3. 2.3.3 - API de Gestión Administrativa (`/api/tickets/[ticket-id]/gestion`)
- **Acción de Resolución**: Transición de estado (`APROBADO_ADMIN`, `RECHAZADO`, `CERRADO`) cuando el coordinador procesa una solicitud.
- **Registro de Observaciones**: Guardado obligatorio del motivo de rechazo o nota de aprobación.
- **Trazabilidad y Auditoría**: Inserción automática de registros en la tabla `bitacora_auditoria` (quién ejecutó la acción, estado anterior, estado nuevo, IP y fecha/hora).

---

## 🛡️ Prácticas Seguras de Desarrollo (Security Best Practices)

1. **Autenticación y Autorización Basada en Roles (RBAC)**:
   - Verificación obligatoria del token de sesión en cada endpoint.
   - Protección estricta de rutas según el rol (`ALUMNO`, `COORDINADOR`, `ADMINISTRADOR`).
   - Los alumnos NO pueden acceder ni cambiar estados de tickets ajenos o realizar acciones administrativas.

2. **Validación Estricta de Entradas (Input Validation)**:
   - Todos los payload recibidos en los endpoints deben pasar por esquemas de validación de **Zod**.
   - Sanitización contra XSS y datos maliciosos en campos de texto (ej. motivos y observaciones).

3. **Prevención de Inyección SQL**:
   - Uso obligatorio de **Prisma ORM** con consultas preparadas/parametrizadas.
   - Prohibido construir consultas SQL mediante concatenación de cadenas.

4. **Protección de Datos Sensibles**:
   - Almacenamiento de contraseñas exclusivamente mediante **bcryptjs** (cost factor >= 10).
   - Soporte para verificación **2FA (TOTP)** usando `otplib` y `qrcode`.
   - Manejo de UUIDs para identificadores de usuarios y tickets (`dbgenerated("uuid_generate_v4()")`).

5. **Reglas de Negocio en Base de Datos**:
   - Cumplimiento estricto del índice condicional único `indice_unico_ticket_ingles_activo` (evitar que un alumno tenga más de un ticket activo de inglés en el mismo periodo).

---

## 🔤 Convención de Nombres (Naming Convention)

> **REGLA OBLIGATORIA**: Todos los parámetros de API, payloads JSON, campos de formularios y variables expuestas hacia el frontend deben usar **`kebab-case`**.

### Ejemplos de Variables y Parámetros en `kebab-case`:
- `materia-id`
- `carrera-id`
- `periodo-id`
- `tipo-tramite`
- `motivo-justificacion`
- `archivos-adjuntos`
- `estado-ticket`
- `observacion-coordinador`
- `expediente-alumno`
- `correo-institucional`
- `pagina-actual`
- `limite-por-pagina`

---

## 🛠️ Stack Tecnológico del Backend

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript 5.6+
- **ORM**: Prisma 5.20+
- **Base de Datos**: PostgreSQL 18
- **Autenticación**: NextAuth.js 4+ & bcryptjs
- **Validación**: Zod 3.23+
