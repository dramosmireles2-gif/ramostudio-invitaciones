// Entrar al panel de novios. Login simulado (solo demo): cualquier correo y
// el código de config.js. No es autenticación real ni guarda contraseñas.
import * as data from '../data/index.js';
import { DEMO_EVENT_SLUG, DEMO_LOGIN_CODE } from '../config.js';
import { leerParametros } from '../lib/links.js';
import { origenVisita } from '../lib/origen.js';
import { esDemo } from './demo.js';
import { aplicarTemaPanel } from '../lib/theme.js';
import { html, crudo } from '../lib/dom.js';
import { goldRule, waxSeal, wordmark, statusTag } from '../lib/ui.js';

const app = document.getElementById('app');

// Guarda ?src= antes de redirigir al panel, que se abre sin parámetros.
origenVisita();

if (await data.getSesion()) location.replace('/panel/app.html');

const evento = await data.getEvento(leerParametros().slug ?? DEMO_EVENT_SLUG);

// Modo demo: el evento demo entra directo, sin login.
if (esDemo(evento)) {
  await data.entrarDemo(evento.id);
  location.replace('/panel/app.html');
  await new Promise(() => {}); // Detiene el arranque mientras redirige.
}

const tema = aplicarTemaPanel(evento.tema);
const CORREO_VALIDO = /\S+@\S+\.\S+/;

let correo = '';

app.innerHTML = html`
  <div class="login">
    <header class="login__marca">
      ${crudo(waxSeal(tema.monograma, 96))}
      <div class="label">Su panel de boda</div>
      <h1 class="t-script login__nombres">${evento.titulo}</h1>
      ${crudo(goldRule({ ornament: true, width: '50%' }))}
    </header>
    <section class="sheet login__hoja" aria-live="polite"></section>
    <footer class="login__pie">
      ${crudo(wordmark({ width: 120, tone: 'tema', tagline: false }))}
      <p class="t-meta">¿No les llega el correo? Escríbannos y les ayudamos.</p>
    </footer>
  </div>`;

const hoja = app.querySelector('.login__hoja');

function pasoCorreo() {
  hoja.innerHTML = html`
    <form class="login__form" novalidate>
      <h2 class="t-h2">Entren a su panel</h2>
      <p class="t-body">Escriban el correo con el que apartaron su invitación. Les mandamos un código de 6 números; no necesitan contraseña.</p>
      <div class="field">
        <label class="field__label" for="login-correo">Su correo</label>
        <input class="field__control" id="login-correo" name="correo" type="email" autocomplete="email"
          placeholder="nombre@correo.com" value="${correo}" />
      </div>
      <p class="t-meta field__hint--error" id="login-error" hidden></p>
      <button class="btn btn--lg btn--full" type="submit" disabled>Mandarme el código por correo</button>
      <div class="login__alterno">
        <button class="btn btn--secondary btn--full" type="button" disabled>Recibirlo por WhatsApp</button>
        <div class="login__pronto">${crudo(statusTag('vio', 'Próximamente'))}<span class="t-meta">Por ahora, el código llega solo por correo.</span></div>
      </div>
    </form>`;
  const form = hoja.querySelector('form');
  const enviar = form.querySelector('[type=submit]');
  const actualizar = () => { enviar.disabled = !CORREO_VALIDO.test(form.correo.value); };
  form.correo.addEventListener('input', actualizar);
  actualizar();
  const error = form.querySelector('#login-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviar.disabled) return;
    correo = form.correo.value.trim();
    enviar.disabled = true;
    enviar.textContent = 'Mandando el código…';
    try {
      await data.enviarCodigo(correo, evento.id);
      pasoCodigo();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      enviar.textContent = 'Mandarme el código por correo';
      actualizar();
    }
  });
}

function pasoCodigo() {
  hoja.innerHTML = html`
    <form class="login__form" novalidate>
      <h2 class="t-h2">Escriban su código</h2>
      <p class="t-body">Lo mandamos a <span class="t-strong login__correo">${correo}</span>. Suele llegar en menos de un minuto; si no lo ven, revisen la carpeta de correo no deseado.</p>
      <label class="label login__codigo-label" for="login-codigo">Código de 6 números</label>
      <input class="login__codigo" id="login-codigo" name="codigo" inputmode="numeric" autocomplete="one-time-code"
        maxlength="6" placeholder="······" aria-describedby="login-aviso" />
      <p class="t-meta" id="login-aviso" hidden></p>
      <button class="btn btn--lg btn--full" type="submit" disabled>Entrar a mi panel</button>
      <div class="login__acciones">
        <button class="btn btn--quiet btn--flush" type="button" data-reenviar>Mandar otro código</button>
        <button class="btn btn--quiet btn--flush" type="button" data-cambiar>Cambiar correo</button>
      </div>
      ${data.codigoPorCorreo(evento.id) ? '' : crudo(html`<p class="t-meta login__demo">Demo: el código es ${DEMO_LOGIN_CODE}.</p>`)}
    </form>`;
  const form = hoja.querySelector('form');
  const entrar = form.querySelector('[type=submit]');
  const aviso = form.querySelector('#login-aviso');
  const decir = (texto, error = false) => {
    aviso.textContent = texto;
    aviso.hidden = false;
    aviso.classList.toggle('field__hint--error', error);
    form.codigo.setAttribute('aria-invalid', String(error));
  };
  form.codigo.addEventListener('input', () => {
    form.codigo.value = form.codigo.value.replace(/\D/g, '');
    entrar.disabled = form.codigo.value.length < 6;
    if (form.codigo.getAttribute('aria-invalid') === 'true') { aviso.hidden = true; form.codigo.removeAttribute('aria-invalid'); }
  });
  form.querySelector('[data-reenviar]').addEventListener('click', async () => {
    try {
      await data.enviarCodigo(correo, evento.id);
      decir('Listo, les mandamos un código nuevo a su correo.');
    } catch (err) {
      decir(err.message, true);
    }
  });
  form.querySelector('[data-cambiar]').addEventListener('click', pasoCorreo);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (entrar.disabled) return;
    try {
      await data.login(correo, form.codigo.value, evento.id);
      location.replace('/panel/app.html');
    } catch (err) {
      decir(err.codigo === 'codigo_incorrecto'
        ? 'Ese código no coincide o ya venció. Revisen el correo más reciente que les mandamos.'
        : err.message, true);
    }
  });
  form.codigo.focus();
}

pasoCorreo();
