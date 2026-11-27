(function () {
  var ENDPOINT = document.body.getAttribute('data-endpoint');
  var SB_URL = document.body.getAttribute('data-sb-url');
  var SB_KEY = document.body.getAttribute('data-sb-key');
  var M = JSON.parse(document.body.getAttribute('data-msg') || '{}');
  var form = document.getElementById('q-form');
  if (!form) return;
  var started = Date.now();
  var msg = document.getElementById('q-msg');
  var btn = document.getElementById('q-send');

  function show(t, ok) {
    msg.textContent = t;
    msg.className = 'q-msg ' + (ok ? 'ok' : 'err');
  }

  // massimo 3 nella domanda "le 3 più importanti"
  var top = form.querySelectorAll('input[name="top3"]');
  top.forEach(function (c) {
    c.addEventListener('change', function () {
      var n = form.querySelectorAll('input[name="top3"]:checked').length;
      if (n > 3) { c.checked = false; show(M.err_max3, false); }
    });
  });

  // la lista "top 3" mostra solo le funzioni scelte prima
  var feats = form.querySelectorAll('input[data-feat]');
  function syncTop() {
    var chosen = {};
    feats.forEach(function (f) { if (f.checked) chosen[f.value] = 1; });
    var any = false;
    top.forEach(function (t) {
      var on = !!chosen[t.value];
      t.closest('label').style.display = on ? '' : 'none';
      if (!on) t.checked = false;
      any = any || on;
    });
    document.getElementById('top3-empty').style.display = any ? 'none' : '';
  }
  feats.forEach(function (f) { f.addEventListener('change', syncTop); });
  syncTop();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = '';
    // controlli
    var groups = form.querySelectorAll('[data-required]');
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var inputs = g.querySelectorAll('input, textarea');
      var filled = false;
      inputs.forEach(function (x) {
        if ((x.type === 'radio' || x.type === 'checkbox') ? x.checked : x.value.trim() !== '') filled = true;
      });
      if (!filled) {
        g.classList.add('miss');
        g.scrollIntoView({ behavior: 'smooth', block: 'center' });
        show(M.err_req, false);
        return;
      }
      g.classList.remove('miss');
    }
    // chi chiede lista d'attesa o chiamata deve lasciare almeno un contatto
    var it = form.querySelector('input[name="interesse"]:checked');
    var no = form.querySelectorAll('input[name="interesse"]');
    if (it && it !== no[no.length - 1]) {
      var em = form.elements.email.value.trim(), tel = form.elements.telefono.value.replace(/[^0-9]/g, '');
      var okEm = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em), okTel = tel.length >= 6;
      if (!okEm && !okTel) {
        var c = document.getElementById('q-contacts');
        c.classList.add('miss');
        c.scrollIntoView({ behavior: 'smooth', block: 'center' });
        show(M.err_contact, false);
        return;
      }
    }
    var data = new URLSearchParams();
    var obj = {};
    new FormData(form).forEach(function (v, k) {
      v = String(v).slice(0, 2000);
      data.append(k, v);
      obj[k] = obj[k] ? obj[k] + ' | ' + v : v;
    });
    var secs = String(Math.round((Date.now() - started) / 1000));
    data.append('t', secs);
    obj.t = secs;
    btn.disabled = true;
    btn.textContent = M.sending;

    // 1) database TourNeat (Supabase): l'unica cosa che il pubblico può fare è aggiungere una risposta
    var toDb = fetch(SB_URL + '/rest/v1/rpc/invia_risposta', {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: obj })
    }).then(function (r) { if (!r.ok) throw new Error('db ' + r.status); return true; });
    // 2) copia di sicurezza nel Foglio Google
    var toSheet = fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: data }).then(function () { return true; });

    Promise.allSettled([toDb, toSheet]).then(function (res) {
      if (res[0].status === 'fulfilled' || res[1].status === 'fulfilled') {
        form.style.display = 'none';
        var dn = document.getElementById('q-done');
        dn.style.display = 'block';
        dn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dn.focus({ preventScroll: true });
      } else {
        btn.disabled = false;
        btn.textContent = M.send;
        show(M.err_net, false);
      }
    });
  });

  form.addEventListener('input', function (e) {
    if (e.target.closest('#q-contacts')) document.getElementById('q-contacts').classList.remove('miss');
  });
  form.addEventListener('change', function (e) {
    var g = e.target.closest('[data-required]');
    if (g) g.classList.remove('miss');
    if (e.target.closest('#q-contacts')) document.getElementById('q-contacts').classList.remove('miss');
  });
})();
