function showPage(pageId) {
  const target = document.getElementById(pageId);
  if (!target) {
    return;
  }

  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.classList.remove('active');
    page.style.display = 'none';
  });

  target.classList.add('active');
  target.style.display = 'block';
  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section && typeof section.scrollIntoView === 'function') {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function initNavigation() {
  document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      showPage(link.getAttribute('href').slice(1));
    });
  });

  document.getElementById('hero-signup').addEventListener('click', () => {
    scrollToSection('registro');
  });
}

function initForm() {
  const form = document.getElementById('registro-form');
  const nombre = document.getElementById('nombre');
  const correo = document.getElementById('correo');
  const errorNombre = document.getElementById('error-nombre');
  const errorCorreo = document.getElementById('error-correo');
  const successMsg = document.getElementById('success-msg');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    let valid = true;

    errorNombre.textContent = '';
    errorCorreo.textContent = '';
    successMsg.textContent = '';
    successMsg.classList.remove('error-message');

    if (!nombre.value.trim() || nombre.value.trim().length < 3) {
      errorNombre.textContent = 'Nombre completo debe tener al menos 3 caracteres.';
      valid = false;
    }

    if (!correo.value.trim() || !validateEmail(correo.value)) {
      errorCorreo.textContent = 'Ingresa un correo válido.';
      valid = false;
    }

    if (valid) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.value.trim(),
            correo: correo.value.trim()
          })
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'No fue posible completar el registro.');
        }

        successMsg.textContent = 'Registro completado con éxito. ¡Bienvenido!';
        form.reset();
      } catch (error) {
        successMsg.textContent = error.message || 'No fue posible conectar con el servidor.';
        successMsg.classList.add('error-message');
      }
    }
  });
}

export { initForm, initNavigation, scrollToSection, showPage, validateEmail };

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    showPage('inicio');
    initForm();
  });
}