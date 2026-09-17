====================================================================
 GUÍA COMPLETA: INSTALACIÓN DESDE CERO Y CONFIGURACIÓN DE BD (SIAM)
====================================================================

Si no tienes PostgreSQL instalado en tu máquina o nunca has levantado 
la base de datos, sigue esta guía ordenada paso a paso.

--------------------------------------------------------------------
PASO 1: INSTALACIÓN DE POSTGRESQL (Si ya lo tienes, salta al Paso 2)
--------------------------------------------------------------------
Tienes dos formas de instalarlo. Elige la que prefieras:

OPCIÓN A: Instalador tradicional de Windows
1. Ve a: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Descarga la versión de PostgreSQL para Windows (v15 o v16 recomendada).
3. Ejecuta el instalador (.exe) y da click en "Next".
4. IMPORTANTE: En la pantalla donde te pide una contraseña para el 
   superusuario "postgres", pon una contraseña que NO se te olvide 
   (ejemplo: admin123 o uaq2026).
5. Deja el puerto por defecto: 5432.
6. Finaliza la instalación.

OPCIÓN B: Vía Docker (Si usas Docker Desktop)
Corre este comando en tu terminal de comandos (CMD / PowerShell):
docker run --name db-siam -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin123 -e POSTGRES_DB=postgres -p 5432:5432 -d postgres:16-alpine


--------------------------------------------------------------------
PASO 2: PREPARAR EL ARCHIVO LOCAL .env
--------------------------------------------------------------------
El archivo .env.example es solo un molde público. Necesitas tu propio .env privado:

1. En la raíz de la carpeta del proyecto, ejecuta en la terminal:
   (En Windows PowerShell):
   Copy-Item .env.example .env
   
   (O en CMD / Git Bash):
   cp .env.example .env

2. Abre el archivo .env que se acaba de crear y cambia "tu_password_aqui" 
   por la contraseña que le asignaste al instalar PostgreSQL.
   Ejemplo:
   DATABASE_URL="postgresql://postgres:admin123@localhost:5432/siam_db?schema=public"

3. Guarda los cambios. (El archivo .env se queda en tu máquina local).


--------------------------------------------------------------------
PASO 3: CREAR LA BASE DE DATOS Y CORRER EL SCRIPT (VÍA COMANDOS)
--------------------------------------------------------------------
Puedes hacerlo todo mediante la terminal sin usar interfaces gráficas:

1. Abre "SQL Shell (psql)" desde el menú inicio o ejecuta en tu terminal:
   psql -U postgres

2. Presiona [ENTER] en los campos por defecto e ingresa tu contraseña.
   Verás el prompt: postgres=#

3. Crea la base de datos del proyecto ejecutando:
   CREATE DATABASE siam_db;

4. Conéctate a ella:
   \c siam_db

   (El prompt cambiará a: siam_db=#)

5. Cargar todas las tablas e índices automáticamente:
   Ejecuta el comando \i indicando la ruta donde tienes el archivo "tablas.sql":
   
   \i 'tablas.sql'
   
   (Nota: Si la terminal no encuentra el archivo directamente, puedes 
   arrastrar el archivo tablas.sql adentro de la ventana de psql o abrir 
   tablas.sql con Bloc de Notas, copiar todo el texto y pegarlo ahí mismo).


--------------------------------------------------------------------
PASO 4: VERIFICACIÓN
--------------------------------------------------------------------
1. Para verificar que las 12 tablas se construyeron con éxito, escribe:
   \dt

2. Para inspeccionar los índices creados en tickets:
   \d tickets

--------------------------------------------------------------------
NOTAS TÉCNICAS: ÍNDICES Y REGLAS DE NEGOCIO EN LA BD
--------------------------------------------------------------------
El script tablas.sql aplica reglas clave del documento de requerimientos:

1. indice_unico_ticket_ingles_activo:
   - Aplica el RF04: un alumno no puede tener más de un ticket activo[cite: 1]
     de inglés en el mismo periodo[cite: 1].
   - Al ser condicional (WHERE), le permite volver a crear otro solo si 
     el anterior fue RECHAZADO o CERRADO[cite: 1].

2. idx_tickets_filtros:
   - Optimiza las consultas del panel de administración (RF11)[cite: 1].
   - Indexa (estado, categoria, periodo_id) para filtrar miles de tickets 
     en milisegundos sin tirar el servidor en horas pico[cite: 1].

3. idx_tickets_alumno:
   - Hace instantáneo el despliegue del historial propio del alumno 
     al loguearse.

4. idx_materias_carrera_semestre:
   - Agiliza la búsqueda y carga del catálogo de asignaturas en los 
     selects de los formularios.

====================================================================
