// Login simulado: cualquier correo + código 123456 (solo demo).
// PROVISIONAL: marcado mínimo hasta recibir el diseño de Claude Design.
import * as data from '../data/index.js';
import { html } from '../lib/dom.js';

const app = document.getElementById('app');

if (await data.getSesion()) location.replace('/panel/app.html');

app.innerHTML = html`
  <form class="login" novalidate>
    <h1>Panel de novios</h1>
    <p>Demo: usa cualquier correo y el código <strong>123456</strong>.</p>
    <label>Correo <input name="correo" type="email" autocomplete="email" required /></label>
    <label>Código <input name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required /></label>
    <p class="login__error" role="alert" hidden></p>
    <button type="submit">Entrar</button>
  </form>`;

const form = app.querySelector('form');
const error = app.querySelector('.login__error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.hidden = true;
  try {
    await data.login(form.correo.value, form.codigo.value);
    location.replace('/panel/app.html');
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
  }
});
