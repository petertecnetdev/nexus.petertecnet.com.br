const IDENTITY_API = "https://api.petertecnet.com.br/api/account/identity";
const SSO_API = "https://api.petertecnet.com.br/api/account/sso";
const STYLE_ID = "pt-identity-experience-style";
const SECURITY_ENTRY = "data-pt-identity-security-entry";
const LOGIN_ENHANCED = "data-pt-identity-login-enhanced";
let installed = false;
let observer = null;
let loginCapture = null;
let ssoCapture = null;

const readToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("auth_token") ||
  "";

const storeAuth = (payload) => {
  const token =
    payload?.access_token ||
    payload?.data?.access_token ||
    payload?.token?.access_token ||
    payload?.token?.original?.access_token ||
    (typeof payload?.token === "string" ? payload.token : "");
  const user = payload?.user || payload?.data?.user || null;

  if (!token) throw new Error("A API não retornou uma sessão válida.");
  localStorage.setItem("token", token);
  localStorage.setItem("access_token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("pt:identity-authenticated", { detail: { token, user } }));
  return { token, user };
};

const request = async (path, { method = "GET", body, auth = false, base = IDENTITY_API } = {}) => {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = readToken();
    if (!token) throw new Error("Faça login para acessar as configurações de segurança.");
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || `Falha de autenticação (${response.status}).`;
    const error = new Error(typeof message === "string" ? message : "Falha de autenticação.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

const encodeBase64Url = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeBase64Url = (value) => {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const notify = (message, type = "info") => {
  let toast = document.querySelector(".ptid-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "ptid-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.dataset.type = type;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toast.__timer);
  toast.__timer = window.setTimeout(() => toast.classList.remove("show"), 4200);
};

const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.ptid-login-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin-top:.7rem}.ptid-secondary{border:1px solid rgba(148,163,184,.35);border-radius:.75rem;background:rgba(15,23,42,.08);color:inherit;padding:.68rem .8rem;font:inherit;font-weight:700;cursor:pointer;min-height:44px}.ptid-secondary:hover{background:rgba(148,163,184,.14)}.ptid-secondary:focus-visible,.ptid-security-entry:focus-visible,.ptid-panel button:focus-visible{outline:2px solid currentColor;outline-offset:2px}.ptid-security-entry{border:1px solid rgba(148,163,184,.3);border-radius:.7rem;background:transparent;color:inherit;padding:.48rem .72rem;font:inherit;font-weight:700;cursor:pointer;margin:.25rem}.ptid-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.72);backdrop-filter:blur(8px);display:grid;place-items:center;padding:1rem}.ptid-panel{width:min(760px,100%);max-height:min(88vh,860px);overflow:auto;border:1px solid rgba(148,163,184,.25);border-radius:1.25rem;background:#0f172a;color:#e2e8f0;box-shadow:0 24px 80px rgba(0,0,0,.45);font-family:inherit}.ptid-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1.1rem 1.2rem;border-bottom:1px solid rgba(148,163,184,.18);position:sticky;top:0;background:#0f172a;z-index:2}.ptid-head h2{font-size:1.15rem;margin:0}.ptid-head p{margin:.2rem 0 0;color:#94a3b8;font-size:.86rem}.ptid-close{width:2.5rem;height:2.5rem;border:0;border-radius:.7rem;background:rgba(148,163,184,.12);color:#e2e8f0;font-size:1.35rem;cursor:pointer}.ptid-body{display:grid;gap:1rem;padding:1.1rem}.ptid-card{border:1px solid rgba(148,163,184,.18);border-radius:1rem;padding:1rem;background:rgba(30,41,59,.58)}.ptid-card h3{font-size:1rem;margin:0 0 .75rem}.ptid-row{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.72rem 0;border-top:1px solid rgba(148,163,184,.12)}.ptid-row:first-of-type{border-top:0}.ptid-meta{display:grid;gap:.18rem;min-width:0}.ptid-meta strong{overflow-wrap:anywhere}.ptid-meta small{color:#94a3b8}.ptid-badge{display:inline-flex;width:max-content;padding:.16rem .45rem;border-radius:999px;background:rgba(52,211,153,.14);color:#6ee7b7;font-size:.72rem;font-weight:800}.ptid-actions{display:flex;flex-wrap:wrap;gap:.5rem}.ptid-panel button{border:1px solid rgba(148,163,184,.28);border-radius:.7rem;background:#1e293b;color:#e2e8f0;padding:.58rem .72rem;font:inherit;font-weight:700;cursor:pointer}.ptid-panel button[data-danger=true]{border-color:rgba(251,113,133,.35);color:#fda4af}.ptid-panel button:disabled{opacity:.55;cursor:wait}.ptid-recovery{white-space:pre-wrap;border:1px dashed rgba(148,163,184,.35);border-radius:.75rem;padding:.8rem;background:#020617;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.ptid-toast{position:fixed;right:1rem;bottom:1rem;z-index:2147483647;max-width:min(390px,calc(100vw - 2rem));padding:.8rem 1rem;border-radius:.85rem;background:#0f172a;color:#e2e8f0;border:1px solid rgba(148,163,184,.3);box-shadow:0 12px 40px rgba(0,0,0,.35);opacity:0;transform:translateY(12px);pointer-events:none;transition:.2s ease}.ptid-toast.show{opacity:1;transform:none}.ptid-toast[data-type=error]{border-color:rgba(251,113,133,.55)}.ptid-toast[data-type=success]{border-color:rgba(52,211,153,.55)}
@media(max-width:640px){.ptid-login-actions{grid-template-columns:1fr}.ptid-overlay{padding:0}.ptid-panel{height:100dvh;max-height:none;border-radius:0;border:0}.ptid-row{align-items:flex-start;flex-direction:column}.ptid-row>.ptid-actions{width:100%}.ptid-row>.ptid-actions button{flex:1}.ptid-body{padding:.85rem}.ptid-head{padding:1rem}}
`;
  document.head.appendChild(style);
};

const afterAuth = (payload) => {
  storeAuth(payload);
  const url = new URL(window.location.href);
  ["identity_magic", "identity_reset", "sso_handoff", "application"].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  window.location.assign("/");
};

const verifyTwoFactorIfNeeded = async (payload) => {
  if (!payload?.two_factor_required) return payload;
  const code = window.prompt("Digite o código de 6 dígitos do seu autenticador ou um código de recuperação:");
  if (!code) throw new Error("Verificação em duas etapas cancelada.");
  return request("/two-factor/verify", {
    method: "POST",
    body: { challenge: payload.challenge, code: code.trim() },
  });
};

const loginWithPassword = async (username, password) => {
  const first = await request("/login", { method: "POST", body: { username, password } });
  return verifyTwoFactorIfNeeded(first);
};

const loginWithPasskey = async () => {
  if (!window.PublicKeyCredential || !navigator.credentials?.get) {
    throw new Error("Este navegador não oferece suporte a passkeys.");
  }
  const result = await request("/passkeys/options", { method: "POST", body: {} });
  const publicKey = { ...result.publicKey, challenge: decodeBase64Url(result.publicKey.challenge) };
  if (Array.isArray(publicKey.allowCredentials)) {
    publicKey.allowCredentials = publicKey.allowCredentials.map((item) => ({ ...item, id: decodeBase64Url(item.id) }));
  }
  const credential = await navigator.credentials.get({ publicKey });
  if (!credential) throw new Error("A autenticação por passkey foi cancelada.");
  const payload = await request("/passkeys/authenticate", {
    method: "POST",
    body: {
      challenge: result.publicKey.challenge,
      credential_id: credential.id,
      client_data_json: encodeBase64Url(credential.response.clientDataJSON),
      authenticator_data: encodeBase64Url(credential.response.authenticatorData),
      signature: encodeBase64Url(credential.response.signature),
    },
  });
  afterAuth(payload);
};

const requestMagicLink = async (form) => {
  let email = form?.querySelector('input[type="email"]')?.value?.trim() || "";
  if (!email || !email.includes("@")) email = window.prompt("Qual e-mail deve receber o link de acesso?")?.trim() || "";
  if (!email) return;
  await request("/magic-link/request", { method: "POST", body: { email } });
  notify("Se o e-mail estiver cadastrado, o link de acesso foi enviado.", "success");
};

const enhanceLoginForms = (root = document) => {
  root.querySelectorAll?.("form").forEach((form) => {
    if (form.hasAttribute(LOGIN_ENHANCED)) return;
    const password = form.querySelector('input[name="password"],input[autocomplete="current-password"]');
    const newPassword = form.querySelector('input[autocomplete="new-password"],input[name="new_password"],input[name="password_confirmation"]');
    if (!password || newPassword) return;
    form.setAttribute(LOGIN_ENHANCED, "true");

    const actions = document.createElement("div");
    actions.className = "ptid-login-actions";
    if (window.PublicKeyCredential && navigator.credentials?.get) {
      const passkey = document.createElement("button");
      passkey.type = "button";
      passkey.className = "ptid-secondary";
      passkey.textContent = "Entrar com passkey";
      passkey.addEventListener("click", () => loginWithPasskey().catch((error) => notify(error.message, "error")));
      actions.appendChild(passkey);
    }
    const magic = document.createElement("button");
    magic.type = "button";
    magic.className = "ptid-secondary";
    magic.textContent = "Receber link por e-mail";
    magic.addEventListener("click", () => requestMagicLink(form).catch((error) => notify(error.message, "error")));
    actions.appendChild(magic);

    const host = password.closest(".form-group,.mb-3,.field,.input-group") || password.parentElement;
    (host || password).insertAdjacentElement("afterend", actions);
  });
};

const findLoginIdentifier = (form) =>
  form.querySelector('input[name="username"],input[type="email"],input[name="email"],input[name="cpf"],input[name="celular"],input[name="phone"],input[type="text"],input[type="tel"]');

const installLoginCapture = () => {
  loginCapture = async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.dataset.ptIdentitySubmitting === "true") return;
    const password = form.querySelector('input[name="password"],input[autocomplete="current-password"]');
    if (!password || form.querySelector('input[autocomplete="new-password"],input[name="new_password"],input[name="password_confirmation"]')) return;
    const identifier = findLoginIdentifier(form);
    if (!identifier?.value || !password.value) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    form.dataset.ptIdentitySubmitting = "true";
    try {
      notify("Validando sua Conta Peter Tecnet…");
      const payload = await loginWithPassword(identifier.value.trim(), password.value);
      notify("Login realizado com sucesso.", "success");
      afterAuth(payload);
    } catch (error) {
      notify(error.message || "Não foi possível entrar.", "error");
      form.dataset.ptIdentitySubmitting = "false";
    }
  };
  document.addEventListener("submit", loginCapture, true);
};

const handleIdentityLinks = async () => {
  const url = new URL(window.location.href);
  const magic = url.searchParams.get("identity_magic");
  if (magic) {
    try {
      notify("Validando link de acesso…");
      const payload = await request("/magic-link/exchange", { method: "POST", body: { token: magic } });
      afterAuth(payload);
    } catch (error) {
      notify(error.message, "error");
    }
    return;
  }

  const reset = url.searchParams.get("identity_reset");
  if (reset) {
    const password = window.prompt("Digite sua nova senha (8+ caracteres, maiúscula, minúscula, número e símbolo):") || "";
    if (!password) return;
    const confirmation = window.prompt("Repita a nova senha:") || "";
    if (password !== confirmation) {
      notify("As senhas não coincidem.", "error");
      return;
    }
    try {
      await request("/password-reset/exchange", {
        method: "POST",
        body: { token: reset, password, password_confirmation: confirmation },
      });
      url.searchParams.delete("identity_reset");
      url.searchParams.delete("application");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      notify("Senha alterada. Faça login novamente.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
    return;
  }

  const handoff = url.searchParams.get("sso_handoff");
  const application = url.searchParams.get("application");
  if (handoff && application) {
    try {
      notify("Conectando sua Conta Peter Tecnet…");
      const result = await request("/exchange", {
        method: "POST",
        body: { handoff_code: handoff, application },
        base: SSO_API,
      });
      afterAuth(result.data || result);
    } catch (error) {
      notify(error.message, "error");
    }
  }
};

const targetApplicationFromUrl = (href) => {
  try {
    const target = new URL(href, window.location.href);
    if (target.origin === window.location.origin || target.protocol !== "https:") return null;
    if (!target.hostname.endsWith(".petertecnet.com.br") || target.hostname === "api.petertecnet.com.br") return null;
    const slug = target.hostname.split(".")[0];
    if (!slug || ["www", "api"].includes(slug)) return null;
    return { target, slug };
  } catch (_) {
    return null;
  }
};

const installSsoCapture = () => {
  ssoCapture = async (event) => {
    if (!readToken() || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target?.closest?.("a[href]");
    if (!anchor || anchor.dataset.ptSsoBypass === "true") return;
    const destination = targetApplicationFromUrl(anchor.href);
    if (!destination) return;

    event.preventDefault();
    try {
      const result = await request("/handoff", {
        method: "POST",
        body: { application: destination.slug },
        auth: true,
        base: SSO_API,
      });
      const data = result.data || result;
      destination.target.searchParams.set("sso_handoff", data.handoff_code);
      destination.target.searchParams.set("application", destination.slug);
      window.location.assign(destination.target.toString());
    } catch (_) {
      anchor.dataset.ptSsoBypass = "true";
      window.location.assign(anchor.href);
    }
  };
  document.addEventListener("click", ssoCapture, true);
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

const registerPasskey = async () => {
  if (!navigator.credentials?.create || !window.PublicKeyCredential) throw new Error("Seu navegador não suporta cadastro de passkey.");
  const result = await request("/passkeys/registration-options", { method: "POST", body: {}, auth: true });
  const source = result.publicKey;
  const publicKey = {
    ...source,
    challenge: decodeBase64Url(source.challenge),
    user: { ...source.user, id: decodeBase64Url(source.user.id) },
    excludeCredentials: (source.excludeCredentials || []).map((item) => ({ ...item, id: decodeBase64Url(item.id) })),
  };
  const credential = await navigator.credentials.create({ publicKey });
  if (!credential) throw new Error("Cadastro da passkey cancelado.");
  const response = credential.response;
  if (typeof response.getPublicKey !== "function" || typeof response.getAuthenticatorData !== "function") {
    throw new Error("Atualize o navegador para cadastrar passkeys com segurança.");
  }
  const publicKeyDer = response.getPublicKey();
  const authenticatorData = response.getAuthenticatorData();
  const algorithm = typeof response.getPublicKeyAlgorithm === "function" ? response.getPublicKeyAlgorithm() : -7;
  await request("/passkeys", {
    method: "POST",
    auth: true,
    body: {
      challenge: source.challenge,
      credential_id: credential.id,
      client_data_json: encodeBase64Url(response.clientDataJSON),
      authenticator_data: encodeBase64Url(authenticatorData),
      public_key: encodeBase64Url(publicKeyDer),
      algorithm,
      transports: typeof response.getTransports === "function" ? response.getTransports() : [],
      name: `Passkey ${new Date().toLocaleDateString("pt-BR")}`,
    },
  });
};

const securityPanel = () => {
  let overlay = document.querySelector(".ptid-overlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.className = "ptid-overlay";
  overlay.innerHTML = `<section class="ptid-panel" role="dialog" aria-modal="true" aria-labelledby="ptid-title"><header class="ptid-head"><div><h2 id="ptid-title">Segurança da Conta Peter Tecnet</h2><p>Sessões, passkeys e verificação em duas etapas.</p></div><button class="ptid-close" type="button" aria-label="Fechar">×</button></header><div class="ptid-body"><div class="ptid-card">Carregando segurança…</div></div></section>`;
  document.body.appendChild(overlay);
  overlay.querySelector(".ptid-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => { if (event.target === overlay) overlay.remove(); });
  return overlay;
};

const loadSecurityPanel = async () => {
  const overlay = securityPanel();
  const body = overlay.querySelector(".ptid-body");
  try {
    const [securityResult, sessionResult] = await Promise.all([
      request("/security", { auth: true }),
      request("/sessions", { auth: true }),
    ]);
    const security = securityResult.data || {};
    const sessions = Array.isArray(sessionResult.data) ? sessionResult.data : [];
    const passkeys = Array.isArray(security.passkeys) ? security.passkeys : [];

    body.innerHTML = `
      <section class="ptid-card"><h3>Sessões e dispositivos</h3>${sessions.length ? sessions.map((session) => `<div class="ptid-row"><div class="ptid-meta"><strong>${escapeHtml(session.device || "Dispositivo")}</strong><small>${escapeHtml(session.application?.name || "Conta Peter Tecnet")} · ${escapeHtml(session.ip || "IP não identificado")}</small><small>Última atividade: ${escapeHtml(session.last_seen_at ? new Date(session.last_seen_at).toLocaleString("pt-BR") : "agora")}</small>${session.current ? '<span class="ptid-badge">Este dispositivo</span>' : ""}</div><div class="ptid-actions">${session.current ? "" : `<button type="button" data-action="revoke-session" data-id="${escapeHtml(session.id)}" data-danger="true">Encerrar</button>`}</div></div>`).join("") : '<p>Nenhuma sessão ativa encontrada.</p>'}<div class="ptid-actions"><button type="button" data-action="revoke-others">Encerrar outros dispositivos</button><button type="button" data-action="revoke-all" data-danger="true">Encerrar todas</button></div></section>
      <section class="ptid-card"><h3>Verificação em duas etapas</h3><div class="ptid-row"><div class="ptid-meta"><strong>${security.two_factor_enabled ? "Ativada" : "Desativada"}</strong><small>Use um aplicativo autenticador compatível com TOTP.</small></div><div class="ptid-actions"><button type="button" data-action="${security.two_factor_enabled ? "disable-2fa" : "enable-2fa"}">${security.two_factor_enabled ? "Desativar" : "Ativar 2FA"}</button></div></div></section>
      <section class="ptid-card"><h3>Passkeys</h3>${passkeys.map((passkey) => `<div class="ptid-row"><div class="ptid-meta"><strong>${escapeHtml(passkey.name || "Passkey")}</strong><small>${passkey.last_used_at ? `Usada em ${escapeHtml(new Date(passkey.last_used_at).toLocaleString("pt-BR"))}` : "Ainda não utilizada"}</small></div><div class="ptid-actions"><button type="button" data-action="delete-passkey" data-id="${escapeHtml(passkey.id)}" data-danger="true">Remover</button></div></div>`).join("")}<div class="ptid-actions"><button type="button" data-action="add-passkey">Adicionar passkey</button></div></section>
      <section class="ptid-card"><h3>Política de senha</h3><p>Mínimo de ${escapeHtml(security.policy?.password_min_length || 8)} caracteres, com maiúscula, minúscula, número e símbolo. Senhas conhecidas em vazamentos são bloqueadas.</p></section>`;

    body.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button || button.disabled) return;
      button.disabled = true;
      try {
        const action = button.dataset.action;
        if (action === "revoke-session") await request(`/sessions/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE", auth: true });
        if (action === "revoke-others") await request("/sessions/revoke-others", { method: "POST", auth: true });
        if (action === "revoke-all") {
          if (!window.confirm("Encerrar todas as sessões, inclusive esta?")) return;
          await request("/sessions", { method: "DELETE", auth: true });
          localStorage.removeItem("token"); localStorage.removeItem("access_token"); localStorage.removeItem("auth_token");
          window.location.assign("/"); return;
        }
        if (action === "enable-2fa") {
          const current_password = window.prompt("Confirme sua senha atual para ativar o 2FA:") || "";
          if (!current_password) return;
          const setup = await request("/two-factor/setup", { method: "POST", auth: true, body: { current_password } });
          const secret = setup.data?.secret;
          const code = window.prompt(`No seu autenticador, adicione a chave:\n\n${secret}\n\nDepois digite o código de 6 dígitos:`) || "";
          if (!code) return;
          const confirmed = await request("/two-factor/confirm", { method: "POST", auth: true, body: { code } });
          window.alert(`2FA ativado. Guarde estes códigos de recuperação em local seguro:\n\n${(confirmed.recovery_codes || []).join("\n")}`);
        }
        if (action === "disable-2fa") {
          const current_password = window.prompt("Confirme sua senha atual:") || "";
          const code = window.prompt("Digite o código do autenticador ou um código de recuperação:") || "";
          if (!current_password || !code) return;
          await request("/two-factor", { method: "DELETE", auth: true, body: { current_password, code } });
        }
        if (action === "add-passkey") await registerPasskey();
        if (action === "delete-passkey") await request(`/passkeys/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE", auth: true });
        notify("Configuração de segurança atualizada.", "success");
        overlay.remove();
        await loadSecurityPanel();
      } catch (error) {
        notify(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  } catch (error) {
    body.innerHTML = `<section class="ptid-card"><h3>Não foi possível carregar a segurança</h3><p>${escapeHtml(error.message)}</p></section>`;
  }
};

const installSecurityEntry = (root = document) => {
  if (!readToken() || document.querySelector(`[${SECURITY_ENTRY}]`)) return;
  const candidates = Array.from(root.querySelectorAll?.("button,a") || []);
  const logout = candidates.find((element) => /^(sair|logout|encerrar sessão)$/i.test((element.textContent || "").trim()));
  if (!logout?.parentElement) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ptid-security-entry";
  button.setAttribute(SECURITY_ENTRY, "true");
  button.textContent = "Segurança";
  button.addEventListener("click", loadSecurityPanel);
  logout.parentElement.insertBefore(button, logout);
};

const scan = (root = document) => {
  enhanceLoginForms(root);
  installSecurityEntry(root);
};

export const installIdentityExperience = () => {
  if (installed || typeof window === "undefined" || typeof document === "undefined") return () => {};
  installed = true;
  injectStyles();
  scan();
  installLoginCapture();
  installSsoCapture();
  handleIdentityLinks();

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) scan(node);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const openSecurity = () => loadSecurityPanel();
  window.PeterIdentity = Object.assign(window.PeterIdentity || {}, {
    openSecurity,
    loginWithPasskey,
    requestMagicLink: () => requestMagicLink(null),
  });

  return () => {
    observer?.disconnect();
    observer = null;
    if (loginCapture) document.removeEventListener("submit", loginCapture, true);
    if (ssoCapture) document.removeEventListener("click", ssoCapture, true);
    loginCapture = null;
    ssoCapture = null;
    installed = false;
  };
};
