/* TourNeat demo · dati interamente inventati */
window.DEMO = (function () {
  'use strict';
  var PAST = ['#A9C8EC', '#F6C9A0', '#CDBBE8', '#B9E2C8', '#F4B8C5', '#F3E3A1'];

  var compagnia = { nome: 'Compagnia Demo', sigla: 'CD' };

  var spettacoli = [
    { id: 's1', titolo: 'Il viaggio di Ulisse', durata: 75, pubblico: 'Scuole medie e superiori' },
    { id: 's2', titolo: 'La tempesta in tasca', durata: 60, pubblico: 'Scuole primarie' }
  ];

  // città con coordinate approssimate per la mappa schematica
  var citta = {
    Torino: [45.07, 7.69], Novara: [45.45, 8.62], Milano: [45.46, 9.19], Bergamo: [45.70, 9.67], Brescia: [45.54, 10.21],
    Verona: [45.44, 10.99], Padova: [45.41, 11.88], Treviso: [45.67, 12.24], Trento: [46.07, 11.12], Parma: [44.80, 10.33],
    Modena: [44.65, 10.93], Bologna: [44.49, 11.34], Ferrara: [44.84, 11.62], Genova: [44.41, 8.93], Piacenza: [45.05, 9.70]
  };

  var teatri = [
    { id: 't1', nome: 'Teatro Esempio', citta: 'Bergamo', posti: 302, accessibili: 6, palco: '10 × 8 m', carico: 'Rampa sul retro', contatto: 'Ufficio tecnico · 035 000 0001' },
    { id: 't2', nome: 'Auditorium Demo', citta: 'Brescia', posti: 410, accessibili: 8, palco: '12 × 9 m', carico: 'Montacarichi', contatto: 'Biglietteria · 030 000 0002' },
    { id: 't3', nome: 'Teatro Prova', citta: 'Verona', posti: 268, accessibili: 4, palco: '9 × 7 m', carico: 'Porta laterale', contatto: 'Direzione · 045 000 0003' },
    { id: 't4', nome: 'Cinema Teatro Modello', citta: 'Padova', posti: 520, accessibili: 10, palco: '11 × 8 m', carico: 'Rampa sul retro', contatto: 'Ufficio tecnico · 049 000 0004' },
    { id: 't5', nome: 'Sala Civica Esempio', citta: 'Trento', posti: 230, accessibili: 4, palco: '8 × 6 m', carico: 'Ingresso principale', contatto: 'Custode · 0461 000 005' },
    { id: 't6', nome: 'Teatro Comunale Demo', citta: 'Modena', posti: 380, accessibili: 6, palco: '12 × 10 m', carico: 'Montacarichi', contatto: 'Ufficio tecnico · 059 000 0006' },
    { id: 't7', nome: 'Teatro Fittizio', citta: 'Bologna', posti: 450, accessibili: 8, palco: '12 × 9 m', carico: 'Rampa sul retro', contatto: 'Produzione · 051 000 0007' },
    { id: 't8', nome: 'Spazio Scena Prova', citta: 'Milano', posti: 320, accessibili: 6, palco: '10 × 8 m', carico: 'Cortile interno', contatto: 'Direzione · 02 0000 0008' },
    { id: 't9', nome: 'Teatro dei Campioni', citta: 'Parma', posti: 290, accessibili: 4, palco: '9 × 8 m', carico: 'Porta laterale', contatto: 'Ufficio tecnico · 0521 000 009' },
    { id: 't10', nome: 'Politeama Demo', citta: 'Genova', posti: 600, accessibili: 12, palco: '14 × 10 m', carico: 'Montacarichi', contatto: 'Produzione · 010 000 0010' }
  ];

  var scuole = [
    'Liceo Esempio', 'Istituto Demo', 'Scuola Prova', 'Liceo Modello', 'Istituto Campione', 'Scuola Media Fittizia',
    'Liceo Linguistico Demo', 'Istituto Tecnico Prova', 'Scuola Primaria Esempio', 'Liceo Artistico Modello'
  ];

  var squadra = [
    { nome: 'Giulia Rossi', ruolo: 'Tour manager', reparto: 'Organizzazione', tel: '333 000 0001', doc: 'ok' },
    { nome: 'Marco Bianchi', ruolo: 'Direzione', reparto: 'Direzione', tel: '333 000 0002', doc: 'ok' },
    { nome: 'Sara Verdi', ruolo: 'Attrice', reparto: 'Cast artistico', tel: '333 000 0003', doc: 'ok' },
    { nome: 'Luca Neri', ruolo: 'Attore', reparto: 'Cast artistico', tel: '333 000 0004', doc: 'scade' },
    { nome: 'Elena Galli', ruolo: 'Attrice', reparto: 'Cast artistico', tel: '333 000 0005', doc: 'ok' },
    { nome: 'Paolo Conti', ruolo: 'Fonico', reparto: 'Cast tecnico', tel: '333 000 0006', doc: 'ok' },
    { nome: 'Anna Fabbri', ruolo: 'Luci e scena', reparto: 'Cast tecnico', tel: '333 000 0007', doc: 'manca' }
  ];

  // 42 giorni di tournée a partire da lunedì 1
  var giro = ['Milano', 'Milano', 'Novara', 'Torino', 'Genova', null, null, 'Piacenza', 'Parma', 'Modena', 'Bologna', 'Ferrara', null, null,
    'Bergamo', 'Brescia', 'Verona', 'Padova', 'Treviso', null, null, 'Trento', 'Verona', 'Brescia', 'Bergamo', 'Milano', null, null,
    'Bologna', 'Modena', 'Parma', 'Piacenza', 'Genova', null, null, 'Torino', 'Novara', 'Milano', 'Bergamo', 'Brescia', null, null];
  var GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  var teatroDi = {};
  teatri.forEach(function (t) { teatroDi[t.citta] = t; });
  function teatroPer(c) { return teatroDi[c] || { id: 'tx-' + c, nome: 'Teatro Demo ' + c, citta: c, posti: 300, accessibili: 6, palco: '10 × 8 m', carico: 'Rampa sul retro', contatto: '—' }; }

  var date = [];
  var seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  giro.forEach(function (c, i) {
    var g = { n: i + 1, giorno: GIORNI[i % 7], data: (i % 31) + 1, mese: i < 31 ? 'marzo' : 'aprile', citta: c };
    if (c) {
      var t = teatroPer(c);
      g.teatro = t;
      g.spettacolo = spettacoli[i % 5 === 3 ? 1 : 0];
      var nrep = i % 3 === 2 ? 1 : 2;
      g.repliche = [];
      for (var r = 0; r < nrep; r++) {
        var gruppi = [], tot = 0, k = 2 + Math.floor(rnd() * 2);
        for (var j = 0; j < k; j++) {
          var n = 60 + Math.floor(rnd() * 50);
          gruppi.push({ scuola: scuole[(i * 3 + r * 2 + j) % scuole.length], n: n, docenti: 3 + Math.floor(rnd() * 5), col: PAST[j % PAST.length] });
          tot += n;
        }
        g.repliche.push({ ora: r === 0 ? '10:00' : '12:00', gruppi: gruppi, tot: tot, posti: t.posti });
      }
      g.hotel = { nome: 'Hotel Demo ' + c, stelle: 3, camere: '4 doppie · 1 singola', pagamento: i % 4 === 0 ? 'da saldare in struttura' : 'già saldato' };
    }
    date.push(g);
  });

  var OGGI = 14; // martedì 14 · Bergamo... indice 14 = giorno 15 (Bergamo)
  // documenti e permessi
  var documenti = [
    { nome: 'Scheda tecnica – Il viaggio di Ulisse.pdf', tipo: 'Scheda tecnica', data: '02/03' },
    { nome: 'Piano luci – versione 3.pdf', tipo: 'Scheda tecnica', data: '28/02' },
    { nome: 'Assicurazione furgone.pdf', tipo: 'Mezzi', data: '15/02' },
    { nome: 'Fattura Hotel Demo Bergamo.pdf', tipo: 'Fatture', data: '14/03' },
    { nome: 'Permesso ZTL Bologna.pdf', tipo: 'Permessi', data: '10/03' },
    { nome: 'Contratto Teatro Esempio.pdf', tipo: 'Contratti', data: '20/01' }
  ];

  return { PAST: PAST, compagnia: compagnia, spettacoli: spettacoli, teatri: teatri, citta: citta, scuole: scuole, squadra: squadra, date: date, OGGI: OGGI, documenti: documenti, teatroPer: teatroPer };
})();
