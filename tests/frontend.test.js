// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initForm, initNavigation, showPage, validateEmail } from '../script.js';

function createPage() {
  document.body.innerHTML = `
    <nav class="main-nav">
      <a href="#inicio">Inicio</a>
      <a href="#cursos">Cursos</a>
      <a href="#contacto">Contacto</a>
    </nav>
    <button id="hero-signup">Registrarse ahora</button>
    <section id="inicio" class="page"></section>
    <section id="cursos" class="page"></section>
    <section id="contacto" class="page"></section>
    <section id="registro">
      <form id="registro-form">
        <input id="nombre" name="nombre">
        <input id="correo" name="correo">
        <span id="error-nombre"></span>
        <span id="error-correo"></span>
        <p id="success-msg"></p>
        <button type="submit">Enviar</button>
      </form>
    </section>`;
}

describe('navegación', () => {
  beforeEach(() => createPage());

  it('muestra solo la página elegida desde el menú', () => {
    initNavigation();
    document.querySelector('a[href="#cursos"]').click();

    expect(document.getElementById('cursos').classList.contains('active')).toBe(true);
    expect(document.getElementById('inicio').style.display).toBe('none');
  });

  it('no oculta la página actual cuando el destino no existe', () => {
    showPage('inicio');
    showPage('pagina-inexistente');

    const inicio = document.getElementById('inicio');
    expect(inicio.classList.contains('active')).toBe(true);
    expect(inicio.style.display).toBe('block');
  });

  it('lleva el botón principal a la sección de registro', () => {
    const section = document.getElementById('registro');
    section.scrollIntoView = vi.fn();
    initNavigation();

    document.getElementById('hero-signup').click();

    expect(section.scrollIntoView).toHaveBeenCalled();
  });
});

describe('formulario de registro', () => {
  beforeEach(() => {
    createPage();
    initForm();
    globalThis.fetch = vi.fn();
  });

  it('valida nombre y correo obligatorios antes de llamar a la API', async () => {
    document.getElementById('registro-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    expect(document.getElementById('error-nombre').textContent).toContain('3 caracteres');
    expect(document.getElementById('error-correo').textContent).toContain('correo válido');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('envía los datos válidos a la API y muestra confirmación', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Registro creado.' })
    });
    document.getElementById('nombre').value = 'Ana Pérez';
    document.getElementById('correo').value = 'ana@universidad.edu';

    document.getElementById('registro-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await vi.waitFor(() => {
      expect(document.getElementById('success-msg').textContent).toContain('Registro completado');
    });
    expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST'
    }));
  });

  it('quita el estilo de error cuando un registro posterior es exitoso', async () => {
    const form = document.getElementById('registro-form');
    const message = document.getElementById('success-msg');
    document.getElementById('nombre').value = 'Ana Pérez';
    document.getElementById('correo').value = 'ana@universidad.edu';

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'El correo ya existe.' })
    });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(message.classList.contains('error-message')).toBe(true));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registro creado.' })
    });
    document.getElementById('correo').value = 'otra@universidad.edu';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(message.textContent).toContain('Registro completado'));
    expect(message.classList.contains('error-message')).toBe(false);
  });

  it('muestra un error si el servidor rechaza el registro', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'El correo ya existe.' })
    });
    document.getElementById('nombre').value = 'Ana Pérez';
    document.getElementById('correo').value = 'ana@universidad.edu';

    document.getElementById('registro-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await vi.waitFor(() => {
      expect(document.getElementById('success-msg').textContent).toContain('El correo ya existe');
    });
  });
});

describe('validación de correo', () => {
  it('acepta un correo válido y rechaza uno incompleto', () => {
    expect(validateEmail('estudiante@universidad.edu')).toBe(true);
    expect(validateEmail('correo-incompleto')).toBe(false);
  });
});
