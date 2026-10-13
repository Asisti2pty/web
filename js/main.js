/* ==========================================================
   Configuración de contacto de Asisti2
   Completar cuando estén definidos. Mientras estén vacíos,
   los botones de WhatsApp y el correo no se muestran.
   ========================================================== */
const ASISTI2_CONFIG = {
  // Número de WhatsApp con código de país, solo dígitos. Ej: '50761234567'
  whatsapp: '50766910069',
  // Correo que recibe las solicitudes. Ej: 'ventas@asisti2pty.com'
  email: 'consultas@asisti2pty.com',
  // URL del servicio que recibe el formulario (FormSubmit, Formspree u otro). Si está vacío,
  // el formulario abre el correo del visitante con la solicitud ya escrita.
  // FormSubmit: el primer envío manda un correo de activación a consultas@ que hay que confirmar.
  formEndpoint: 'https://formsubmit.co/ajax/consultas@asisti2pty.com',
  // Líneas de atención para colaboradores (sección "Cómo usar sus beneficios").
  // Ej: '+507 800-0000'. Vacías = se muestra "disponible pronto".
  lineaDental: '',
  lineaAsistencias: ''
};

document.addEventListener('DOMContentLoaded', () => {
  const { whatsapp, email, formEndpoint } = ASISTI2_CONFIG;
  const waLink = (msg) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

  // WhatsApp
  if (whatsapp) {
    document.querySelectorAll('.js-whatsapp').forEach((a) => {
      a.href = waLink(a.dataset.msg || 'Hola, quiero información de Asisti2.');
      a.target = '_blank';
      a.rel = 'noopener';
      a.hidden = false;
    });
    document.querySelectorAll('.js-whatsapp-item').forEach((li) => { li.hidden = false; });
  }

  // Correo
  if (email) {
    document.querySelectorAll('.js-email').forEach((a) => {
      a.href = `mailto:${email}`;
      a.textContent = email;
    });
    document.querySelectorAll('.js-email-item').forEach((li) => { li.hidden = false; });
  }

  // Año en el pie
  document.querySelectorAll('.js-year').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Líneas de atención
  const lineas = { dental: ASISTI2_CONFIG.lineaDental, asistencias: ASISTI2_CONFIG.lineaAsistencias };
  document.querySelectorAll('.js-linea').forEach((el) => {
    const numero = lineas[el.dataset.linea];
    if (!numero) return;
    const etiqueta = el.dataset.linea === 'dental' ? 'Línea dental' : 'Línea 24/7';
    el.innerHTML = `${etiqueta}: <a href="tel:${numero.replace(/[^\d+]/g, '')}">${numero}</a>`;
  });

  // Contadores de la sección "Respaldo": suben al aparecer en pantalla
  const contadores = document.querySelectorAll('.js-count');
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (contadores.length && 'IntersectionObserver' in window && !reducirMovimiento) {
    const animar = (el) => {
      const fin = Number(el.dataset.to);
      const inicio = performance.now();
      const paso = (t) => {
        const p = Math.min((t - inicio) / 1400, 1);
        el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))).toLocaleString('es-PA');
        if (p < 1) requestAnimationFrame(paso);
      };
      el.textContent = '0';
      requestAnimationFrame(paso);
    };
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) { animar(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    contadores.forEach((el) => obs.observe(el));
  }

  // Filtro de la red dental por zona
  const chipsZona = document.querySelectorAll('.zone-filter .chip');
  chipsZona.forEach((chip) => {
    chip.addEventListener('click', () => {
      chipsZona.forEach((c) => { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      const zona = chip.dataset.zona;
      document.querySelectorAll('.clinics [data-zona]').forEach((col) => {
        col.hidden = zona !== 'todas' && col.dataset.zona !== zona;
      });
    });
  });

  // "Arme su plan": resumen de lo elegido
  const opciones = document.querySelectorAll('#form-cotizacion input[name="interes"]');
  const resumenPlan = document.querySelector('.plan-summary');
  const actualizarResumen = () => {
    if (!resumenPlan) return;
    const elegidos = [...opciones].filter((o) => o.checked).map((o) => o.value);
    resumenPlan.textContent = elegidos.length
      ? `Su plan: ${elegidos.join(', ')}.`
      : '';
  };
  opciones.forEach((o) => o.addEventListener('change', actualizarResumen));

  // "Lo quiero": marca el producto en el formulario
  document.querySelectorAll('.js-quiero').forEach((btn) => {
    btn.addEventListener('click', () => {
      const valor = btn.dataset.producto;
      const check = document.querySelector(`#form-cotizacion input[name="interes"][value="${valor}"]`);
      if (check) check.checked = true;
      actualizarResumen();
    });
  });

  // Formulario de cotización
  const form = document.getElementById('form-cotizacion');
  if (!form) return;
  const status = form.querySelector('.form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      status.textContent = 'Revise los campos marcados.';
      return;
    }

    // Registro del consentimiento (fecha y hora del envío)
    const fechaConsentimiento = form.querySelector('.js-fecha-consentimiento');
    if (fechaConsentimiento) fechaConsentimiento.value = new Date().toISOString();

    const data = new FormData(form);
    const intereses = data.getAll('interes').join(', ') || 'Sin especificar';
    const resumen =
      `Nombre: ${data.get('nombre')}\n` +
      `Empresa: ${data.get('empresa')}\n` +
      `Correo: ${data.get('email')}\n` +
      `Teléfono: ${data.get('telefono') || '-'}\n` +
      `Colaboradores: ${data.get('colaboradores') || '-'}\n` +
      `Beneficios de interés: ${intereses}\n` +
      `Mensaje: ${data.get('mensaje') || '-'}\n` +
      `Acepta comunicaciones: ${data.get('acepta_comunicaciones') || 'No'}\n` +
      `Consentimiento: ${data.get('consentimiento')} (${data.get('fecha_consentimiento')})`;

    if (formEndpoint) {
      status.textContent = 'Enviando…';
      try {
        const payload = {
          _subject: `Solicitud de cotización web - ${data.get('empresa')}`,
          _template: 'table',
          _captcha: 'false',
          _replyto: data.get('email'),
          Nombre: data.get('nombre'),
          Empresa: data.get('empresa'),
          Correo: data.get('email'),
          'Teléfono': data.get('telefono') || '-',
          Colaboradores: data.get('colaboradores') || '-',
          'Beneficios de interés': intereses,
          Mensaje: data.get('mensaje') || '-',
          'Acepta comunicaciones': data.get('acepta_comunicaciones') || 'No',
          Consentimiento: `${data.get('consentimiento')} (${data.get('fecha_consentimiento')})`
        };
        const res = await fetch(formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        actualizarResumen();
        form.classList.remove('was-validated');
        status.textContent = '¡Gracias! Recibimos su solicitud y le contactaremos pronto.';
      } catch {
        status.textContent = 'No pudimos enviar la solicitud. Intente de nuevo o escríbanos directamente.';
      }
      return;
    }

    if (email) {
      const asunto = `Solicitud de cotización - ${data.get('empresa')}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(resumen)}`;
      status.textContent = 'Se abrió su correo con la solicitud lista para enviar.';
      return;
    }

    status.textContent = 'El envío del formulario aún no está activo.';
  });
});
