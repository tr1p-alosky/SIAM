import {
  CategoriaMateria,
  EstadoTicket,
  PrismaClient,
  RolUsuario,
  TipoTramite,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const seedTickets = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
];

async function main() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;

  if (
    !demoPassword ||
    demoPassword.length < 12 ||
    demoPassword === "REPLACE_LOCALLY_WITH_AT_LEAST_12_CHARACTERS"
  ) {
    throw new Error("Set SEED_DEMO_PASSWORD to a value with at least 12 characters in .env.");
  }

  const passwordHash = await bcrypt.hash(demoPassword, 12);

  await prisma.$transaction(async (tx) => {
    const carrera = await tx.carrera.upsert({
      where: { clave: "IINF" },
      update: { nombre: "Ingeniería en Informática" },
      create: { clave: "IINF", nombre: "Ingeniería en Informática" },
    });

    const coordinador = await tx.usuario.upsert({
      where: { correo: "coordinacion.seed@siam.local" },
      update: {
        expediente: "SEEDCOORD001",
        contrasenaHash: passwordHash,
        nombreCompleto: "Coordinación de Prueba",
        rol: RolUsuario.COORDINADOR,
      },
      create: {
        expediente: "SEEDCOORD001",
        correo: "coordinacion.seed@siam.local",
        contrasenaHash: passwordHash,
        nombreCompleto: "Coordinación de Prueba",
        rol: RolUsuario.COORDINADOR,
      },
    });

    const alumnos = await Promise.all([
      tx.usuario.upsert({
        where: { correo: "alumno1.seed@siam.local" },
        update: {
          expediente: "SEEDALU001",
          contrasenaHash: passwordHash,
          nombreCompleto: "Alumno de Prueba Uno",
          rol: RolUsuario.ALUMNO,
        },
        create: {
          expediente: "SEEDALU001",
          correo: "alumno1.seed@siam.local",
          contrasenaHash: passwordHash,
          nombreCompleto: "Alumno de Prueba Uno",
          rol: RolUsuario.ALUMNO,
        },
      }),
      tx.usuario.upsert({
        where: { correo: "alumno2.seed@siam.local" },
        update: {
          expediente: "SEEDALU002",
          contrasenaHash: passwordHash,
          nombreCompleto: "Alumno de Prueba Dos",
          rol: RolUsuario.ALUMNO,
        },
        create: {
          expediente: "SEEDALU002",
          correo: "alumno2.seed@siam.local",
          contrasenaHash: passwordHash,
          nombreCompleto: "Alumno de Prueba Dos",
          rol: RolUsuario.ALUMNO,
        },
      }),
    ]);

    for (const [index, alumno] of alumnos.entries()) {
      await tx.informacionAcademicaAlumno.upsert({
        where: { alumnoId: alumno.id },
        update: {
          carreraId: carrera.id,
          semestreActual: index === 0 ? 2 : 1,
          creditosTotales: index === 0 ? 48 : 24,
          creditosFaltantes: index === 0 ? 192 : 216,
        },
        create: {
          alumnoId: alumno.id,
          carreraId: carrera.id,
          semestreActual: index === 0 ? 2 : 1,
          creditosTotales: index === 0 ? 48 : 24,
          creditosFaltantes: index === 0 ? 192 : 216,
        },
      });
    }

    const materias = await Promise.all([
      tx.materia.upsert({
        where: { clave: "MAT-101" },
        update: {
          carreraId: carrera.id,
          nombre: "Matemáticas I",
          semestre: 1,
          categoria: CategoriaMateria.CURRICULAR,
        },
        create: {
          clave: "MAT-101",
          carreraId: carrera.id,
          nombre: "Matemáticas I",
          semestre: 1,
          categoria: CategoriaMateria.CURRICULAR,
        },
      }),
      tx.materia.upsert({
        where: { clave: "PROG-201" },
        update: {
          carreraId: carrera.id,
          nombre: "Programación II",
          semestre: 2,
          categoria: CategoriaMateria.CURRICULAR,
        },
        create: {
          clave: "PROG-201",
          carreraId: carrera.id,
          nombre: "Programación II",
          semestre: 2,
          categoria: CategoriaMateria.CURRICULAR,
        },
      }),
      tx.materia.upsert({
        where: { clave: "ING-101" },
        update: {
          carreraId: carrera.id,
          nombre: "Inglés I",
          semestre: 1,
          categoria: CategoriaMateria.INGLES,
        },
        create: {
          clave: "ING-101",
          carreraId: carrera.id,
          nombre: "Inglés I",
          semestre: 1,
          categoria: CategoriaMateria.INGLES,
        },
      }),
    ]);

    const grupos = await Promise.all(
      materias.map(async (materia, index) => {
        const claveGrupo = index === 2 ? "ING-A" : "A";
        const grupoExistente = await tx.grupoMateria.findFirst({
          where: { materiaId: materia.id, claveGrupo },
        });
        const datosGrupo = {
          cupoMaximo: 30,
          cupoActual: index === 2 ? 12 : 18,
          permiteSobrecupo: false,
          detallesHorario: index === 0 ? "Lunes y miércoles 08:00-10:00" : "Martes y jueves 10:00-12:00",
        };

        if (grupoExistente) {
          return tx.grupoMateria.update({
            where: { id: grupoExistente.id },
            data: datosGrupo,
          });
        }

        return tx.grupoMateria.create({
          data: { materiaId: materia.id, claveGrupo, ...datosGrupo },
        });
      }),
    );

    const upsertPeriodo = async (nombre: string, categoria: CategoriaMateria) => {
      const periodoExistente = await tx.periodoAcademico.findFirst({
        where: { nombre, categoria },
      });
      const datosPeriodo = {
        fechaInicio: new Date("2026-08-01T00:00:00.000Z"),
        fechaFin: new Date("2026-12-20T00:00:00.000Z"),
        estaActivo: true,
      };

      return periodoExistente
        ? tx.periodoAcademico.update({
            where: { id: periodoExistente.id },
            data: datosPeriodo,
          })
        : tx.periodoAcademico.create({
            data: { nombre, categoria, ...datosPeriodo },
          });
    };
    const periodos = await Promise.all([
      upsertPeriodo("2026-2 - Periodo curricular de prueba", CategoriaMateria.CURRICULAR),
      upsertPeriodo("2026-2 - Periodo de inglés de prueba", CategoriaMateria.INGLES),
    ]);

    await tx.bitacoraAuditoria.deleteMany({ where: { ticketId: { in: seedTickets } } });
    await tx.mensajeTicket.deleteMany({ where: { ticketId: { in: seedTickets } } });
    await tx.detalleTicket.deleteMany({ where: { ticketId: { in: seedTickets } } });
    await tx.adjuntoTicket.deleteMany({ where: { ticketId: { in: seedTickets } } });

    const tickets = [
      {
        id: seedTickets[0],
        alumnoId: alumnos[0].id,
        materia: materias[1],
        periodoId: periodos[0].id,
        tipoTramite: TipoTramite.ALTA,
        categoria: CategoriaMateria.CURRICULAR,
        estado: EstadoTicket.CREADO,
        comentarios: "Solicitud semilla para probar el flujo de alta.",
        grupoOrigenId: null,
        grupoDestinoId: grupos[1].id,
      },
      {
        id: seedTickets[1],
        alumnoId: alumnos[1].id,
        materia: materias[2],
        periodoId: periodos[1].id,
        tipoTramite: TipoTramite.BAJA,
        categoria: CategoriaMateria.INGLES,
        estado: EstadoTicket.EN_REVISION_COORDINACION,
        comentarios: "Solicitud semilla para probar el flujo de baja de inglés.",
        grupoOrigenId: grupos[2].id,
        grupoDestinoId: null,
      },
    ];

    for (const ticketSeed of tickets) {
      const ticket = await tx.ticket.upsert({
        where: { id: ticketSeed.id },
        update: {
          alumnoId: ticketSeed.alumnoId,
          periodoId: ticketSeed.periodoId,
          tipoTramite: ticketSeed.tipoTramite,
          categoria: ticketSeed.categoria,
          estado: ticketSeed.estado,
          comentarios: ticketSeed.comentarios,
        },
        create: {
          id: ticketSeed.id,
          alumnoId: ticketSeed.alumnoId,
          periodoId: ticketSeed.periodoId,
          tipoTramite: ticketSeed.tipoTramite,
          categoria: ticketSeed.categoria,
          estado: ticketSeed.estado,
          comentarios: ticketSeed.comentarios,
        },
      });

      await tx.detalleTicket.create({
        data: {
          ticketId: ticket.id,
          materiaId: ticketSeed.materia.id,
          grupoOrigenId: ticketSeed.grupoOrigenId,
          grupoDestinoId: ticketSeed.grupoDestinoId,
        },
      });
    }

    console.info(`Seed listo: ${coordinador.correo}, ${alumnos.length} alumnos, ${tickets.length} tickets.`);
  });
}

main()
  .catch((error: unknown) => {
    console.error("Error al insertar datos semilla:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
