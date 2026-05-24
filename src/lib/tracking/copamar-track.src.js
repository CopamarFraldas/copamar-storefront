/*!
 * copamar-track — tracking on-site LGPD-compliant (Copamar Fraldas)
 * FONTE LEGÍVEL. NÃO é importado pelo app — é minificado para /public/copamar-track.js
 * Build:  npx terser src/lib/tracking/copamar-track.src.js -c -m -o public/copamar-track.js
 *
 * Regras:
 *  - ZERO eventos sem consentimento de analytics (localStorage copamar_consent_v1).
 *  - Vanilla JS, zero dependências, IIFE. Tudo fire-and-forget (não bloqueia render).
 *  - 8 eventos automáticos: page_view, product_view, add_to_cart, begin_checkout,
 *    click_whatsapp, time_on_page, scroll_depth, exit_intent.
 */
(function () {
  'use strict';
  if (window.__copamarTrackLoaded) return;
  window.__copamarTrackLoaded = true;

  var ENDPOINT    = 'https://n8n.copamarfraldas.com.br/webhook/track';
  var CONSENT_KEY = 'copamar_consent_v1';
  var UUID_KEY    = 'copamar_uuid_anon';
  var SESSION_KEY = 'copamar_session';
  var SESSION_TTL = 30 * 60 * 1000; // 30min de inatividade encerra a sessão
  var BATCH_MS    = 5000;           // envia a fila a cada 5s
  var MAX_BATCH   = 50;             // servidor aceita até 100; folga de segurança

  // ---- localStorage seguro (pode estar bloqueado em modo privado/iframe) ----
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ---- consentimento (a checagem que importa — defesa client-side) ----
  function hasConsent() {
    try {
      var c = JSON.parse(lsGet(CONSENT_KEY) || 'null');
      return !!(c && c.analytics === true);
    } catch (e) { return false; }
  }

  // ---- UUID v4 (anônimo, persistente) ----
  function uuidv4() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  var uuid = (function () {
    var u = lsGet(UUID_KEY);
    if (!u) { u = uuidv4(); lsSet(UUID_KEY, u); }
    return u;
  })();

  // ---- sessão (renova janela de 30min a cada evento) ----
  function sessionId() {
    var now = Date.now(), s = null;
    try { s = JSON.parse(lsGet(SESSION_KEY) || 'null'); } catch (e) {}
    if (!s || (now - s.t) > SESSION_TTL) s = { id: uuidv4(), t: now };
    else s.t = now;
    lsSet(SESSION_KEY, JSON.stringify(s));
    return s.id;
  }

  // ---- fila + envio ----
  var queue = [], timer = null, enterTs = Date.now();
  var scrollMarks = {}, sentExit = false, sentTime = false, lastUrl = location.href;

  function send(tipo, extra) {
    if (!hasConsent()) return; // ZERO sem consentimento
    var ev = {
      tipo: tipo,
      url: location.pathname + location.search,
      referrer: document.referrer || '',
      sessao_id: sessionId(),
      ts: new Date().toISOString()
    };
    if (extra) for (var k in extra) if (extra[k] != null) ev[k] = extra[k];
    queue.push(ev);
    if (!timer) timer = setTimeout(function () { timer = null; flush(); }, BATCH_MS);
    if (queue.length >= MAX_BATCH) flush();
  }

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!queue.length || !hasConsent()) { queue = []; return; }
    var batch = queue.splice(0, MAX_BATCH);
    var body = JSON.stringify({ uuid: uuid, eventos: batch });
    // fetch + keepalive: sobrevive ao unload (como sendBeacon) MAS faz CORS/preflight
    // corretamente p/ JSON cross-origin — sendBeacon com application/json é descartado
    // no preflight. keepalive é o substituto moderno e recomendado do sendBeacon.
    try {
      fetch(ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: body, keepalive: true, credentials: 'omit', mode: 'cors'
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- extração best-effort de dados de produto ----
  function attr(sel, a) { var el = document.querySelector(sel); return el ? el.getAttribute(a) : null; }
  function productData() {
    var d = {};
    // data-attributes explícitos têm prioridade (se o storefront os expuser no futuro)
    d.sku = attr('[data-track-sku]', 'data-track-sku');
    d.categoria = attr('[data-track-categoria]', 'data-track-categoria');
    var p = attr('[data-track-preco]', 'data-track-preco');
    // fallback: handle do produto na URL (/br/products/<handle>)
    if (!d.sku) {
      var m = location.pathname.match(/\/products\/([^\/?#]+)/i);
      if (m) d.sku = decodeURIComponent(m[1]);
    }
    if (p) d.preco = String(p).replace(/[^\d.,]/g, '').replace(',', '.');
    return d;
  }
  function isProductPage() { return /\/products\//i.test(location.pathname); }
  function isCheckoutPage() { return /\/checkout(\/|$)/i.test(location.pathname); }

  // ---- page_view (+ product_view / begin_checkout derivados) ----
  function pageView() {
    enterTs = Date.now(); scrollMarks = {}; sentExit = false; sentTime = false;
    send('page_view');
    if (isProductPage()) send('product_view', productData());
    if (isCheckoutPage()) send('begin_checkout');
  }

  // ---- SPA: Next.js troca rota via History API (sem reload) ----
  function onRoute() {
    setTimeout(function () {
      if (location.href !== lastUrl) { flush(); lastUrl = location.href; pageView(); }
    }, 60);
  }
  function hookHistory() {
    ['pushState', 'replaceState'].forEach(function (m) {
      var orig = history[m];
      history[m] = function () { var r = orig.apply(this, arguments); onRoute(); return r; };
    });
    window.addEventListener('popstate', onRoute);
  }

  // ---- scroll_depth (marcos 25/50/75/100) ----
  function onScroll() {
    var h = document.documentElement, b = document.body;
    var top = h.scrollTop || b.scrollTop;
    var max = (h.scrollHeight || b.scrollHeight) - h.clientHeight;
    if (max <= 0) return;
    var pct = Math.round(top / max * 100);
    [25, 50, 75, 100].forEach(function (mk) {
      if (pct >= mk && !scrollMarks[mk]) { scrollMarks[mk] = 1; send('scroll_depth', { metadata: { percent: mk } }); }
    });
  }

  // ---- click_whatsapp + add_to_cart (delegação no document) ----
  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var link = t.closest('a[href]');
    if (link) {
      var href = link.getAttribute('href') || '';
      if (/wa\.me|api\.whatsapp|whatsapp\.com/i.test(href)) {
        send('click_whatsapp', { metadata: { destino: href } });
        return;
      }
    }
    // botão oficial de adicionar ao carrinho do Medusa storefront
    if (t.closest('[data-testid="add-product-button"]')) {
      send('add_to_cart', productData());
    }
  }

  // ---- time_on_page + exit_intent ----
  function onLeave() {
    if (sentTime) return;
    sentTime = true;
    send('time_on_page', { metadata: { segundos: Math.round((Date.now() - enterTs) / 1000) } });
    flush(); // fetch keepalive sobrevive ao unload
  }
  function onMouseOut(e) {
    if (!sentExit && e.clientY <= 0 && !e.relatedTarget) { sentExit = true; send('exit_intent'); }
  }

  // ---- start (idempotente; só com consentimento) ----
  var started = false;
  function start() {
    if (started || !hasConsent()) return;
    started = true;
    hookHistory();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick, true);
    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('pagehide', onLeave);
    // visibilitychange é o sinal mais confiável de "saindo" (sobretudo mobile,
    // onde pagehide/beforeunload falham) — padrão recomendado (web.dev)
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') onLeave();
    });
    pageView();
  }

  // ---- API pública + reação ao consentimento ----
  window.copamarTrack = function (tipo, extra) { send(tipo, extra); };
  window.copamarTrack.flush = function () { flush(); };
  // banner dispara este evento ao salvar → tracking começa na hora (sem reload)
  window.addEventListener('copamar-consent-updated', function () { if (hasConsent()) start(); });

  if (hasConsent()) start();
})();
