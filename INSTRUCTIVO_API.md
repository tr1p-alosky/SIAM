# INSTRUCTIVO_API.md - Guía de Integración Backend / Frontend

> Este instructivo detalla el funcionamiento de cada endpoint desarrollado en el apartado backend (Alan Martín), la utilidad de sus funciones, la convención de variables en **`kebab-case`** y los formatos de petición/respuesta para facilitar la conexión desde el frontend.

---

## 📌 Regla General de Nombres (Naming Convention)

Todos los nombres de propiedades en los objetos JSON de petición (`request body`), parámetros de consulta (`query params`) y parámetros de ruta (`path params`) se manejan en **`kebab-case`**.

---

## 📑 1. API de Materias (`2.3.1`)

### 1.1 Obtener Catálogo de Materias
- **Endpoint**: `GET /api/materias`
- **Propósito**: Devuelve la lista de materias registradas para llenar el menú desplegable del formulario del alumno.
- **Parámetros de Consulta (Query Params)**:
  - `carrera-id` (opcional, string UUID): Filtra materias asociadas a una carrera específica.
  - `semestre-numero` (opcional, entero): Filtra materias por número de semestre (1 a 10).
  - `categoria-materia` (opcional, string): `CURRICULAR`, `INGLES`, `EXTRACURRICULAR`.

#### Ejemplo de Petición (Frontend):
```javascript
// GET /api/materias?carrera-id=a1b2c3d4-e5f6-7890-1234-56789abcdef0&semestre-numero=3
const response = await fetch('/api/materias?carrera-id=...&semestre-numero=3');
const data = await response.json();
```

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "total-registros": 2,
  "datos-materias": [
    {
      "materia-id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
      "clave-materia": "MAT-101",
      "nombre-materia": "Cálculo Diferencial",
      "creditos-materia": 8,
      "semestre-numero": 3,
      "categoria-materia": "CURRICULAR"
    },
    {
      "materia-id": "b81ac10b-58cc-4372-a567-0e02b2c3d4e6",
      "clave-materia": "ING-201",
      "nombre-materia": "Inglés Comercial III",
      "creditos-materia": 4,
      "semestre-numero": 3,
      "categoria-materia": "INGLES"
    }
  ]
}
```

---

## 📩 2. API de Solicitudes / Tickets (`2.3.2`)

### 2.1 Crear Nueva Solicitud (Ticket)
- **Endpoint**: `POST /api/tickets`
- **Propósito**: Recibe los datos capturados en el formulario del alumno y registra un nuevo ticket de trámite académico.
- **Cuerpo de la Petición (`Request Body`)**:

```json
{
  "materia-id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
  "grupo-materia-id": "c92ac10b-58cc-4372-a567-0e02b2c3d4e7",
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
  "mensaje": "Ticket creado correctamente",
  "datos-ticket": {
    "ticket-id": "e71ac10b-58cc-4372-a567-0e02b2c3d4e8",
    "folio-ticket": "TCK-2026-0001",
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
      "nombre-materia": "Cálculo Diferencial",
      "motivo-justificacion": "Requiero dar de alta...",
      "fecha-creacion": "2026-10-06T10:15:00.000Z"
    }
  ]
}
```

---

### 2.3 Consultar Bandeja de Pendientes (Panel de Coordinador)
- **Endpoint**: `GET /api/tickets/pendientes`
- **Propósito**: Retorna todas las solicitudes en estado `CREADO` o `EN_REVISION_COORDINACION` para que el coordinador las gestione.
- **Parámetros de Consulta (Query Params)**:
  - `busqueda-texto` (opcional): Filtra por nombre o expediente del alumno.
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
      "expediente-alumno": "295100",
      "nombre-alumno": "Alan Martín",
      "nombre-materia": "Cálculo Diferencial",
      "tipo-tramite": "ALTA",
      "estado-ticket": "EN_REVISION_COORDINACION",
      "archivos-adjuntos": [
        {
          "nombre-archivo": "kardex_actual.pdf",
          "url-archivo": "https://storage.uaq.mx/adjuntos/kardex_123.pdf"
        }
      ]
    }
  ]
}
```

---

## 🏛️ 3. API de Gestión Administrativa (`2.3.3`)

### 3.1 Aprobar o Rechazar Solicitud
- **Endpoint**: `PATCH /api/tickets/[ticket-id]/gestion`
- **Propósito**: Cambia el estado del ticket (Aprobar / Rechazar) y registra las observaciones del coordinador.
- **Parámetro de Ruta (`Path Param`)**: `ticket-id` (UUID del ticket).
- **Cuerpo de la Petición (`Request Body`)**:

```json
{
  "accion-resolucion": "RECHAZAR",
  "observacion-coordinador": "El cupo en el grupo seleccionado se encuentra completo para este periodo."
}
```

> Nota: `accion-resolucion` acepta `"APROBAR"` o `"RECHAZAR"`.

#### Respuesta Exitosa (`200 OK`):
```json
{
  "estatus": "exito",
  "mensaje": "La solicitud fue procesada correctamente",
  "ticket-actualizado": {
    "ticket-id": "e71ac10b-58cc-4372-a567-0e02b2c3d4e8",
    "estado-anterior": "EN_REVISION_COORDINACION",
    "nuevo-estado": "RECHAZADO",
    "observacion-coordinador": "El cupo en el grupo seleccionado...",
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
| `401` | No autenticado (Sesión no válida) | `{"estatus": "error", "mensaje": "Debe iniciar sesión para continuar"}` |
| `403` | Prohibido (Rol no autorizado) | `{"estatus": "error", "mensaje": "No posee permisos para realizar esta acción"}` |
| `404` | Recurso no encontrado | `{"estatus": "error", "mensaje": "El ticket o recurso no existe"}` |
| `500` | Error interno del servidor | `{"estatus": "error", "mensaje": "Ocurrió un error inesperado en el servidor"}` |
