import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';
import { initializeDatabase } from '../database.js';
import { createApp } from '../server.js';

let pool;
let app;

beforeEach(async () => {
  const database = newDb();
  const pg = database.adapters.createPg();
  pool = new pg.Pool();
  await initializeDatabase(pool);
  app = createApp({ pool });
});

afterEach(async () => {
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('crea un registro cuando nombre y correo son válidos', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Ana Pérez', correo: 'ana@universidad.edu' });

    expect(response.status).toBe(201);
    expect(response.body.registration.nombre).toBe('Ana Pérez');
  });

  it('rechaza los campos obligatorios incompletos', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Al', correo: 'no-es-un-correo' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });

  it('rechaza registrar dos veces el mismo correo', async () => {
    const registration = { nombre: 'Ana Pérez', correo: 'ana@universidad.edu' };
    await request(app).post('/api/auth/register').send(registration);
    const duplicate = await request(app).post('/api/auth/register').send(registration);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toContain('ya está registrado');
  });
});

describe('eventos y noticias', () => {
  it('crea y lista eventos académicos', async () => {
    const created = await request(app)
      .post('/api/events')
      .send({ title: 'Feria académica', description: 'Presentación de proyectos', date: '2026-11-10' });
    const listed = await request(app).get('/api/events');

    expect(created.status).toBe(201);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].title).toBe('Feria académica');
  });

  it('crea y lista noticias institucionales', async () => {
    const created = await request(app)
      .post('/api/news')
      .send({ title: 'Nuevo semestre', content: 'Las clases inician pronto.' });
    const listed = await request(app).get('/api/news');

    expect(created.status).toBe(201);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].title).toBe('Nuevo semestre');
  });

  it('rechaza noticias y eventos sin campos obligatorios', async () => {
    const event = await request(app).post('/api/events').send({ title: 'Evento' });
    const news = await request(app).post('/api/news').send({ content: 'Sin título' });

    expect(event.status).toBe(400);
    expect(news.status).toBe(400);
  });

  it('responde correctamente a la verificación de salud', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
