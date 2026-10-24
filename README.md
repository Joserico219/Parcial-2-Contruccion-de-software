# Plataforma de cursos

Este proyecto usa HTML, CSS y JavaScript para la página, Node.js con Express para la API y PostgreSQL para guardar los datos.

## Preparar y ejecutar

1. Instala Node.js si aún no está instalado.
2. Abre una terminal en la carpeta `Plataforma` (donde está `package.json`).
3. Ejecuta `npm install` para instalar las dependencias.
4. Ejecuta `npm test` para correr las pruebas automatizadas.
5. Para iniciar la aplicación directamente con `npm start`, configura la variable `DATABASE_URL` con la dirección de una base PostgreSQL.

## Ejecutar con Docker

Abre Docker Desktop y espera a que Docker indique que está funcionando. Después ejecuta `docker compose up --build` desde esta carpeta y abre <http://localhost:8080>. Docker inicia PostgreSQL, la API y la página web. El volumen `postgres-data` conserva la información aunque reinicies los contenedores. Para detenerlos, usa `docker compose down`; no uses `docker compose down -v` si quieres conservar la base de datos.

## Integración y publicación continua

El flujo de GitHub Actions ejecuta las pruebas al enviar cambios a `main` o abrir una solicitud de cambios. Al publicar una etiqueta que empiece con `v` (por ejemplo, `v1.0.0`), también construye y publica las imágenes de la web y de la API en GitHub Container Registry.

## Publicar en Railway

La configuración de `railway.json` prepara la página web y la API para desplegarse juntas como un solo servicio:

1. Sube el proyecto a un repositorio de GitHub.
2. Crea un proyecto en Railway e incorpora un servicio PostgreSQL.
3. Añade un servicio desde tu repositorio de GitHub; Railway usará `Dockerfile.api` y `railway.json`.
4. En las variables del servicio de la aplicación, crea `DATABASE_URL` con la referencia a la base PostgreSQL: `${{Postgres.DATABASE_URL}}`. Si el servicio de base de datos tiene otro nombre, reemplaza `Postgres` por ese nombre.
5. Espera a que el despliegue pase la comprobación `/api/health` y genera un dominio público desde la configuración de red del servicio.

No subas contraseñas ni el valor real de `DATABASE_URL` al repositorio. Railway requiere iniciar sesión y autorizar la conexión a GitHub desde tu propia cuenta.

## API disponible

Todas las respuestas de listado son arreglos JSON. Si faltan datos obligatorios, la API responde con estado `400` y un mensaje de error.

- `POST /api/auth/register`: recibe `{ "nombre": "Ana Pérez", "correo": "ana@universidad.edu" }`.
- `GET /api/events`: lista eventos.
- `POST /api/events`: recibe `{ "title": "Feria académica", "description": "Presentación de proyectos", "date": "2026-11-10" }`.
- `GET /api/news`: lista noticias.
- `POST /api/news`: recibe `{ "title": "Nuevo semestre", "content": "Las clases inician pronto." }`.
- `GET /api/health`: comprueba que el servidor puede conectarse a PostgreSQL.

La base PostgreSQL se crea automáticamente al iniciar la API. El correo de registro es único y los registros, eventos y noticias se guardan en esa base de datos.
