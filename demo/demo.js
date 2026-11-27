(function () {
  'use strict';
  var D = window.DEMO;
  var $ = function (s) { return document.querySelector(s); };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- stato (in memoria: si azzera a ogni apertura) ---------- */
  var ST = {
    role: 'tm',
    arrivi: {},          // chiave "giorno-replica-scuola" -> 'ok' | 'late'
    todo: { 0: true, 1: true },
    check: {},
    selDay: D.OGGI, selRep: 0, calMode: 'mese', teatro: null,
    bp: { prezzo: 9, scen: 1, sala: 800, paga: 120, camera: 70 }
  };

  var IC = {
    oggi: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    controllo: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    tournee: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    piantine: '<path d="M4 18c3-6 13-6 16 0"/><path d="M6 14c2.5-3.5 9.5-3.5 12 0"/><path d="M8 10c2-2 6-2 8 0"/>',
    accoglienza: '<path d="M16 11a4 4 0 1 0-8 0"/><path d="M3 21a9 9 0 0 1 18 0"/>',
    mappa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    teatri: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6"/>',
    checklist: '<path d="M9 11l2 2 4-4"/><rect x="4" y="3" width="16" height="18" rx="3"/>',
    squadra: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 20a4.5 4.5 0 0 1 8 0"/>',
    documenti: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/>',
    permessi: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="M9 12l2 2 4-4"/>',
    budget: '<path d="M16.5 7.5A5.5 5.5 0 1 0 16.5 16.5"/><path d="M5 10.5h8M5 13.5h8"/>',
    telefono: '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 18h2"/>'
  };
  var MENU = {
    tm: [['oggi', 'Oggi'], ['tournee', 'Tournée'], ['piantine', 'Piantine'], ['accoglienza', 'Accoglienza'], ['mappa', 'Mappa'], ['teatri', 'Teatri'], ['checklist', 'Checklist'], ['squadra', 'Squadra'], ['documenti', 'Documenti']],
    dir: [['controllo', 'Controllo'], ['budget', 'Business plan'], ['tournee', 'Tournée'], ['mappa', 'Mappa'], ['piantine', 'Piantine'], ['teatri', 'Teatri'], ['squadra', 'Squadra e accessi'], ['permessi', 'Permessi e diritti'], ['documenti', 'Documenti']],
    cast: [['telefono', 'App del cast']]
  };
  var CHI = { tm: ['Giulia Rossi', 'Tour manager', 'GR'], dir: ['Marco Bianchi', 'Direzione', 'MB'], cast: ['Sara Verdi', 'Cast artistico', 'SV'] };
  function ic(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || IC.oggi) + '</svg>'; }

  /* ---------- utilità ---------- */
  function giorno(i) { return D.date[i]; }
  function titoloGiorno(g) { return g.giorno + ' ' + g.data + ' ' + g.mese; }
  function prossimaData(i) { for (var k = i; k < D.date.length; k++) if (D.date[k].citta) return k; return i; }
  function km(a, b) {
    if (!a || !b) return 0;
    var p = D.citta[a], q = D.citta[b]; if (!p || !q) return 0;
    var dx = (p[1] - q[1]) * 78, dy = (p[0] - q[0]) * 111; return Math.round(Math.sqrt(dx * dx + dy * dy) * 1.25);
  }
  function arrKey(gi, ri, s) { return gi + '-' + ri + '-' + s; }

  /* ---------- piantina ---------- */
  function seatmap(rep, compact) {
    var nr = Math.ceil((-13 + Math.sqrt(169 + 4 * rep.posti)) / 2), rows = 'ABCDEFGHILMNOPQRSTUVZ'.slice(0, Math.max(6, nr));
    var maxN = 6 + rows.length, W = Math.max(520, 2 * (14 + maxN * 11) + 40), cx = W / 2, H = 70 + rows.length * 22, R = W * 3.2;
    var per = []; for (var r = 0; r < rows.length; r++) per.push((7 + r) * 2);
    var tot = rep.posti;
    var fill = [], gi = 0, left = rep.gruppi.length ? rep.gruppi[0].n : 0;
    for (var s = 0; s < tot; s++) {
      while (gi < rep.gruppi.length && left <= 0) { gi++; left = gi < rep.gruppi.length ? rep.gruppi[gi].n : 0; }
      if (gi < rep.gruppi.length) { fill.push(rep.gruppi[gi].col); left--; } else fill.push(null);
    }
    var idx = 0, parts = [];
    for (r = 0; r < rows.length; r++) {
      var nside = per[r] / 2, y = H - 58 - r * 22;
      var rowSeats = [];
      for (var side = -1; side <= 1; side += 2) for (var k = 0; k < nside; k++) {
        var x = cx + side * (12 + k * 11); rowSeats.push([x, y + (x - cx) * (x - cx) / R]);
      }
      rowSeats.sort(function (a, b) { return Math.abs(a[0] - cx) - Math.abs(b[0] - cx); });
      rowSeats.forEach(function (p) {
        if (idx >= tot) return;
        var c = fill[idx++]; parts.push('<rect x="' + (p[0] - 4.5).toFixed(1) + '" y="' + p[1].toFixed(1) + '" width="9" height="9" rx="2.5" fill="' + (c || 'var(--seat)') + '"/>');
      });
      parts.push('<text x="' + cx + '" y="' + (y + 8) + '" class="rw">' + rows[r] + '</text>');
    }
    parts.push('<rect x="' + (cx - 110) + '" y="' + (H - 30) + '" width="220" height="22" rx="8" class="stage"/><text x="' + cx + '" y="' + (H - 15) + '" class="st">PALCOSCENICO</text>');
    return '<svg viewBox="0 20 ' + W + ' ' + (H - 20) + '" role="img" aria-label="Piantina dei posti">' + parts.join('') + '</svg>';
  }
  function legenda(rep) {
    return '<div class="legend">' + rep.gruppi.map(function (g) { return '<span class="lg"><i style="background:' + g.col + '"></i>' + esc(g.scuola) + ' <b>' + g.n + '</b></span>'; }).join('') + '</div>';
  }

  /* ---------- schermate ---------- */
  var V = {};

  V.oggi = function () {
    var i = prossimaData(D.OGGI), g = giorno(i), dom = giorno(prossimaData(i + 1));
    var r = g.repliche[ST.selRep] || g.repliche[0];
    var todo = ['Ritirare le chiavi dei camerini', 'Posizionare il roll-up nel foyer', 'Confermare l’hotel di domani', 'Foto del palco per l’archivio teatri', 'Inviare la checklist di fine giornata'];
    var fatti = todo.filter(function (_, k) { return ST.todo[k]; }).length;
    var h = '<div class="top"><div><div class="eyebrow">Oggi · giorno ' + g.n + ' di ' + D.date.length + '</div><h1>' + esc(g.giorno + ' ' + g.data + ' · ' + g.citta) + '</h1>' +
      '<div class="sub">“' + esc(g.spettacolo.titolo) + '” · ' + esc(g.teatro.nome) + ' · ' + g.repliche.length + (g.repliche.length > 1 ? ' repliche' : ' replica') + '</div></div>' +
      '<div class="chips"><span class="chip">☀︎ 12° · sereno</span><span class="chip">Domani: ' + esc(dom.citta) + ' · ' + km(g.citta, dom.citta) + ' km</span><button class="btn y" data-toast="Giornata scaricata per l’uso senza rete">Scarica la giornata</button></div></div>';
    h += '<div class="grid"><section class="card c8"><div class="ch"><h2>Piantina di sala</h2>' + segRep(g) + '</div><div class="map">' + seatmap(r) + '</div>' + legenda(r) +
      '<div class="stats"><div><b>' + r.tot + '</b>prenotati</div><div><b>' + (r.posti - r.tot) + '</b>posti liberi</div><div><b>' + g.teatro.accessibili + '</b>posti accessibili</div></div></section>';
    h += '<section class="card c4"><div class="ch"><h2>Arrivi · replica ' + esc(r.ora) + '</h2><a href="#accoglienza">Tutti</a></div>' + arriviList(i, ST.selRep, r) + '</section>';
    var prog = [['7:30', 'Montaggio scena e luci', 'Tecnici', 'done'], ['9:00', 'Prova microfoni', 'Cast', 'done'], ['9:30', 'Accoglienza scuole', 'Adesso', 'now']];
    g.repliche.forEach(function (x, k) { prog.push([x.ora, 'Replica ' + (k + 1), x.tot + ' posti', '']); });
    prog.push(['14:00', 'Smontaggio e carico', 'Tecnici', '']); prog.push(['15:30', 'Partenza per ' + dom.citta, km(g.citta, dom.citta) + ' km', '']);
    h += '<section class="card c6"><div class="ch"><h2>Programma</h2><span class="lnk">Ora 9:41</span></div><ul class="tl">' + prog.map(function (p) {
      return '<li class="' + p[3] + '"><time>' + p[0] + '</time><span class="dot"></span><span>' + esc(p[1]) + '</span><span class="tag' + (p[3] === 'now' ? ' y' : '') + '">' + esc(p[2]) + '</span></li>';
    }).join('') + '</ul></section>';
    h += '<section class="card c6"><div class="ch"><h2>Da fare</h2><span class="lnk">' + fatti + ' di ' + todo.length + '</span></div><ul class="todo">' + todo.map(function (t, k) {
      return '<li class="' + (ST.todo[k] ? 'done' : '') + '" data-todo="' + k + '" role="checkbox" aria-checked="' + !!ST.todo[k] + '" tabindex="0"><span class="ck"></span>' + esc(t) + '</li>';
    }).join('') + '</ul></section>';
    h += '<section class="card c6"><div class="ch"><h2>Hotel di stanotte</h2><a href="#mappa">Indicazioni</a></div>' + kv('Struttura', g.hotel.nome + ' ★★★') + kv('Check-in', 'dalle 16:00') + kv('Camere', g.hotel.camere) + kv('Pagamento', g.hotel.pagamento) + '</section>';
    h += '<section class="card c6"><div class="ch"><h2>Pranzo vicino al teatro</h2><a href="#mappa">Mappa</a></div><div class="near"><div class="pl"><b>Trattoria Esempio</b><small>350 m · menu fisso 14 €</small></div><div class="pl"><b>Bistrot Demo</b><small>500 m · veloce</small></div><div class="pl"><b>Pizzeria Prova</b><small>700 m · gruppi</small></div></div></section></div>';
    return h;
  };
  function kv(a, b) { return '<div class="kv"><span>' + esc(a) + '</span><b>' + esc(b) + '</b></div>'; }
  function segRep(g) {
    if (g.repliche.length < 2) return '<span class="lnk">Replica ' + esc(g.repliche[0].ora) + '</span>';
    return '<div class="seg">' + g.repliche.map(function (r, k) { return '<button class="' + (k === ST.selRep ? 'on' : '') + '" data-rep="' + k + '">Replica ' + esc(r.ora) + '</button>'; }).join('') + '</div>';
  }
  function arriviList(gi, ri, r) {
    return '<ul class="arr">' + r.gruppi.map(function (s, k) {
      var st = ST.arrivi[arrKey(gi, ri, k)];
      var lab = st === 'ok' ? 'arrivata' : st === 'late' ? 'in ritardo' : 'attesa ' + (k === 0 ? '9:35' : k === 1 ? '9:40' : '9:45');
      return '<li><span class="sw" style="background:' + s.col + '"></span><div class="nm"><b>' + esc(s.scuola) + '</b><small>' + s.n + ' studenti · ' + s.docenti + ' docenti</small></div>' +
        '<button class="st2 ' + (st || 'wait') + '" data-arr="' + arrKey(gi, ri, k) + '" title="Cambia stato" style="border:0;background:none">' + lab + '</button></li>';
    }).join('') + '</ul><p class="note">Tocca lo stato per segnare l’arrivo.</p>';
  }

  V.controllo = function () {
    var attive = D.date.filter(function (g) { return g.citta; });
    var rep = 0, spett = 0, cap = 0; attive.forEach(function (g) { g.repliche.forEach(function (r) { rep++; spett += r.tot; cap += r.posti; }); });
    var fatte = attive.filter(function (g) { return g.n <= D.OGGI; }).length;
    var h = '<div class="top"><div><div class="eyebrow">Controllo</div><h1>Tournée di primavera</h1><div class="sub">' + esc(D.compagnia.nome) + ' · ' + attive.length + ' date in ' + Object.keys(D.citta).length + ' città</div></div></div>';
    h += '<div class="grid">' + [['Date fatte', fatte + ' / ' + attive.length], ['Repliche totali', rep], ['Spettatori prenotati', spett.toLocaleString('it-IT')], ['Riempimento medio', Math.round(spett / cap * 100) + '%']].map(function (k) {
      return '<section class="card" style="grid-column:span 3"><div class="sub" style="margin:0">' + k[0] + '</div><div style="font-size:30px;font-weight:700;letter-spacing:-.03em">' + k[1] + '</div></section>';
    }).join('');
    h += '<section class="card c8"><div class="ch"><h2>Da sistemare</h2></div><ul class="list">' + [
      ['bad', 'Hotel di Treviso non ancora confermato', 'giorno 19'], ['warn', 'Documento di Luca Neri in scadenza', 'tra 12 giorni'],
      ['warn', 'Permesso di rappresentazione da inviare per Trento', 'entro venerdì'], ['bad', 'Manca il documento di Anna Fabbri', 'cast tecnico'], ['ok', 'Piantine della prossima settimana pronte', '8 repliche']
    ].map(function (a) { return '<li class="row" style="cursor:default"><span class="badge ' + a[0] + '"></span><div class="m"><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div></li>'; }).join('') + '</ul></section>';
    h += '<section class="card c4"><div class="ch"><h2>Prossime date</h2><a href="#tournee">Tutte</a></div><ul class="list">' + D.date.slice(D.OGGI, D.OGGI + 8).filter(function (g) { return g.citta; }).slice(0, 5).map(rigaData).join('') + '</ul></section></div>';
    return h;
  };
  function rigaData(g) {
    var cls = g.citta ? (g.n - 1 === D.OGGI ? 'row today' : 'row') : 'row off';
    return '<li class="' + cls + '" ' + (g.citta ? 'data-day="' + (g.n - 1) + '"' : '') + '><div class="d"><b>' + g.data + '</b><small>' + esc(g.giorno.slice(0, 3)) + '</small></div><div class="m"><b>' + esc(g.citta || 'Riposo') + '</b>' +
      (g.citta ? '<small>' + esc(g.teatro.nome) + ' · ' + g.repliche.map(function (r) { return r.ora; }).join(' · ') + '</small>' : '<small>Nessuna replica</small>') + '</div>' +
      (g.citta ? '<span class="tag">' + g.repliche.reduce(function (s, r) { return s + r.tot; }, 0) + ' spettatori</span>' : '') + '</li>';
  }

  V.tournee = function () {
    var h = '<div class="top"><div><div class="eyebrow">Tournée</div><h1>Marzo – aprile</h1><div class="sub">“Il viaggio di Ulisse” e “La tempesta in tasca”</div></div>' +
      '<div class="seg"><button class="' + (ST.calMode === 'mese' ? 'on' : '') + '" data-cal="mese">Calendario</button><button class="' + (ST.calMode === 'lista' ? 'on' : '') + '" data-cal="lista">Elenco</button></div></div>';
    if (ST.calMode === 'lista') return h + '<section class="card"><ul class="list">' + D.date.map(rigaData).join('') + '</ul></section>';
    var mesi = [['marzo', 0, 31, 0], ['aprile', 31, 30, 3]]; // nome, indice del giorno 1, giorni nel mese, giorno della settimana del 1 (0 = lunedì)
    var m = mesi[ST.mese || 0];
    h += '<section class="gc"><div class="gc-h"><div class="gc-t">' + esc(m[0].charAt(0).toUpperCase() + m[0].slice(1)) + '</div>' +
      '<div class="gc-nav"><button data-mese="0" aria-label="Mese precedente"' + (ST.mese ? '' : ' disabled') + '>‹</button><button data-oggi>Oggi</button><button data-mese="1" aria-label="Mese successivo"' + (ST.mese ? ' disabled' : '') + '>›</button></div>' +
      '<div class="gc-leg">' + D.spettacoli.map(function (sp, k) { return '<span><i class="ev' + k + '"></i>' + esc(sp.titolo) + '</span>'; }).join('') + '</div></div>';
    h += '<div class="gc-g">' + ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'].map(function (d) { return '<div class="gc-wd">' + d + '</div>'; }).join('');
    var celle = Math.ceil((m[3] + m[2]) / 7) * 7;
    for (var c = 0; c < celle; c++) {
      var num = c - m[3] + 1, dentro = num >= 1 && num <= m[2], gi = m[1] + num - 1, g = dentro ? D.date[gi] : null;
      var wk = c % 7 >= 5;
      if (!dentro) { h += '<div class="gc-c out' + (wk ? ' wk' : '') + '"><span class="gc-n">' + (num < 1 ? (ST.mese ? 31 : 28) + num : num - m[2]) + '</span></div>'; continue; }
      var cls = 'gc-c' + (wk ? ' wk' : '') + (gi === D.OGGI ? ' today' : '');
      if (!g || !g.citta) { h += '<div class="' + cls + '"><span class="gc-n">' + num + '</span></div>'; continue; }
      var sk = D.spettacoli.indexOf(g.spettacolo);
      h += '<div class="' + cls + '"><span class="gc-n">' + num + '</span>' + g.repliche.map(function (r) {
        return '<button class="ev ev' + sk + '" data-day="' + gi + '"><b>' + esc(r.ora) + '</b> ' + esc(g.citta) + '</button>';
      }).join('') + '</div>';
    }
    return h + '</div></section>';
  };

  V.giorno = function () {
    var g = giorno(ST.selDay);
    var h = '<button class="back" data-go="tournee">‹ Tournée</button><div class="top"><div><div class="eyebrow">Giorno ' + g.n + '</div><h1>' + esc(titoloGiorno(g) + ' · ' + g.citta) + '</h1><div class="sub">“' + esc(g.spettacolo.titolo) + '” · ' + esc(g.teatro.nome) + '</div></div></div><div class="grid">';
    g.repliche.forEach(function (r, k) {
      h += '<section class="card c6"><div class="ch"><h2>Replica ' + esc(r.ora) + '</h2><span class="lnk">' + r.tot + ' / ' + r.posti + ' posti</span></div><div class="map">' + seatmap(r) + '</div>' + legenda(r) + '</section>';
    });
    h += '<section class="card c6"><div class="ch"><h2>Teatro</h2></div>' + kv('Sala', g.teatro.nome + ', ' + g.citta) + kv('Palco', g.teatro.palco) + kv('Carico', g.teatro.carico) + kv('Contatto', g.teatro.contatto) + '</section>';
    h += '<section class="card c6"><div class="ch"><h2>Hotel</h2></div>' + kv('Struttura', g.hotel.nome) + kv('Camere', g.hotel.camere) + kv('Pagamento', g.hotel.pagamento) + '</section></div>';
    return h;
  };

  V.piantine = function () {
    var i = ST.selDay, g = giorno(i); if (!g.citta) { i = prossimaData(i); g = giorno(i); }
    var r = g.repliche[ST.selRep] || g.repliche[0];
    var opts = D.date.map(function (x, k) { return x.citta ? '<option value="' + k + '"' + (k === i ? ' selected' : '') + '>' + esc(x.data + ' ' + x.mese + ' · ' + x.citta) + '</option>' : ''; }).join('');
    var h = '<div class="top"><div><div class="eyebrow">Piantine</div><h1>' + esc(g.teatro.nome) + '</h1><div class="sub">' + esc(titoloGiorno(g) + ' · ' + g.citta) + '</div></div>' +
      '<div class="chips"><select id="pdSel" class="role-sel" style="font:inherit;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink)">' + opts + '</select>' + segRep(g) + '</div></div>';
    h += '<div class="grid"><section class="card c8"><div class="map">' + seatmap(r) + '</div>' + legenda(r) + '</section><section class="card c4"><div class="ch"><h2>Come è stata fatta</h2></div>' +
      '<p class="sub" style="margin:0 0 10px">TourNeat sistema i gruppi da solo, secondo regole che decidi tu.</p>' +
      kv('Gruppi uniti', 'sì, ogni classe vicina') + kv('Prime file', 'scuole più piccole') + kv('Posti accessibili', g.teatro.accessibili + ' riservati') + kv('Docenti', 'a fine fila') +
      '<button class="btn" style="margin-top:14px" data-toast="Piantina ricalcolata">Ricalcola</button> <button class="btn y" style="margin-top:14px" data-toast="PDF della piantina pronto">PDF per il teatro</button></section></div>';
    return h;
  };

  V.accoglienza = function () {
    var i = prossimaData(D.OGGI), g = giorno(i);
    var h = '<div class="top"><div><div class="eyebrow">Accoglienza · oggi</div><h1>Arrivi delle scuole</h1><div class="sub">' + esc(g.teatro.nome + ' · ' + g.citta) + '</div></div></div><div class="grid">';
    g.repliche.forEach(function (r, k) {
      var ok = r.gruppi.filter(function (_, j) { return ST.arrivi[arrKey(i, k, j)] === 'ok' || ST.arrivi[arrKey(i, k, j)] === 'late'; }).length;
      h += '<section class="card c6"><div class="ch"><h2>Replica ' + esc(r.ora) + '</h2><span class="lnk">' + ok + ' di ' + r.gruppi.length + ' arrivate</span></div>' + arriviList(i, k, r) + '</section>';
    });
    h += '<section class="card c12"><div class="ch"><h2>Codici QR per i docenti</h2></div><p class="sub" style="margin:0">Ogni docente riceve un codice: all’ingresso lo mostra e la scuola risulta arrivata, con l’orario.</p></section></div>';
    return h;
  };

  V.mappa = function () {
    var pts = [], seen = {}, W = 700, H = 420;
    var lat0 = 44.2, lat1 = 46.3, lon0 = 7.3, lon1 = 12.6;
    function P(c) { var p = D.citta[c]; return [30 + (p[1] - lon0) / (lon1 - lon0) * (W - 60), 20 + (lat1 - p[0]) / (lat1 - lat0) * (H - 40)]; }
    var seq = D.date.filter(function (g) { return g.citta; }).map(function (g) { return g.citta; });
    var path = seq.map(function (c, k) { var p = P(c); return (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var oggi = giorno(prossimaData(D.OGGI)).citta;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Percorso della tournée"><rect x="0" y="0" width="' + W + '" height="' + H + '" rx="16" class="coast"/><path d="' + path + '" class="route"/>';
    seq.forEach(function (c) {
      if (seen[c]) return; seen[c] = 1; var p = P(c);
      svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (c === oggi ? 8 : 5) + '" class="pin' + (c === oggi ? ' now' : '') + '"/><text x="' + (p[0] + 10) + '" y="' + (p[1] + 4) + '" class="pinl">' + esc(c) + '</text>';
    });
    svg += '</svg>';
    var tot = 0; for (var k = 1; k < seq.length; k++) tot += km(seq[k - 1], seq[k]);
    return '<div class="top"><div><div class="eyebrow">Mappa</div><h1>Il percorso</h1><div class="sub">' + seq.length + ' tappe · circa ' + tot.toLocaleString('it-IT') + ' km</div></div></div>' +
      '<div class="grid"><section class="card c8 mapbig">' + svg + '<p class="note">Schema del percorso. Nell’app vera la mappa è navigabile, con hotel, teatri e ristoranti.</p></section>' +
      '<section class="card c4"><div class="ch"><h2>Avvisi sulle tappe</h2></div><ul class="list">' +
      [['bad', 'Treviso', 'hotel da confermare'], ['warn', 'Trento', 'permesso da inviare'], ['warn', 'Bologna', 'ZTL: permesso caricato, verificare targa'], ['ok', 'Bergamo', 'tutto pronto']].map(function (a) {
        return '<li class="row" style="cursor:default"><span class="badge ' + a[0] + '"></span><div class="m"><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div></li>';
      }).join('') + '</ul></section></div>';
  };

  V.teatri = function () {
    if (ST.teatro) {
      var t = D.teatri.filter(function (x) { return x.id === ST.teatro; })[0];
      var rep = { posti: t.posti, tot: 0, gruppi: [] };
      return '<button class="back" data-teatro="">‹ Teatri</button><div class="top"><div><div class="eyebrow">Teatro</div><h1>' + esc(t.nome) + '</h1><div class="sub">' + esc(t.citta) + '</div></div></div>' +
        '<div class="grid"><section class="card c8"><div class="ch"><h2>Sala mappata</h2><span class="lnk">' + t.posti + ' posti</span></div><div class="map">' + seatmap(rep) + '</div><p class="note">La sala si mappa una volta sola: poi ogni piantina si genera in automatico.</p></section>' +
        '<section class="card c4"><div class="ch"><h2>Scheda</h2></div>' + kv('Posti', t.posti) + kv('Accessibili', t.accessibili) + kv('Palco', t.palco) + kv('Carico', t.carico) + kv('Contatto', t.contatto) +
        '<button class="btn y" style="margin-top:14px" data-toast="Bozza di mail pronta">Scrivi al teatro</button></section></div>';
    }
    return '<div class="top"><div><div class="eyebrow">Teatri</div><h1>Archivio delle sale</h1><div class="sub">' + D.teatri.length + ' teatri mappati</div></div></div><div class="cards">' + D.teatri.map(function (t) {
      return '<button class="tcard" data-teatro="' + t.id + '"><h3>' + esc(t.nome) + '</h3><small>' + esc(t.citta) + '</small><div class="num"><div><b>' + t.posti + '</b>posti</div><div><b>' + t.accessibili + '</b>accessibili</div><div><b>' + esc(t.palco) + '</b>palco</div></div></button>';
    }).join('') + '</div>';
  };

  V.checklist = function () {
    var voci = ['Il teatro era pulito e pronto all’arrivo', 'Il palco corrisponde alla scheda tecnica', 'Impianto audio funzionante', 'Le scuole sono arrivate in orario', 'Nessun danno a scena o costumi', 'Incassi e ricevute consegnati'];
    var n = voci.filter(function (_, k) { return ST.check[k]; }).length;
    return '<div class="top"><div><div class="eyebrow">Checklist di fine giornata</div><h1>Report di oggi</h1><div class="sub">' + n + ' di ' + voci.length + ' voci confermate</div></div>' +
      '<button class="btn y" data-toast="Report inviato alla direzione">Invia il report</button></div><section class="card"><ul class="todo">' + voci.map(function (v, k) {
        return '<li class="' + (ST.check[k] ? 'done' : '') + '" data-check="' + k + '" role="checkbox" aria-checked="' + !!ST.check[k] + '" tabindex="0"><span class="ck"></span>' + esc(v) + '</li>';
      }).join('') + '</ul><p class="note">Le risposte arrivano in tempo reale alla direzione, con le foto e le note.</p></section>';
  };

  V.squadra = function () {
    var dir = ST.role === 'dir';
    return '<div class="top"><div><div class="eyebrow">Squadra</div><h1>' + (dir ? 'Persone e accessi' : 'Chi è in tournée') + '</h1><div class="sub">Ognuno vede solo quello che gli serve.</div></div></div>' +
      '<section class="card"><table class="tbl"><thead><tr><th>Nome</th><th>Ruolo</th><th class="hide">Telefono</th><th>Documento</th>' + (dir ? '<th class="hide">Vede</th>' : '') + '</tr></thead><tbody>' + D.squadra.map(function (p) {
        var ini = p.nome.split(' ').map(function (x) { return x[0]; }).join('');
        var doc = p.doc === 'ok' ? '<span class="badge ok">valido</span>' : p.doc === 'scade' ? '<span class="badge warn">in scadenza</span>' : '<span class="badge bad">mancante</span>';
        var vede = p.reparto === 'Direzione' ? 'tutto' : p.reparto === 'Organizzazione' ? 'tournée, sale, squadra' : p.reparto === 'Cast tecnico' ? 'giornata, schede tecniche' : 'giornata, viaggi';
        return '<tr><td><span class="av">' + esc(ini) + '</span>' + esc(p.nome) + '</td><td>' + esc(p.ruolo) + '</td><td class="hide">' + esc(p.tel) + '</td><td>' + doc + '</td>' + (dir ? '<td class="hide">' + esc(vede) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></section>';
  };

  V.documenti = function () {
    return '<div class="top"><div><div class="eyebrow">Documenti</div><h1>Tutto in un posto</h1><div class="sub">Schede tecniche, contratti, fatture, permessi.</div></div><button class="btn y" data-toast="Nella demo il caricamento è disattivato">Carica</button></div>' +
      '<section class="card"><table class="tbl"><thead><tr><th>Nome</th><th>Tipo</th><th class="hide">Data</th></tr></thead><tbody>' + D.documenti.map(function (d) {
        return '<tr><td>' + esc(d.nome) + '</td><td><span class="badge">' + esc(d.tipo) + '</span></td><td class="hide">' + esc(d.data) + '</td></tr>';
      }).join('') + '</tbody></table></section>';
  };

  V.permessi = function () {
    var righe = D.date.filter(function (g) { return g.citta; }).slice(D.OGGI - 6, D.OGGI + 6);
    return '<div class="top"><div><div class="eyebrow">Permessi e diritti</div><h1>Richieste data per data</h1><div class="sub">Le richieste di permesso e diritti d’autore, preparate in automatico.</div></div></div>' +
      '<section class="card"><table class="tbl"><thead><tr><th>Data</th><th>Città</th><th class="hide">Teatro</th><th>Stato</th></tr></thead><tbody>' + righe.map(function (g, k) {
        var st = g.n <= D.OGGI ? '<span class="badge ok">pagato</span>' : k % 3 === 0 ? '<span class="badge warn">da inviare</span>' : '<span class="badge ok">inviato</span>';
        return '<tr><td>' + esc(g.data + ' ' + g.mese) + '</td><td>' + esc(g.citta) + '</td><td class="hide">' + esc(g.teatro.nome) + '</td><td>' + st + '</td></tr>';
      }).join('') + '</tbody></table></section>';
  };


  /* ---------- business plan ---------- */
  var SCEN = [['Prudente', 0.85], ['Atteso', 1], ['Ottimo', 1.1]];
  var BP_CTRL = [
    ['prezzo', 'Biglietto per studente', 5, 15, 0.5, '€'],
    ['sala', 'Affitto sala per giornata', 0, 2000, 50, '€'],
    ['paga', 'Paga giornaliera attori (lordo)', 80, 200, 5, '€'],
    ['camera', 'Hotel per camera a notte', 40, 140, 5, '€']
  ];
  function num(v) { return String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function eur(v) { return (v < 0 ? '−' : '') + '€ ' + num(v); }
  function bpCalc() {
    var p = ST.bp, f = SCEN[p.scen][1];
    var ATT = 3, TEC = 2, CAMERE = 5, IN_VIAGGIO = 6;
    var FISSI = { scena: 5000, assic: 1200 }, FURGONE = 90, EUR_KM = 0.16, PEDAGGI_KM = 0.07, DIARIA = 25, TM = 125, TEC_PAGA = 130, PROVV = 0.08, DIRITTI = 0.10;
    var giorni = D.date.length, prev = null, rows = [], cumR = 0, cumC = FISSI.scena + FISSI.assic, curve = [[0, 0, cumC]], be = null;
    var T = { ric: 0, sala: 0, hotel: 0, diaria: 0, km: 0, carb: 0, ped: 0, furgone: FURGONE * giorni, att: 0, tec: 0, tm: 0, provv: 0, dir: 0, rep: 0, spett: 0 };
    D.date.forEach(function (g, i) {
      var r = 0, c = FURGONE;
      if (g.citta) {
        var spett = g.repliche.reduce(function (s, x) { return s + x.tot; }, 0) * f, k = km(prev, g.citta); prev = g.citta;
        r = spett * p.prezzo;
        var d = { sala: p.sala, hotel: CAMERE * p.camera, diaria: IN_VIAGGIO * DIARIA, carb: k * EUR_KM, ped: k * PEDAGGI_KM, att: ATT * p.paga, tec: TEC * TEC_PAGA, tm: TM, provv: r * PROVV, dir: r * DIRITTI };
        Object.keys(d).forEach(function (x) { T[x] += d[x]; c += d[x]; });
        T.km += k; T.ric += r; T.rep += g.repliche.length; T.spett += spett;
        rows.push({ i: i, g: g, r: r, c: c, m: r - c });
      }
      cumR += r; cumC += c; curve.push([i + 1, cumR, cumC]);
      if (be === null && cumR >= cumC && r > 0) be = i;
    });
    var costi = cumC;
    return { T: T, F: FISSI, costi: costi, ric: T.ric, marg: T.ric - costi, rows: rows, curve: curve, be: be, giorni: giorni };
  }
  function bpChart(R) {
    var sm = window.innerWidth < 780, W = sm ? 360 : 640, H = sm ? 230 : 250, L = 40, B = 26, max = Math.max(R.ric, R.costi) * 1.05;
    var x = function (d) { return L + d / R.giorni * (W - L - 10); }, y = function (v) { return H - B - v / max * (H - B - 12); };
    var line = function (k) { return R.curve.map(function (p, j) { return (j ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[k]).toFixed(1); }).join(''); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ricavi e costi cumulati lungo la tournée">';
    for (var t = 0; t <= 4; t++) { var v = max / 4 * t; s += '<line x1="' + L + '" x2="' + (W - 10) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="bp-grid"/><text x="' + (L - 8) + '" y="' + (y(v) + 3) + '" class="bp-ax" text-anchor="end">' + Math.round(v / 1000) + 'k</text>'; }
    (sm ? [0, 14, 28, 42] : [0, 7, 14, 21, 28, 35, 42]).forEach(function (d) { s += '<text x="' + x(d) + '" y="' + (H - 8) + '" class="bp-ax" text-anchor="' + (d === 42 ? 'end' : d ? 'middle' : 'start') + '">' + (d ? 'g. ' + d : 'inizio') + '</text>'; });
    s += '<path d="' + line(2) + '" class="bp-c"/><path d="' + line(1) + '" class="bp-r"/>';
    if (R.be !== null) { var px = x(R.be + 1), py = y(R.curve[R.be + 1][1]); s += '<line x1="' + px + '" x2="' + px + '" y1="12" y2="' + (H - B) + '" class="bp-be"/><circle cx="' + px + '" cy="' + py + '" r="5" class="bp-dot"/>'; }
    return s + '</svg>';
  }
  function bpResults() {
    var R = bpCalc(), T = R.T, rep = T.rep, pct = R.ric ? R.marg / R.ric * 100 : 0;
    var be = R.be !== null ? D.date[R.be] : null;
    var kpi = [['Ricavi previsti', eur(R.ric), num(T.spett) + ' spettatori'], ['Costi previsti', eur(R.costi), eur(R.costi / rep) + ' a replica'],
      ['Margine', eur(R.marg), (pct < 0 ? '−' : '') + Math.abs(pct).toFixed(1).replace('.', ',') + '% dei ricavi', R.marg >= 0 ? 'pos' : 'neg'],
      ['Pareggio', be ? be.data + ' ' + be.mese : 'non raggiunto', be ? 'giorno ' + (R.be + 1) + ' di ' + R.giorni : 'servono più spettatori o meno costi', be ? '' : 'neg']];
    var h = '<div class="bp-kpi">' + kpi.map(function (k) { return '<section class="card"><div class="sub" style="margin:0">' + k[0] + '</div><div class="bp-n ' + (k[3] || '') + '">' + k[1] + '</div><small>' + k[2] + '</small></section>'; }).join('') + '</div>';
    var voci = [
      ['Persone', [['Attori (3)', T.att], ['Tecnici (2)', T.tec], ['Tour manager', T.tm], ['Vendite (provvigione 8%)', T.provv]]],
      ['Viaggio e soggiorno', [['Hotel (5 camere)', T.hotel], ['Vitto e diarie', T.diaria], ['Noleggio furgone (' + R.giorni + ' giorni)', T.furgone], ['Carburante (' + Math.round(T.km).toLocaleString('it-IT') + ' km)', T.carb], ['Pedaggi', T.ped]]],
      ['Teatri e diritti', [['Affitto sale', T.sala], ['Diritti d’autore (10%)', T.dir]]],
      ['Costi fissi', [['Scenografia e costumi', R.F.scena], ['Assicurazioni e varie', R.F.assic]]]
    ];
    var tb = '<table class="tbl bp-tbl"><thead><tr><th>Voce</th><th class="r">Totale</th><th class="r hide">A replica</th><th class="hide">Peso</th></tr></thead><tbody>';
    tb += '<tr class="bp-in"><td><b>Ricavi da biglietti</b></td><td class="r"><b>' + eur(R.ric) + '</b></td><td class="r hide">' + eur(R.ric / rep) + '</td><td class="hide"></td></tr>';
    voci.forEach(function (gr) {
      var sub = gr[1].reduce(function (s, v) { return s + v[1]; }, 0);
      tb += '<tr class="bp-gr"><td>' + gr[0] + '</td><td class="r">' + eur(sub) + '</td><td class="r hide">' + eur(sub / rep) + '</td><td class="hide"></td></tr>';
      gr[1].forEach(function (v) {
        tb += '<tr><td class="bp-sub">' + esc(v[0]) + '</td><td class="r">' + eur(v[1]) + '</td><td class="r hide">' + eur(v[1] / rep) + '</td><td class="hide"><span class="bp-bar"><i style="width:' + Math.max(2, v[1] / R.costi * 100 * 3).toFixed(0) + '%"></i></span></td></tr>';
      });
    });
    tb += '<tr class="bp-tot"><td>Margine</td><td class="r ' + (R.marg >= 0 ? 'pos' : 'neg') + '">' + eur(R.marg) + '</td><td class="r hide">' + eur(R.marg / rep) + '</td><td class="hide"></td></tr></tbody></table>';
    var peggio = R.rows.slice().sort(function (a, b) { return a.m - b.m; }).slice(0, 5);
    var uno = R.rows.filter(function (x) { return x.g.repliche.length === 1; }), perse = uno.filter(function (x) { return x.m < 0; }).length;
    var li = peggio.map(function (x) {
      return '<li class="row" data-day="' + x.i + '"><div class="d"><b>' + x.g.data + '</b><small>' + esc(x.g.giorno.slice(0, 3)) + '</small></div><div class="m"><b>' + esc(x.g.citta) + '</b><small>' + x.g.repliche.length + (x.g.repliche.length === 1 ? ' replica' : ' repliche') + ' · ' + eur(x.r) + ' di ricavi</small></div><span class="bp-m ' + (x.m >= 0 ? 'pos' : 'neg') + '">' + eur(x.m) + '</span></li>';
    }).join('');
    return {
      kpi: h, tbl: tb, chart: bpChart(R) + '<div class="legend"><span class="lg"><i style="background:var(--bp-r)"></i>Ricavi cumulati</span><span class="lg"><i style="background:var(--bp-c)"></i>Costi cumulati</span>' + (be ? '<span class="lg"><i style="background:var(--straw)"></i>Pareggio il ' + be.data + ' ' + be.mese + '</span>' : '') + '</div>',
      date: '<ul class="list">' + li + '</ul><p class="note">' + (perse ? '<b>' + perse + ' delle ' + uno.length + ' date con una sola replica sono in perdita.</b> Accorparle o aggiungere una seconda replica sposta il pareggio in avanti.' : 'Con queste ipotesi anche le date con una sola replica coprono i costi.') + '</p>'
    };
  }
  function bpPaint() {
    var o = bpResults();
    ['kpi', 'tbl', 'chart', 'date'].forEach(function (k) { var el = document.getElementById('bp-' + k); if (el) el.innerHTML = o[k]; });
    BP_CTRL.forEach(function (c) { var el = document.getElementById('bpv-' + c[0]); if (el) el.textContent = eur(ST.bp[c[0]]); });
  }
  V.budget = function () {
    var p = ST.bp;
    var ctrl = BP_CTRL.map(function (c) {
      return '<label class="bp-ctl"><span>' + c[1] + '<b id="bpv-' + c[0] + '">' + eur(p[c[0]]) + '</b></span><input type="range" data-bp="' + c[0] + '" min="' + c[2] + '" max="' + c[3] + '" step="' + c[4] + '" value="' + p[c[0]] + '" style="--p:' + ((p[c[0]] - c[2]) / (c[3] - c[2]) * 100).toFixed(1) + '%"></label>';
    }).join('');
    var h = '<div class="top"><div><div class="eyebrow">Business plan</div><h1>Tournée di primavera</h1><div class="sub">Ricavi, costi e margine della tournée, ricalcolati appena cambi un’ipotesi.</div></div>' +
      '<div class="chips"><button class="chip" data-toast="Nella versione completa carichi il tuo Excel e TourNeat riconosce le voci di costo">Importa da Excel</button><button class="chip" data-toast="Nella versione completa esporti il PDF per banca, bandi e soci">Esporta PDF</button></div></div>';
    h += '<div id="bp-kpi"></div>';
    h += '<div class="grid"><section class="card c4"><div class="ch"><h2>Ipotesi</h2></div>' +
      '<div class="bp-ctl"><span>Presenze</span><div class="seg" role="group" aria-label="Scenario">' + SCEN.map(function (s, i) { return '<button data-scen="' + i + '" class="' + (p.scen === i ? 'on' : '') + '">' + s[0] + '</button>'; }).join('') + '</div></div>' +
      ctrl + '<p class="note">Altre voci (furgone, carburante, provvigioni, diritti) si impostano una volta sola. Le date e i chilometri arrivano dal calendario della tournée.</p></section>' +
      '<section class="card c8"><div class="ch"><h2>Ricavi e costi lungo la tournée</h2></div><div id="bp-chart" class="bp-chart"></div></section>' +
      '<section class="card c8"><div class="ch"><h2>Conto economico</h2><span class="tag">' + D.date.filter(function (g) { return g.citta; }).length + ' date</span></div><div id="bp-tbl"></div></section>' +
      '<section class="card c4"><div class="ch"><h2>Date meno redditizie</h2></div><div id="bp-date"></div></section></div>';
    setTimeout(bpPaint, 0);
    return h;
  };
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-bp');
    if (k) { var t = e.target; ST.bp[k] = +t.value; t.style.setProperty('--p', ((t.value - t.min) / (t.max - t.min) * 100).toFixed(1) + '%'); bpPaint(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-scen]');
    if (b) { ST.bp.scen = +b.getAttribute('data-scen'); document.querySelectorAll('[data-scen]').forEach(function (x) { x.classList.toggle('on', x === b); }); bpPaint(); }
  });

  V.telefono = function () {
    var i = prossimaData(D.OGGI), g = giorno(i), dom = giorno(prossimaData(i + 1));
    return '<div class="top"><div><div class="eyebrow">App del cast</div><h1>Quello che vede chi è in viaggio</h1><div class="sub">Attori e tecnici usano TourNeat dal telefono: solo la giornata, i viaggi e i contatti utili.</div></div></div>' +
      '<div class="phonewrap"><div class="phone"><div class="isl"></div><div class="ps">' +
      '<div class="eyebrow" style="margin-top:6px">Oggi</div><div style="font-size:24px;font-weight:700;letter-spacing:-.03em;margin:2px 0 10px">' + esc(g.giorno + ' ' + g.data + ' · ' + g.citta) + '</div>' +
      '<section class="card" style="padding:4px 14px">' + kv('Convocazione', '8:45 in teatro') + kv('Teatro', g.teatro.nome) + kv('Repliche', g.repliche.map(function (r) { return r.ora; }).join(' · ')) + kv('Hotel', g.hotel.nome) + '</section>' +
      '<div class="eyebrow" style="margin:16px 0 6px">Domani</div><section class="card" style="padding:4px 14px">' + kv('Partenza', '15:30 dal teatro') + kv('Destinazione', dom.citta + ' · ' + km(g.citta, dom.citta) + ' km') + kv('Auto', 'furgone + auto 2') + '</section>' +
      '<div class="eyebrow" style="margin:16px 0 6px">Contatti</div><section class="card" style="padding:4px 14px">' + kv('Tour manager', 'Giulia Rossi') + kv('Teatro', g.teatro.contatto) + '</section>' +
      '</div></div></div>';
  };

  /* ---------- guscio ---------- */
  function nav() {
    var c = CHI[ST.role];
    var h = '<div class="brand">Tour<span>Neat</span></div><div class="co"><i>' + esc(D.compagnia.sigla) + '</i><div><b>' + esc(D.compagnia.nome) + '</b><small>' + esc(c[1]) + '</small></div></div>' +
      '<div class="role"><label for="roleSel">Guarda come</label><select id="roleSel"><option value="tm">Tour manager</option><option value="dir">Direzione</option><option value="cast">Cast</option></select></div>';
    var cur = route();
    h += MENU[ST.role].map(function (m) { return '<a class="nav' + (cur === m[0] || (cur === 'giorno' && m[0] === 'tournee') ? ' on' : '') + '" href="#' + m[0] + '">' + ic(m[0]) + esc(m[1]) + '</a>'; }).join('');
    h += '<div class="sp"></div><div class="me"><i>' + esc(c[2]) + '</i>' + esc(c[0]) + ' · demo</div>';
    $('.side').innerHTML = h;
    $('#roleSel').value = ST.role;
    var tabs = MENU[ST.role].slice(0, 4);
    $('.tabbar').innerHTML = tabs.map(function (m) { return '<a href="#' + m[0] + '" class="' + (cur === m[0] ? 'on' : '') + '">' + ic(m[0]) + '<span>' + esc(m[1].split(' ')[0]) + '</span></a>'; }).join('') +
      (MENU[ST.role].length > 4 ? '<button data-more>' + '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg><span>Altro</span></button>' : '');
  }
  function route() { var h = (location.hash || '').replace('#', ''); return V[h] ? h : MENU[ST.role][0][0]; }
  function render() {
    var r = route();
    if (!MENU[ST.role].some(function (m) { return m[0] === r; }) && r !== 'giorno') r = MENU[ST.role][0][0];
    nav();
    var m = $('main'); m.innerHTML = '<div class="view">' + V[r]() + '</div>';
    document.title = 'TourNeat · demo';
  }
  function go(h) { if (location.hash === '#' + h) render(); else location.hash = h; window.scrollTo(0, 0); }
  function toast(t) { var x = $('#toast'); x.textContent = t; x.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { x.hidden = true; }, 2200); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-mese],[data-oggi],[data-rep],[data-arr],[data-todo],[data-check],[data-day],[data-cal],[data-go],[data-teatro],[data-toast],[data-more]');
    if (!t) return;
    if (t.hasAttribute('data-mese')) { ST.mese = +t.getAttribute('data-mese'); render(); }
    else if (t.hasAttribute('data-oggi')) { ST.mese = D.OGGI >= 31 ? 1 : 0; render(); }
    else if (t.hasAttribute('data-rep')) { ST.selRep = +t.getAttribute('data-rep'); render(); }
    else if (t.hasAttribute('data-arr')) { var k = t.getAttribute('data-arr'); ST.arrivi[k] = !ST.arrivi[k] ? 'ok' : ST.arrivi[k] === 'ok' ? 'late' : undefined; render(); }
    else if (t.hasAttribute('data-todo')) { var a = t.getAttribute('data-todo'); ST.todo[a] = !ST.todo[a]; render(); }
    else if (t.hasAttribute('data-check')) { var c = t.getAttribute('data-check'); ST.check[c] = !ST.check[c]; render(); }
    else if (t.hasAttribute('data-day')) { ST.selDay = +t.getAttribute('data-day'); ST.selRep = 0; go('giorno'); }
    else if (t.hasAttribute('data-cal')) { ST.calMode = t.getAttribute('data-cal'); render(); }
    else if (t.hasAttribute('data-go')) { go(t.getAttribute('data-go')); }
    else if (t.hasAttribute('data-teatro')) { ST.teatro = t.getAttribute('data-teatro') || null; render(); window.scrollTo(0, 0); }
    else if (t.hasAttribute('data-more')) { document.body.classList.toggle('menu-open'); }
    else if (t.hasAttribute('data-toast')) { toast(t.getAttribute('data-toast')); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-todo],[data-check]')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'roleSel') { ST.role = e.target.value; location.hash = MENU[ST.role][0][0]; render(); }
    if (e.target.id === 'pdSel') { ST.selDay = +e.target.value; ST.selRep = 0; render(); }
  });
  window.addEventListener('hashchange', function () { document.body.classList.remove('menu-open'); if (route() !== 'teatri') ST.teatro = null; render(); });
  render();
})();
