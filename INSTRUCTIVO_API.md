# INSTRUCTIVO_API.md - Guía de Integración Backend / Frontend

> Este instructivo detalla el funcionamiento de cada endpoint desarrollado en el apartado backend (Alan Martín), la utilidad de sus funciones, la convención de variables en **`kebab-case`** y los formatos de petición/respuesta para facilitar la conexión desde el frontend.

---

## 📌 Regla General de Nombres (Naming Convention)

Todos los nombres de propiedades en los objetos JSON de petición (`request body`), parámetros de consulta (`query params`) y parámetros de ruta (`path params`) se manejan en **`kebab-case`**.

---

## 🔐 0. API de Autenticación y Verificación de Credenciales (Sprint 3 / 2.2.1)

### 0.1 Iniciar Sesión / Verificación contra Base de Datos
- **Endpoint**: `POST /api/auth/login`
- **Propósito**: Valida las credenciales de un usuario (Correo Institucional o Matrícula/Expediente + Contraseña) contra la base de datos PostgreSQL usando `bcryptjs`.
- **Cuerpo de la Petición (`Request Body`)**:

```json
{
  "correo-institucional": "coordinacion.seed@siam.local",
  "contrasena-usuario": "PasswordSeguro1234"
}
```
> Nota: También se puede enviar `"expediente-alumno": "SEEDCOORD001"` en lugar de `"correo-institucional"`.

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "mensaje": "Inicio de sesión exitoso",
  "token-acceso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "datos-usuario": {
    "usuario-id": "cf40eb4f-a2b7-4e60-8334-db3844f6b67a",
    "expediente-alumno": "SEEDCOORD001",
    "correo-institucional": "coordinacion.seed@siam.local",
    "nombre-completo": "Coordinación de Prueba",
    "rol-usuario": "COORDINADOR",
    "es-2fa-activo": false
  }
}
```
> Además, se genera y envía automáticamente la cookie `siam_token` (`httpOnly`) para mantener la sesión autenticada en el cliente web.

---

## 📑 1. API de Materias (`2.3.1`)

### 1.1 Obtener Catálogo de Materias
- **Endpoint**: `GET /api/materias`
- **Propósito**: Devuelve la lista de materias registradas para llenar el menú desplegable del formulario del alumno.
- **Parámetros de Consulta (Query Params)**:
  - `carrera-id` (opcional, entero): Filtra materias asociadas a una carrera específica.
  - `semestre-numero` (opcional, entero): Filtra materias por número de semestre (1 a 10).
  - `categoria-materia` (opcional, string): `CURRICULAR`, `INGLES`, `EXTRACURRICULAR`.

#### Ejemplo de Petición (Frontend):
```javascript
// GET /api/materias?carrera-id=1&semestre-numero=2
const response = await fetch('/api/materias?carrera-id=1&semestre-numero=2', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "total-registros": 2,
  "datos-materias": [
    {
      "materia-id": 1,
      "clave-materia": "MAT-101",
      "nombre-materia": "Matemáticas I",
      "creditos-materia": 8,
      "semestre-numero": 1,
      "categoria-materia": "CURRICULAR",
      "carrera-nombre": "Ingeniería en Informática",
      "carrera-clave": "IINF"
    },
    {
      "materia-id": 3,
      "clave-materia": "ING-101",
      "nombre-materia": "Inglés I",
      "creditos-materia": 4,
      "semestre-numero": 1,
      "categoria-materia": "INGLES",
      "carrera-nombre": "Ingeniería en Informática",
      "carrera-clave": "IINF"
    }
  ]
}
```

---

## 📩 2. API de Solicitudes / Tickets (`2.3.2` / Sprint 3)

### 2.1 Crear Nueva Solicitud (Ticket)
- **Endpoint**: `POST /api/tickets`
- **Propósito**: Recibe los datos capturados en el formulario del alumno y registra un nuevo ticket de trámite académico.
- **Cuerpo de la Petición (`Request Body`)**:

```json
{
  "materia-id": 2,
  "grupo-materia-id": 2,
  "tipo-tramite": "ALTA",
  "motivo-justificacion": "Requiero dar de alta la materia por traslape de horario en el grupo anterior.",
  "archivos-adjuntos": [
    {
      "nombre-archivo": "kardex_actual.pdf",
      "url-archivo": "https://storage.uaq.mx/adjuntos/kardex_123.pdf",
      "tipo-documento": "KARDEX"
    },
    {
      "nombre-archivo": "ine_oficial.pdf",
      "url-archivo": "https://storage.uaq.mx/adjuntos/ine_123.pdf",
      "tipo-documento": "IDENTIFICACION"
    }
  ]
}
```

#### Respuesta Exitosa (`201 Created`):
```json
{
  "estatus": "exito",
  "mensaje": "Solicitud creada correctamente",
  "datos-ticket": {
    "ticket-id": "e71ac10b-58cc-4372-a567-0e02b2c3d4e8",
    "folio-ticket": "TCK-2026-0001",
    "tipo-tramite": "ALTA",
    "estado-ticket": "CREADO",
    "fecha-creacion": "2026-10-06T10:15:00.000Z"
  }
}
```

---

### 2.2 Consultar Mis Solicitudes (Panel de Estudiante)
- **Endpoint**: `GET /api/tickets/mis-solicitudes`
- **Propósito**: Devuelve las solicitudes pertenecientes al alumno que tiene la sesión iniciada.
- **Parámetros de Consulta (Query Params)**:
  - `estado-ticket` (opcional): `CREADO`, `EN_REVISION_COORDINACION`, `APROBADO_ADMIN`, `RECHAZADO`, `CERRADO`.

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "total-solicitudes": 1,
  "lista-solicitudes": [
    {
      "ticket-id": "e71ac10b-58cc-4372-a567-0e02b2c3d4e8",
      "folio-ticket": "TCK-2026-0001",
      "tipo-tramite": "ALTA",
      "estado-ticket": "CREADO",
      "categoria-materia": "CURRICULAR",
      "motivo-justificacion": "Requiero dar de alta...",
      "fecha-creacion": "2026-10-06T10:15:00.000Z",
      "materia-nombre": "Programación II",
      "materia-clave": "PROG-201",
      "grupo-clave": "A",
      "archivos-adjuntos": [
        {
          "adjunto-id": 1,
          "nombre-archivo": "kardex_actual.pdf",
          "url-archivo": "https://storage.uaq.mx/adjuntos/kardex_123.pdf"
        }
      ]
    }
  ]
}
```

---

### 2.3 Consultar Bandeja de Pendientes (Panel de Coordinador)
- **Endpoint**: `GET /api/tickets/pendientes`
- **Propósito**: Retorna todas las solicitudes en estado `CREADO` o `EN_REVISION_COORDINACION` para que el coordinador las gestione.
- **Parámetros de Consulta (Query Params)**:
  - `busqueda-texto` (opcional): Filtra por nombre o expediente del alumno o nombre de materia.
  - `categoria-materia` (opcional): `CURRICULAR`, `INGLES`, `EXTRACURRICULAR`.

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "total-pendientes": 1,
  "bandeja-pendientes": [
    {
      "ticket-id": "e71ac10b-58cc-4372-a567-0e02b2c3d4e8",
      "folio-ticket": "TCK-2026-0001",
      "expediente-alumno": "SEEDALU001",
      "nombre-alumno": "Alumno de Prueba Uno",
      "correo-alumno": "alumno1.seed@siam.local",
      "nombre-materia": "Programación II",
      "materia-clave": "PROG-201",
      "tipo-tramite": "ALTA",
      "estado-ticket": "CREADO",
      "motivo-justificacion": "Requiero dar de alta...",
      "fecha-creacion": "2026-10-06T10:15:00.000Z",
      "archivos-adjuntos": [
        {
          "adjunto-id": 1,
          "nombre-archivo": "kardex_actual.pdf",
          "url-archivo": "https://storage.uaq.mx/adjuntos/kardex_123.pdf"
        }
      ]
    }
  ]
}
```

---

### 2.4 Consulta General de Trámites con Datos de Estudiante / JOIN (Sprint 3)
- **Endpoint**: `GET /api/tickets`
- **Propósito**: Consulta general de todos los trámites registrados en el sistema, integrando datos del alumno (nombre, expediente, carrera, semestre), materia y periodo (sólo rol COORDINADOR o ADMINISTRADOR).
- **Parámetros de Consulta (Query Params)**:
  - `estado-ticket` (opcional): Filtra por estado (`CREADO`, `EN_REVISION_COORDINACION`, `APROBADO_ADMIN`, `RECHAZADO`, `CERRADO`).
  - `categoria-materia` (opcional): `CURRICULAR`, `INGLES`, `EXTRACURRICULAR`.
  - `tipo-tramite` (opcional): `ALTA`, `BAJA`, `CAMBIO`.
  - `expediente-alumno` (opcional): Filtra por matrícula o expediente específico.
  - `busqueda-texto` (opcional): Búsqueda libre en nombre de estudiante, expediente o nombre de materia.

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "total-tramites": 1,
  "datos-tramites": [
    {
      "ticket-id": "e71ac10b-58cc-4372-a567-0e02b2c3d4e8",
      "folio-ticket": "TCK-2026-0001",
      "tipo-tramite": "ALTA",
      "estado-ticket": "CREADO",
      "categoria-materia": "CURRICULAR",
      "motivo-justificacion": "Solicitud de alta de materia...",
      "fecha-creacion": "2026-10-06T10:15:00.000Z",
      "fecha-actualizacion": "2026-10-06T10:15:00.000Z",
      "periodo-nombre": "2026-2 - Periodo curricular de prueba",
      "alumno-id": "00cac7bb-1e03-4c91-8838-4f4d67e47be6",
      "expediente-alumno": "SEEDALU001",
      "nombre-alumno": "Alumno de Prueba Uno",
      "correo-alumno": "alumno1.seed@siam.local",
      "telefono-alumno": null,
      "carrera-alumno": "Ingeniería en Informática",
      "semestre-alumno": 2,
      "materia-id": 2,
      "materia-clave": "PROG-201",
      "materia-nombre": "Programación II",
      "grupo-destino-clave": "A",
      "grupo-origen-clave": null,
      "archivos-adjuntos": [
        {
          "adjunto-id": 1,
          "nombre-archivo": "kardex_actual.pdf",
          "url-archivo": "https://storage.uaq.mx/adjuntos/kardex_123.pdf",
          "subido-en": "2026-10-06T10:15:00.000Z"
        }
      ]
    }
  ]
}
```

---

## 🏛️ 3. API de Gestión Administrativa (`2.3.3` / Sprint 3)

### 3.1 Aprobar o Rechazar Solicitud
- **Endpoint**: `PATCH /api/tickets/[ticket-id]/gestion`
- **Propósito**: Cambia el estado del ticket (`APROBADO_ADMIN`, `RECHAZADO`, `CERRADO`), registra las observaciones del coordinador y genera automáticamente un registro inmutable en la bitácora de auditoría (`bitacora_auditoria`) y en los mensajes del ticket.
- **Parámetro de Ruta (`Path Param`)**: `ticket-id` (UUID del ticket).
- **Cuerpo de la Petición (`Request Body`)**:

```json
{
  "accion-resolucion": "APROBAR",
  "observacion-coordinador": "Solicitud aprobada conforme a revisión de kardex y cupo disponible."
}
```

> Nota: `accion-resolucion` acepta `"APROBAR"`, `"RECHAZAR"` o `"CERRAR"`.

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "mensaje": "La solicitud ha sido aprobada correctamente",
  "ticket-actualizado": {
    "ticket-id": "e71ac10b-58cc-4372-a567-0e02b2c3d4e8",
    "folio-ticket": "TCK-2026-0001",
    "estado-anterior": "CREADO",
    "nuevo-estado": "APROBADO_ADMIN",
    "observacion-coordinador": "Solicitud aprobada conforme a revisión de kardex y cupo disponible.",
    "fecha-actualizacion": "2026-10-06T10:20:00.000Z"
  }
}
```

---

## ⚠️ Códigos de Respuesta HTTP y Errores Estándar

| Código | Significado | Estructura de Respuesta |
|---|---|---|
| `200` | Operación exitosa | `{"estatus": "exito", ...}` |
| `201` | Recurso creado exitosamente | `{"estatus": "exito", "mensaje": "...", ...}` |
| `400` | Petición incorrecta o validación fallida | `{"estatus": "error", "mensaje": "Detalle del error", "errores-validacion": [...]}` |
| `401` | No autenticado (Sesión no válida o expirada) | `{"estatus": "error", "mensaje": "Debe iniciar sesión para acceder a esta API"}` |
| `403` | Prohibido (Rol no autorizado) | `{"estatus": "error", "mensaje": "No posee permisos para realizar esta acción"}` |
| `404` | Recurso no encontrado | `{"estatus": "error", "mensaje": "No se encontró la solicitud especificada"}` |
| `500` | Error interno del servidor | `{"estatus": "error", "mensaje": "Ocurrió un error inesperado en el servidor"}` |
