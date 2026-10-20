CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('ALUMNO', 'COORDINADOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "tipo_tramite" AS ENUM ('ALTA', 'BAJA', 'CAMBIO');

-- CreateEnum
CREATE TYPE "categoria_materia" AS ENUM ('CURRICULAR', 'INGLES', 'EXTRACURRICULAR');

-- CreateEnum
CREATE TYPE "estado_ticket" AS ENUM ('CREADO', 'EN_REVISION_COORDINACION', 'APROBADO_ADMIN', 'RECHAZADO', 'APLICADO_SISTEMA', 'CERRADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expediente" VARCHAR(20) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "rol" "rol_usuario" DEFAULT 'ALUMNO',
    "secreto_2fa" VARCHAR(100),
    "es_2fa_activo" BOOLEAN DEFAULT false,
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carreras" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "clave" VARCHAR(20) NOT NULL,

    CONSTRAINT "carreras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informacion_academica_alumnos" (
    "alumno_id" UUID NOT NULL,
    "carrera_id" INTEGER NOT NULL,
    "semestre_actual" INTEGER NOT NULL,
    "creditos_totales" INTEGER DEFAULT 0,
    "creditos_faltantes" INTEGER DEFAULT 0,

    CONSTRAINT "informacion_academica_alumnos_pkey" PRIMARY KEY ("alumno_id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "carrera_id" INTEGER,
    "clave" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "semestre" INTEGER NOT NULL,
    "categoria" "categoria_materia" DEFAULT 'CURRICULAR',
    "prerrequisito_id" INTEGER,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_materia" (
    "id" SERIAL NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "clave_grupo" VARCHAR(10) NOT NULL,
    "cupo_maximo" INTEGER NOT NULL,
    "cupo_actual" INTEGER DEFAULT 0,
    "permite_sobrecupo" BOOLEAN DEFAULT false,
    "detalles_horario" TEXT,

    CONSTRAINT "grupos_materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_academicos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "categoria" "categoria_materia" NOT NULL,
    "esta_activo" BOOLEAN DEFAULT true,

    CONSTRAINT "periodos_academicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "folio" SERIAL NOT NULL,
    "alumno_id" UUID NOT NULL,
    "periodo_id" INTEGER NOT NULL,
    "tipo_tramite" "tipo_tramite" NOT NULL,
    "categoria" "categoria_materia" DEFAULT 'CURRICULAR',
    "estado" "estado_ticket" DEFAULT 'CREADO',
    "comentarios" TEXT,
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_tickets" (
    "id" SERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "grupo_origen_id" INTEGER,
    "grupo_destino_id" INTEGER,
    "esta_aprobado" BOOLEAN DEFAULT false,

    CONSTRAINT "detalle_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjuntos_ticket" (
    "id" SERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "url_archivo" TEXT NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "subido_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjuntos_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_ticket" (
    "id" SERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "remitente_id" UUID NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enviado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora_auditoria" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" UUID,
    "realizado_por" UUID NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "estado_anterior" VARCHAR(50),
    "estado_nuevo" VARCHAR(50),
    "descripcion" TEXT,
    "direccion_ip" VARCHAR(45),
    "fecha_hora" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners_anuncios" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150),
    "url_imagen" TEXT NOT NULL,
    "url_destino" TEXT,
    "esta_activo" BOOLEAN DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_anuncios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_expediente_key" ON "usuarios"("expediente");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "carreras_clave_key" ON "carreras"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "materias_clave_key" ON "materias"("clave");

-- CreateIndex
CREATE INDEX "idx_materias_carrera_semestre" ON "materias"("carrera_id", "semestre");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_folio_key" ON "tickets"("folio");

-- CreateIndex
CREATE INDEX "idx_tickets_filtros" ON "tickets"("estado", "categoria", "periodo_id");

-- CreateIndex
CREATE INDEX "idx_tickets_alumno" ON "tickets"("alumno_id");

-- AddForeignKey
ALTER TABLE "informacion_academica_alumnos" ADD CONSTRAINT "informacion_academica_alumnos_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "informacion_academica_alumnos" ADD CONSTRAINT "informacion_academica_alumnos_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_prerrequisito_id_fkey" FOREIGN KEY ("prerrequisito_id") REFERENCES "materias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "grupos_materia" ADD CONSTRAINT "grupos_materia_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodos_academicos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_tickets" ADD CONSTRAINT "detalle_tickets_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_tickets" ADD CONSTRAINT "detalle_tickets_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_tickets" ADD CONSTRAINT "detalle_tickets_grupo_origen_id_fkey" FOREIGN KEY ("grupo_origen_id") REFERENCES "grupos_materia"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_tickets" ADD CONSTRAINT "detalle_tickets_grupo_destino_id_fkey" FOREIGN KEY ("grupo_destino_id") REFERENCES "grupos_materia"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "adjuntos_ticket" ADD CONSTRAINT "adjuntos_ticket_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mensajes_ticket" ADD CONSTRAINT "mensajes_ticket_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mensajes_ticket" ADD CONSTRAINT "mensajes_ticket_remitente_id_fkey" FOREIGN KEY ("remitente_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bitacora_auditoria" ADD CONSTRAINT "bitacora_auditoria_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bitacora_auditoria" ADD CONSTRAINT "bitacora_auditoria_realizado_por_fkey" FOREIGN KEY ("realizado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE UNIQUE INDEX "indice_unico_ticket_ingles_activo"
ON "tickets" ("alumno_id", "periodo_id")
WHERE "categoria" = 'INGLES' AND "estado" NOT IN ('RECHAZADO', 'CERRADO');
