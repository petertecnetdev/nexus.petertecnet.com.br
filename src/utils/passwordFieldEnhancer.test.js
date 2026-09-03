import { installPasswordFieldEnhancer } from './passwordFieldEnhancer';

const resetDom = () => {
  window.__ptPasswordFieldEnhancer?.cleanup?.();
  delete window.__ptPasswordFieldEnhancer;
  document.body.innerHTML = '';
  document.getElementById('pt-password-field-enhancer-style')?.remove();
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('passwordFieldEnhancer', () => {
  beforeEach(resetDom);
  afterEach(resetDom);

  test('mostra, oculta automaticamente e informa Caps Lock', async () => {
    document.body.innerHTML = '<form><div><input id="password" type="password" autocomplete="current-password" /></div></form>';
    installPasswordFieldEnhancer();

    const input = document.getElementById('password');
    const toggle = document.querySelector('[data-pt-password-toggle]');
    const caps = document.querySelector('.pt-password-caps');

    expect(toggle).not.toBeNull();
    expect(toggle.type).toBe('button');
    expect(toggle.getAttribute('aria-label')).toBe('Mostrar senha');
    expect(input.getAttribute('autocapitalize')).toBe('none');
    expect(input.getAttribute('spellcheck')).toBe('false');

    toggle.click();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Ocultar senha');

    const capsEvent = new Event('keydown', { bubbles: true });
    Object.defineProperty(capsEvent, 'getModifierState', { value: (key) => key === 'CapsLock' });
    input.dispatchEvent(capsEvent);
    expect(caps.hidden).toBe(false);

    input.focus();
    input.blur();
    await flush();
    expect(input.type).toBe('password');
  });

  test('mostra requisitos, força e confirmação de nova senha', () => {
    document.body.innerHTML = `
      <form>
        <div><input id="new-password" type="password" autocomplete="new-password" placeholder="Nova senha" /></div>
        <div><input id="confirm-password" type="password" autocomplete="new-password" placeholder="Confirmar senha" /></div>
      </form>
    `;
    installPasswordFieldEnhancer();

    const password = document.getElementById('new-password');
    const confirmation = document.getElementById('confirm-password');

    password.value = 'Abcd123!';
    password.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelectorAll('.pt-password-requirements .ok')).toHaveLength(5);
    expect(document.querySelector('.pt-password-strength').textContent).toBe('Senha forte.');

    confirmation.value = 'Abcd123!';
    confirmation.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelector('.pt-password-match').dataset.match).toBe('true');
    expect(document.querySelector('.pt-password-match').textContent).toBe('As senhas coincidem.');
  });

  test('detecta campos adicionados dinamicamente e não duplica toggle existente', async () => {
    installPasswordFieldEnhancer();
    const modal = document.createElement('div');
    modal.innerHTML = '<div><input type="password" autocomplete="current-password" /><button type="button" aria-label="Mostrar senha">Mostrar</button></div>';
    document.body.appendChild(modal);
    await flush();

    const host = modal.firstElementChild;
    expect(host.querySelectorAll('button')).toHaveLength(1);
    expect(host.querySelector('button').classList.contains('pt-password-toggle-adopted')).toBe(true);
    expect(host.querySelector('input').getAttribute('data-pt-password-ready')).toBe('true');
  });
});
