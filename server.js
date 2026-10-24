import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase, initializeDatabase } from './database.js';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(body) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const correo = typeof body.correo === 'string' ? body.correo.trim() : '';

  if (nombre.length < 3) {
    return { error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (!emailPattern.test(correo)) {
    return { error: 'Ingresa un correo electrónico válido.' };
  }

  return { value: { nombre, correo } };
}

function validateContent(body, collection) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const textField = collection === 'events' ? 'description' : 'content';
  const text = typeof body[textField] === 'string' ? body[textField].trim() : '';
  const errors = [];

  if (!title) errors.push('El título es obligatorio.');
  if (!text) errors.push(`El campo ${textField} es obligatorio.`);

  const record = { title, [textField]: text };
  if (collection === 'events') {
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const validDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const parsedDate = validDateFormat ? new Date(`${date}T00:00:00.000Z`) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      errors.push('La fecha del evento debe ser válida.');
    }
    record.date = date;
  }

  return errors.length ? { error: errors.join(' ') } : { value: record };
}

export function createApp(options = {}) {
  const pool = options.pool || createDatabase();
  const app = express();
  app.locals.pool = pool;
  app.use(express.json({ limit: '50kb' }));

  app.get('/api/health', async (_request, response) => {
    await pool.query('SELECT 1');
    response.json({ status: 'ok' });
  });

  app.post('/api/auth/register', async (request, response) => {
    const result = validateRegistration(request.body || {});
    if (result.error) {
      return response.status(400).json({ error: result.error });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO registrations (nombre, correo)
         VALUES ($1, $2)
         RETURNING id, nombre, correo, created_at AS "createdAt"`,
        [result.value.nombre, result.value.correo]
      );
      return response.status(201).json({ message: 'Registro creado.', registration: rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return response.status(409).json({ error: 'Este correo ya está registrado.' });
      }
      throw error;
    }
  });

  app.get('/api/events', async (_request, response) => {
    const { rows } = await pool.query(
      'SELECT id, title, description, date, created_at AS "createdAt" FROM events ORDER BY id'
    );
    response.json(rows);
  });

  app.post('/api/events', async (request, response) => {
    const result = validateContent(request.body || {}, 'events');
    if (result.error) {
      return response.status(400).json({ error: result.error });
    }

    const { rows } = await pool.query(
      `INSERT INTO events (title, description, date)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, date, created_at AS "createdAt"`,
      [result.value.title, result.value.description, result.value.date]
    );
    return response.status(201).json(rows[0]);
  });

  app.get('/api/news', async (_request, response) => {
    const { rows } = await pool.query(
      'SELECT id, title, content, created_at AS "createdAt" FROM news ORDER BY id'
    );
    response.json(rows);
  });

  app.post('/api/news', async (request, response) => {
    const result = validateContent(request.body || {}, 'news');
    if (result.error) {
      return response.status(400).json({ error: result.error });
    }

    const { rows } = await pool.query(
      `INSERT INTO news (title, content)
       VALUES ($1, $2)
       RETURNING id, title, content, created_at AS "createdAt"`,
      [result.value.title, result.value.content]
    );
    return response.status(201).json(rows[0]);
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Endpoint no encontrado.' });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return response.status(400).json({ error: 'El cuerpo JSON no es válido.' });
    }
    console.error(error);
    return response.status(500).json({ error: 'Ocurrió un error interno.' });
  });

  app.use(express.static(projectDirectory));
  return app;
}

async function startServer() {
  const app = createApp();
  const pool = app.locals.pool;
  const port = Number(process.env.PORT) || 3000;

  await initializeDatabase(pool);
  const server = app.listen(port, () => {
    console.log(`Plataforma disponible en http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(() => {
      pool.end().then(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch(error => {
    console.error('No fue posible iniciar la aplicación:', error);
    process.exitCode = 1;
  });
}
