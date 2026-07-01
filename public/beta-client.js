// FORGE Beta Page — /public/beta-client.js
// Countdown timer + Aesthetic picker + Report issue widget

// —— COUNTDOWN ——
(function() {
var end = new Date('2026-07-14T23:59:59Z').getTime();
function tick() {
var now = Date.now();
var diff = end - now;
if (diff <= 0) {
document.getElementById('cd-d').textContent = '00';
document.getElementById('cd-h').textContent = '00';
document.getElementById('cd-m').textContent = '00';
document.getElementById('cd-s').textContent = '00';
return;
}
var d = Math.floor(diff / 86400000);
var h = Math.floor((diff % 86400000) / 3600000);
var m = Math.floor((diff % 3600000) / 60000);
var s = Math.floor((diff % 60000) / 1000);
document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
}
tick();
setInterval(tick, 1000);
})();

// —— AESTHETIC PICKER ——
(function() {
var selectedAesthetic = sessionStorage.getItem('forge_aesthetic') || null;
var selectedLabel = sessionStorage.getItem('forge_aesthetic_label') || null;

var aestheticLabels = { A: 'Dark & Bold', B: 'Clean & Professional', C: 'Warm & Artisan' };

function updatePaypalItemNames(aesthetic, label) {
var inputs = document.querySelectorAll('.paypal-item-name');
inputs.forEach(function(input) {
var base = input.value.replace(/\s*\[Style:[^\]]*\]/, '');
input.value = base + ' [Style: ' + label + ']';
});
}

function updateBanner(aesthetic, label) {
var banner = document.getElementById('aesthetic-selection-banner');
var bannerText = document.getElementById('aesthetic-banner-text');
if (banner && bannerText && aesthetic) {
bannerText.textContent = 'Style selected: ' + label + ' — your website will use this design direction.';
banner.style.display = 'flex';
}
}

function applySelection(aesthetic, label, scrollToPackages) {
selectedAesthetic = aesthetic;
selectedLabel = label;
sessionStorage.setItem('forge_aesthetic', aesthetic);
sessionStorage.setItem('forge_aesthetic_label', label);

// Update card states
document.querySelectorAll('.aesthetic-card').forEach(function(card) {
card.classList.toggle('aesthetic-card--selected', card.dataset.aesthetic === aesthetic);
});

// Update PayPal item names
updatePaypalItemNames(aesthetic, label);

// Update the confirmation banner
updateBanner(aesthetic, label);

// Scroll to packages
if (scrollToPackages) {
setTimeout(function() {
var pkgSection = document.getElementById('packages');
if (pkgSection) pkgSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 300);
}
}

// Restore from session on page load
if (selectedAesthetic) {
applySelection(selectedAesthetic, selectedLabel || aestheticLabels[selectedAesthetic], false);
}

// Bind card clicks
document.querySelectorAll('.aesthetic-card').forEach(function(card) {
card.addEventListener('click', function() {
var aesthetic = card.dataset.aesthetic;
var label = card.dataset.label || aestheticLabels[aesthetic] || aesthetic;
applySelection(aesthetic, label, true);
});
});

// Intercept PayPal form submits — warn if no aesthetic selected
document.querySelectorAll('.pkg-form').forEach(function(form) {
form.addEventListener('submit', function(e) {
if (!selectedAesthetic) {
e.preventDefault();
var picker = document.getElementById('style-picker');
if (picker) {
picker.scrollIntoView({ behavior: 'smooth' });
picker.classList.add('aesthetic-section--highlight');
setTimeout(function() { picker.classList.remove('aesthetic-section--highlight'); }, 1500);
}
}
});
});
})();

// —— REPORT ISSUE WIDGET ——
(function() {
var WIDGET_API = 'https://forgeisagentic.tech/api/report-issue';
var SITE_NAME = 'FORGE Beta';
var btn = document.getElementById('forge-rb');
var panel = document.getElementById('forge-rp');
var ssWrap = document.getElementById('forge-ss-wrap');
var ssImg = document.getElementById('forge-ss-img');
var desc = document.getElementById('forge-desc');
var send = document.getElementById('forge-send');
var status = document.getElementById('forge-status');
var html2canvasLoaded = false;
var screenshotData = null;
var panelOpen = false;

function loadHtml2Canvas(cb) {
if (html2canvasLoaded) { cb(); return; }
var s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
s.onload = function() { html2canvasLoaded = true; cb(); };
document.head.appendChild(s);
}

function takeScreenshot(cb) {
loadHtml2Canvas(function() {
panel.style.display = 'none';
btn.style.display = 'none';
setTimeout(function() {
html2canvas(document.body, { useCORS: true, scale: 0.6, logging: false })
.then(function(canvas) {
screenshotData = canvas.toDataURL('image/png');
ssImg.src = screenshotData;
ssWrap.style.display = 'block';
panel.style.display = 'block';
btn.style.display = 'flex';
cb && cb();
})
.catch(function() {
panel.style.display = 'block';
btn.style.display = 'flex';
});
}, 150);
});
}

btn.addEventListener('click', function() {
if (panelOpen) {
panel.style.display = 'none';
panelOpen = false;
} else {
panelOpen = true;
status.textContent = 'Capturing screenshot…';
panel.style.display = 'block';
takeScreenshot(function() { status.textContent = ''; });
}
});

send.addEventListener('click', function() {
send.disabled = true;
status.textContent = 'Sending…';
fetch(WIDGET_API, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
description: desc.value || '(no description)',
screenshot: screenshotData || null,
pageUrl: window.location.href,
siteName: SITE_NAME,
timestamp: new Date().toISOString()
})
})
.then(function(r) { return r.json(); })
.then(function() {
status.textContent = '✓ Sent. Thanks for the feedback.';
desc.value = '';
screenshotData = null;
ssWrap.style.display = 'none';
send.disabled = false;
setTimeout(function() {
panel.style.display = 'none';
panelOpen = false;
status.textContent = '';
}, 2500);
})
.catch(function() {
status.textContent = 'Could not send. Try again.';
send.disabled = false;
});
});
})();
