/*!
 * KopTup — widget del chatbot RAG.
 *
 * Inserta un botón flotante que abre el chat de un bot creado en
 * https://www.koptup.com/demo/chatbot?mode=builder ("Configura el tuyo").
 * El chat se carga en un iframe desde <origen del script>/embed/chatbot/<botId>
 * y responde con los documentos del bot, citando la fuente.
 *
 * Uso (pegar antes del cierre de la etiqueta body):
 *   <script src="https://www.koptup.com/widget.js" data-bot-id="kbot_xxx"
 *           data-color="#4F46E5" data-position="br" async></script>
 *
 * Atributos:
 *   data-bot-id    (obligatorio) id del bot.
 *   data-color     color del botón y del encabezado del chat (#RRGGBB).
 *   data-position  br | bl | tr | tl (abajo/arriba, derecha/izquierda). Por defecto br.
 *   data-label     texto accesible del botón. Por defecto "Abrir chat".
 *   data-open      "true" para abrir el chat al cargar la página.
 *
 * API opcional: window.KoptupChatbot.open() / .close() / .toggle()
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) {
    var candidates = document.querySelectorAll('script[data-bot-id]');
    script = candidates[candidates.length - 1];
  }
  if (!script) return;

  var botId = script.getAttribute('data-bot-id') || '';
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(botId)) {
    if (window.console) console.warn('[KopTup widget] Falta un data-bot-id válido.');
    return;
  }

  var registry = (window.__koptupChatbots = window.__koptupChatbots || {});
  if (registry[botId]) return; // ya insertado
  registry[botId] = true;

  var origin = 'https://www.koptup.com';
  try {
    origin = new URL(script.src, window.location.href).origin;
  } catch (e) {
    /* se usa el dominio de KopTup */
  }

  var color = script.getAttribute('data-color') || '';
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) color = '#4F46E5';
  var position = script.getAttribute('data-position') || 'br';
  if (!/^(br|bl|tr|tl)$/.test(position)) position = 'br';
  var label = script.getAttribute('data-label') || 'Abrir chat';
  var openOnLoad = script.getAttribute('data-open') === 'true';

  var vertical = position.charAt(0) === 't' ? 'top' : 'bottom';
  var horizontal = position.charAt(1) === 'l' ? 'left' : 'right';
  var Z = '2147483000';

  var root = document.createElement('div');
  root.setAttribute('data-koptup-chatbot', botId);

  var button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-expanded', 'false');
  button.style.cssText =
    'position:fixed;' + vertical + ':20px;' + horizontal + ':20px;z-index:' + Z + ';' +
    'width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;padding:0;' +
    'display:flex;align-items:center;justify-content:center;color:#fff;' +
    'box-shadow:0 8px 24px rgba(15,23,42,.25);background:' + color + ';' +
    'transition:transform .15s ease;';
  button.onmouseenter = function () { button.style.transform = 'scale(1.06)'; };
  button.onmouseleave = function () { button.style.transform = 'none'; };

  var ICON_CHAT =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 6 2.6-2.6A2 2 0 0 1 8 17h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14z"/></svg>';
  var ICON_CLOSE =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>';
  button.innerHTML = ICON_CHAT;

  var panel = document.createElement('div');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', label);
  panel.style.cssText =
    'position:fixed;' + vertical + ':88px;' + horizontal + ':20px;z-index:' + Z + ';' +
    'width:380px;height:600px;max-width:calc(100vw - 40px);max-height:calc(100vh - 108px);' +
    'border-radius:16px;overflow:hidden;background:#fff;display:none;' +
    'box-shadow:0 18px 48px rgba(15,23,42,.30);';

  var iframe = null;
  var isOpen = false;

  function applySmallScreen() {
    if (window.innerWidth < 480) {
      panel.style.width = '100vw';
      panel.style.height = '100%';
      panel.style.maxWidth = '100vw';
      panel.style.maxHeight = '100%';
      panel.style[vertical] = '0';
      panel.style[horizontal] = '0';
      panel.style.borderRadius = '0';
    } else {
      panel.style.width = '380px';
      panel.style.height = '600px';
      panel.style.maxWidth = 'calc(100vw - 40px)';
      panel.style.maxHeight = 'calc(100vh - 108px)';
      panel.style[vertical] = '88px';
      panel.style[horizontal] = '20px';
      panel.style.borderRadius = '16px';
    }
  }

  function open() {
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.src =
        origin + '/embed/chatbot/' + encodeURIComponent(botId) + '?widget=1&color=' + encodeURIComponent(color);
      iframe.title = label;
      iframe.setAttribute('allow', 'clipboard-write');
      iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';
      panel.appendChild(iframe);
    }
    applySmallScreen();
    panel.style.display = 'block';
    isOpen = true;
    button.innerHTML = ICON_CLOSE;
    button.setAttribute('aria-expanded', 'true');
    // En pantallas pequeñas el panel cubre todo: el botón se oculta (se cierra desde el chat).
    button.style.display = window.innerWidth < 480 ? 'none' : 'flex';
  }

  function close() {
    panel.style.display = 'none';
    isOpen = false;
    button.innerHTML = ICON_CHAT;
    button.setAttribute('aria-expanded', 'false');
    button.style.display = 'flex';
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  button.addEventListener('click', toggle);

  window.addEventListener('message', function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (data && data.type === 'koptup-chatbot:close' && data.botId === botId) close();
  });

  document.addEventListener('keydown', function (event) {
    if (isOpen && (event.key === 'Escape' || event.key === 'Esc')) close();
  });

  window.addEventListener('resize', function () {
    if (isOpen) open();
  });

  root.appendChild(panel);
  root.appendChild(button);

  function mount() {
    document.body.appendChild(root);
    if (openOnLoad) open();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  window.KoptupChatbot = window.KoptupChatbot || {};
  window.KoptupChatbot.open = open;
  window.KoptupChatbot.close = close;
  window.KoptupChatbot.toggle = toggle;
})();
