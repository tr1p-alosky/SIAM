CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE rol_usuario AS ENUM ('ALUMNO', 'COORDINADOR', 'ADMINISTRADOR');
CREATE TYPE tipo_tramite AS ENUM ('ALTA', 'BAJA', 'CAMBIO');
CREATE TYPE categoria_materia AS ENUM ('CURRICULAR', 'INGLES', 'EXTRACURRICULAR');
CREATE TYPE estado_ticket AS ENUM (
    'CREADO',
    'EN_REVISION_COORDINACION',
    'APROBADO_ADMIN',
    'RECHAZADO',
    'APLICADO_SISTEMA',
    'CERRADO'
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expediente VARCHAR(20) UNIQUE NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    rol rol_usuario DEFAULT 'ALUMNO',
    secreto_2fa VARCHAR(100),
    es_2fa_activo BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carreras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    clave VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE informacion_academica_alumnos (
    alumno_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    carrera_id INT NOT NULL REFERENCES carreras(id),
    semestre_actual INT NOT NULL,
    creditos_totales INT DEFAULT 0,
    creditos_faltantes INT DEFAULT 0
);

CREATE TABLE materias (
    id SERIAL PRIMARY KEY,
    carrera_id INT REFERENCES carreras(id) ON DELETE RESTRICT,
    clave VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    semestre INT NOT NULL,
    categoria categoria_materia DEFAULT 'CURRICULAR',
    prerrequisito_id INT REFERENCES materias(id)
);

CREATE TABLE grupos_materia (
    id SERIAL PRIMARY KEY,
    materia_id INT NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    clave_grupo VARCHAR(10) NOT NULL,
    cupo_maximo INT NOT NULL,
    cupo_actual INT DEFAULT 0,
    permite_sobrecupo BOOLEAN DEFAULT FALSE,
    detalles_horario TEXT
);

CREATE TABLE periodos_academicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    categoria categoria_materia NOT NULL,
    esta_activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio SERIAL UNIQUE,
    alumno_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    periodo_id INT NOT NULL REFERENCES periodos_academicos(id),
    tipo_tramite tipo_tramite NOT NULL,
    categoria categoria_materia DEFAULT 'CURRICULAR',
    estado estado_ticket DEFAULT 'CREADO',
    comentarios TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    materia_id INT NOT NULL REFERENCES materias(id),
    grupo_origen_id INT REFERENCES grupos_materia(id),
    grupo_destino_id INT REFERENCES grupos_materia(id),
    esta_aprobado BOOLEAN DEFAULT FALSE
);

CREATE TABLE adjuntos_ticket (
    id SERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    url_archivo TEXT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    subido_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mensajes_ticket (
    id SERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    remitente_id UUID NOT NULL REFERENCES usuarios(id),
    mensaje TEXT NOT NULL,
    enviado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bitacora_auditoria (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    realizado_por UUID NOT NULL REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    descripcion TEXT,
    direccion_ip VARCHAR(45),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banners_anuncios (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150),
    url_imagen TEXT NOT NULL,
    url_destino TEXT,
    esta_activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX indice_unico_ticket_ingles_activo 
ON tickets (alumno_id, periodo_id) 
WHERE categoria = 'INGLES' AND estado NOT IN ('RECHAZADO', 'CERRADO');

CREATE INDEX idx_tickets_filtros ON tickets(estado, categoria, periodo_id);
CREATE INDEX idx_tickets_alumno ON tickets(alumno_id);
CREATE INDEX idx_materias_carrera_semestre ON materias(carrera_id, semestre);
