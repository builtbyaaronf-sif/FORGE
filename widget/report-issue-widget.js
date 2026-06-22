(function () {
  'use strict';

  // ── Config (override via window.FORGE_WIDGET_CONFIG before script loads) ──
  var cfg      = window.FORGE_WIDGET_CONFIG || {};
  var API_URL  = cfg.apiUrl   || 'https://forgeisagentic.tech/api/report-issue';
  var SITE     = cfg.siteName || document.title || window.location.hostname;

  // ── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#forge-rb{position:fixed;bottom:20px;right:20px;z-index:2147483640;',
    'display:flex;align-items:center;gap:6px;padding:8px 16px;',
    'background:rgba(18,18,30,0.92);border:1px solid rgba(255,255,255,0.12);',
    'border-radius:24px;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    'font-size:12px;color:#aaa;backdrop-filter:blur(10px);transition:border-color .2s,color .2s;',
    'box-shadow:0 4px 20px rgba(0,0,0,0.4);}',
    '#forge-rb:hover{border-color:rgba(99,102,241,.6);color:#fff;}',
    '#forge-rp{position:fixed;bottom:70px;right:20px;z-index:2147483641;width:310px;',
    'background:#13131f;border:1px solid rgba(255,255,255,0.1);border-radius:16px;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;',
    'box-shadow:0 24px 60px rgba(0,0,0,0.6);display:none;overflow:hidden;}',
    '#forge-rp.frg-open{display:block;}',
    '#forge-rp-head{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:16px 20px;',
    'display:flex;justify-content:space-between;align-items:center;}',
    '#forge-rp-head h4{margin:0;font-size:14px;font-weight:700;}',
    '#forge-close{background:none;border:none;color:rgba(255,255,255,.7);font-size:20px;',
    'cursor:pointer;line-height:1;padding:0;}',
    '#forge-rp-body{padding:16px 18px;}',
    '#forge-ss-wrap{border-radius:8px;overflow:hidden;background:#0d0d1a;',
    'min-height:70px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;}',
    '#forge-ss-wrap img{width:100%;height:auto;display:block;}',
    '#forge-desc{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);',
    'border-radius:8px;color:#fff;padding:10px 12px;font-size:13px;resize:none;height:76px;',
    'box-sizing:border-box;font-family:inherit;outline:none;}',
    '#forge-desc:focus{border-color:rgba(99,102,241,.5);}',
    '#forge-send{width:100%;margin-top:10px;background:#6366f1;color:#fff;border:none;',
    'border-radius:8px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .2s;}',
    '#forge-send:hover{opacity:.88;}',
    '#forge-send:disabled{opacity:.5;cursor:default;}',
    '#forge-status{text-align:center;font-size:12px;color:#aaa;margin-top:8px;display:none;}'
  ].join('');
  document.head.appendChild(style);

  // ── Button ────────────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'forge-rb';
  btn.innerHTML = '<span style="font-size:14px">⚠️</span> Something wrong?';
  document.body.appendChild(btn);

  // ── Panel ─────────────────────────────────────────────────────────────────
  var panel = document.createElement('div');
  panel.id = 'forge-rp';
  panel.innerHTML =
    '<div id="forge-rp-head">' +
      '<h4>Report an issue</h4>' +
      '<button id="forge-close">×</button>' +
    '</div>' +
    '<div id="forge-rp-body">' +
      '<div id="forge-ss-wrap"><span style="color:#555;font-size:12px">Capturing screenshot…</span></div>' +
      '<textarea id="forge-desc" placeholder="What's wrong? e.g. 'Form won't submit', 'Page won't load'"></textarea>' +
      '<button id="forge-send">Send Report</button>' +
      '<div id="forge-status"></div>' +
    '</div>';
  document.body.appendChild(panel);

  var screenshotData = null;

  // ── Screenshot via html2canvas ────────────────────────────────────────────
  function capture() {
    return new Promise(function (resolve) {
      function shoot() {
        window.html2canvas(document.body, {
          scale: 0.45,
          useCORS: true,
          allowTaint: true,
          ignoreElements: function (el) {
            return el.id === 'forge-rp' || el.id === 'forge-rb';
          }
        }).then(function (canvas) {
          resolve(canvas.toDataURL('image/png'));
        }).catch(function () { resolve(null); });
      }
      if (window.html2canvas) { shoot(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = shoot;
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
  }

  // ── Open ──────────────────────────────────────────────────────────────────
  btn.addEventListener('click', function () {
    panel.classList.add('frg-open');
    btn.style.display = 'none';
    screenshotData = null;
    var wrap = document.getElementById('forge-ss-wrap');
    wrap.innerHTML = '<span style="color:#555;font-size:12px">Capturing screenshot…</span>';
    capture().then(function (data) {
      screenshotData = data;
      if (data) {
        var img = document.createElement('img');
        img.src = data;
        wrap.innerHTML = '';
        wrap.appendChild(img);
      } else {
        wrap.innerHTML = '<span style="color:#555;font-size:12px;padding:16px">Screenshot unavailable — describe the issue below</span>';
      }
    });
  });

  // ── Close ─────────────────────────────────────────────────────────────────
  document.getElementById('forge-close').addEventListener('click', function () {
    panel.classList.remove('frg-open');
    btn.style.display = 'flex';
    document.getElementById('forge-status').style.display = 'none';
    document.getElementById('forge-send').style.display = 'block';
    document.getElementById('forge-send').disabled = false;
    document.getElementById('forge-send').textContent = 'Send Report';
    document.getElementById('forge-desc').value = '';
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  document.getElementById('forge-send').addEventListener('click', function () {
    var desc = document.getElementById('forge-desc').value.trim();
    if (!desc) {
      document.getElementById('forge-desc').style.borderColor = '#f43f5e';
      setTimeout(function () {
        document.getElementById('forge-desc').style.borderColor = '';
      }, 1500);
      return;
    }

    var sendBtn = document.getElementById('forge-send');
    var status  = document.getElementById('forge-status');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    status.style.display = 'none';

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: desc,
        screenshot:  screenshotData,
        pageUrl:     window.location.href,
        siteName:    SITE,
        timestamp:   new Date().toISOString()
      })
    }).then(function () {
      sendBtn.style.display = 'none';
      status.style.display  = 'block';
      status.style.color    = '#4ade80';
      status.innerHTML      = '✓ Report sent — we\'ll look into it shortly.';
      document.getElementById('forge-desc').value = '';
      setTimeout(function () {
        panel.classList.remove('frg-open');
        btn.style.display = 'flex';
        sendBtn.style.display   = 'block';
        sendBtn.disabled        = false;
        sendBtn.textContent     = 'Send Report';
        status.style.display    = 'none';
      }, 2800);
    }).catch(function () {
      sendBtn.disabled     = false;
      sendBtn.textContent  = 'Send Report';
      status.style.display = 'block';
      status.style.color   = '#f43f5e';
      status.textContent   = 'Failed to send — please try again.';
    });
  });

})();
