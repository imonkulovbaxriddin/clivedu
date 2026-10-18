import { h, toast } from '../ui.js';
import { getUser, on } from '../store.js';
import { net, login, register, googleLogin, loadGoogle } from '../api.js';
import { go } from '../router.js';
import { t } from '../i18n.js';
import { levelPicker } from '../levelpicker.js';

export function render(root, _p, query) {
  if (getUser()) { go('/me'); return; }
  let mode = query?.get('signup') ? 'signup' : 'login';
  const next = query?.get('next') || '/me';
  const card = h('div', { class: 'card glass stack' });
  const err = h('p', { class: 'error', role: 'alert' });

  const paint = () => {
    const signup = mode === 'signup';
    const name = h('input', { id: 'f-name', autocomplete: 'name', placeholder: t('Your full name'), required: true });
    const picker = signup ? levelPicker(null) : null;
    const email = h('input', { id: 'f-email', type: 'email', autocomplete: 'email', placeholder: 'you@example.com', required: true });
    const pass = h('input', { id: 'f-pass', type: 'password', autocomplete: signup ? 'new-password' : 'current-password', placeholder: signup ? t('At least 8 characters') : t('Your password'), required: true, minlength: signup ? 8 : 1 });
    const submit = h('button', { class: 'btn primary', type: 'submit', style: { width: '100%' } }, signup ? t('Create my account') : t('Log in'));
    const form = h('form', { class: 'stack', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      if (!net.backend) { err.textContent = 'The account server is not running. See the README to start it.'; return; }
      if (signup && !picker.get()) { err.textContent = t('Please choose your English level below.'); return; }
      submit.disabled = true;
      try {
        signup ? await register(name.value, email.value, pass.value, picker.get()) : await login(email.value, pass.value);
        toast(signup ? t('Welcome to ClivEdu!') : t('Welcome back!'), 'good');
        go(next);
      } catch (ex) { err.textContent = ex.message; submit.disabled = false; }
    } },
      signup ? h('div', { class: 'field' }, h('label', { for: 'f-name' }, t('Name')), name) : null,
      h('div', { class: 'field' }, h('label', { for: 'f-email' }, 'Email'), email),
      h('div', { class: 'field' }, h('label', { for: 'f-pass' }, t('Password')), pass),
      signup ? h('div', { class: 'field' }, h('label', t('What is your English level?')), picker.el) : null,
      err, submit);

    const gBox = h('div', { style: { display: 'grid', justifyItems: 'center', minHeight: '44px' } });
    card.replaceChildren(
      h('h1', { class: 'h1' }, signup ? t('Join the class') : t('Welcome back')),
      h('p', { class: 'muted' }, signup ? t('Make an account to get homework, unlock slides and keep your profile.') : t('Log in to see your homework and lessons.')),
      net.googleClientId ? gBox : null,
      net.googleClientId ? h('div', { class: 'divider' }, t('or use email')) : null,
      form,
      h('p', { class: 'small muted', style: { textAlign: 'center' } }, signup ? t('Already have an account? ') : t('New here? '),
        h('a', { href: '#', onclick: (e) => { e.preventDefault(); mode = signup ? 'login' : 'signup'; paint(); } }, signup ? t('Log in') : t('Create an account'))),
      !net.backend ? h('p', { class: 'hint' }, 'Running without the server: you can still learn and play. Your progress is saved on this device.') : h('p', { class: 'hint' }, t('Your learning progress is saved on this device. The account holds your name, profile and homework.')));

    if (net.googleClientId) loadGoogle().then(() => {
      window.google.accounts.id.initialize({ client_id: net.googleClientId, callback: async (resp) => { try { await googleLogin(resp.credential); toast('Signed in with Google', 'good'); go(next); } catch (ex) { err.textContent = ex.message; } } });
      window.google.accounts.id.renderButton(gBox, { theme: 'filled_blue', size: 'large', shape: 'pill', width: 320, text: signup ? 'signup_with' : 'signin_with' });
    }).catch((ex) => { gBox.textContent = ex.message; });
  };
  paint();
  root.append(h('div', { class: 'auth' }, card));
  return on('session', (s) => { if (s) go(next); });
}
