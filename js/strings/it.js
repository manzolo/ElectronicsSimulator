export default {
  tagline: 'Scrivi il circuito, guarda tensioni e correnti mentre si assestano — poi prendi la sonda.',
  navIntro: 'Basi',
  navLevels: 'Livelli',
  navSandbox: 'Sandbox',
  help: 'Aiuto',

  run: 'Esegui',
  pause: 'Pausa',
  step: 'Passo',
  reset: 'Reset',
  speed: 'Velocità',

  panelSchematic: 'Schema — i nodi sono in ordine di potenziale',
  panelInstruments: 'Banco: multimetro e oscilloscopio',
  panelNetlist: 'Netlist',
  panelBuilder: 'Componenti (modifica qui o nel testo)',
  panelReadings: 'Letture per componente',
  panelCases: 'Casi di prova',
  panelEvents: 'Log del risolutore',
  fixtureLabel: 'scheda data (bloccata)',
  userLabel: 'le tue righe',

  statusRunning: 'In esecuzione…',
  statusReady: 'Pronto. Premi Esegui.',
  statusPaused: 'In pausa.',
  statusParseFailed: 'La netlist non è stata interpretata.',
  statusDone: 'Fatto in {0} tick · t = {1}.',
  statusDoneBurn: 'Fatto in {0} tick — ma qualcosa è bruciato: {1}.',

  meterEmpty: 'Nessuna sonda. Aggiungi <code>.probe nodo</code> o <code>.probe I(R1)</code>, oppure clicca un nodo o un componente nello schema.',
  scopeEmpty: 'Nessun canale. Aggiungi <code>.scope nodo</code> (e <code>.tran</code> per vedere il tempo).',
  scopeNoTran: 'Circuito in continua: lo scopio mostra una riga piatta. Aggiungi <code>.tran 20m</code> per il tempo.',
  scopeDiv: '{0}/div',
  readingsEmpty: 'Esegui per leggere tensioni, correnti e potenze.',
  colPart: 'parte', colValue: 'valore', colV: 'V', colI: 'I', colP: 'P', colStress: 'limite',
  burnedTag: 'bruciata',
  replacedTag: 'nuova',
  builderEmpty: 'Nessun componente tuo. Aggiungi con i bottoni o scrivi nella netlist.',
  builderAdd: 'aggiungi',
  builderRemove: 'togli',
  builderNodes: 'nodi',
  builderDirectives: 'le direttive (.probe, .scope, .replace) restano nel testo',

  evtSolveDc: 'punto di lavoro: risolvo la rete (MNA)',
  evtSolveTran: 'transitorio fino a {0} (dt {1})',
  evtIterate: 'iterazione {0} · Δ {1}',
  evtConverge: 'convergenza in {0} iterazioni',
  evtSettle: 'assestato',
  evtTick: 't = {0}',
  evtConduct: '{0} conduce ({1})',
  evtCutoff: '{0} interdetto',
  evtZener: '{0} in zona zener ({1})',
  evtSaturate: '{0} saturo ({1})',
  evtActive: '{0} in zona attiva ({1})',
  evtCharge: '{0} si carica',
  evtDischarge: '{0} si scarica',
  evtBurnPower: '✗ {0} BRUCIA: {1} su {2} massimi',
  evtBurnCurrent: '✗ {0} BRUCIA: {1} su {2} massimi',
  evtProbeV: 'sonda V({0}) = {1}',
  evtProbeI: 'sonda I({0}) = {1}',
  evtFaultFound: '✓ {0} sostituito: era il componente guasto',
  evtReplace: '{0} sostituito: era sano',
  evtDiverge: 'il risolutore non converge',
  evtDone: 'fine · {0} tick',
  evtEmpty: 'Ancora nessun evento — premi Esegui.',

  caseLabel: 'Caso',
  casesNote: 'Verificato su questi E su casi nascosti (tolleranze diverse) — il circuito deve funzionare, non indovinare.',

  allowedLabel: 'parti',
  allowedNone: 'niente da aggiungere: solo sonde e .replace',
  e12Chip: 'solo valori E12',
  maxChip: 'max {0}',
  replaceChip: 'sostituzioni: {0}',

  hintBtn: 'Suggerimento {0} di {1}',
  hintsDone: 'Nessun altro suggerimento',
  nextLevel: 'Livello successivo →',
  completedBadge: 'completato',
  levelBadge: 'Livello {0}',
  goalLabel: 'Obiettivo',
  checksLabel: 'Verifiche',
  wantBetween: 'atteso {0} – {1}',
  wantMax: 'atteso ≤ {0}',
  wantMin: 'atteso ≥ {0}',

  sandboxTitle: 'Sandbox',
  sandboxText: 'Banco libero: un alimentatore stabilizzato completo, con lo scopio già sui nodi giusti. Cambia tutto, rompi tutto (la roba brucia davvero), aggiungi <code>.probe</code> dove vuoi. Qui non si verifica nulla.',
  sandboxCardTitle: 'Sandbox',
  sandboxCardDesc: 'banco libero',

  selectTitle: 'Scegli un livello',

  passMsg: 'Il circuito funziona in tutti i casi. Ottimo lavoro.',
  failVisible: 'Non ancora: su un caso mostrato il circuito non rispetta le specifiche.',
  failHidden: 'Funziona sui casi mostrati ma fallisce su uno nascosto — regge alle tolleranze?',
  failStatus: 'Alcuni casi non superati.',
  failBurn: 'Qualcosa è bruciato.',

  introTitle: 'Mai acceso un saldatore? Parti da qui',
  introStart: 'Capito — portami al livello 1 →',

  honestNote: '⚠️ Costruito <b>con l\'AI per imparare</b>, in una sera: può contenere errori. Il risolutore coincide con CircuitJS al decimo di millivolt sui circuiti lineari (i modelli dei semiconduttori differiscono di qualche decina di mV) — prova tu col bottone «Seconda opinione». Se un valore o una spiegazione non ti tornano, <a href="https://github.com/manzolo/ElectronicsSimulator/issues/new" target="_blank" rel="noopener">apri una issue</a>.',
  falstad: 'Seconda opinione su Falstad ↗',
  falstadTitle: "Apre questo stesso circuito in CircuitJS (falstad.com), un simulatore indipendente scritto da un'altra persona con un altro motore. Se i numeri non coincidono, uno dei due sbaglia: apri una issue. Uno STEP diventa un'onda quadra a 0,25 Hz; nei livelli di riparazione si esporta la scheda com'è scritta (sana).",
  segnala: 'Segnala un problema',
  segnalaTitle: 'Apre su GitHub una segnalazione già compilata con livello, lingua, stato del motore e browser.',
  segnalaCorpo: '**Cosa non funziona?**\n\nDescrivi qui: cosa hai fatto, cosa ti aspettavi, cosa è successo.\n\n---\n_Dati raccolti dalla pagina (controlla e correggi se serve):_\n\n- Pagina: {0}\n- Livello: {1}\n- Lingua: {2}\n- Stato: {3}\n- Browser: `{4}`\n',

  helpTitle: 'EDU-ELN — come funziona',
  helpHtml: `
    <p>Scrivi un circuito come <b>netlist</b> (una riga per componente); un risolutore scritto a mano — analisi nodale modificata + Newton-Raphson, niente librerie — calcola tensioni e correnti e le mostra sullo schema, sul multimetro e sull'oscilloscopio.</p>
    <h3>La netlist</h3>
    <table>
      <tr><th>R1 in out 4.7k [0.5W]</th><td>resistenza (potenza nominale opzionale, default ¼ W)</td></tr>
      <tr><th>C1 out gnd 100n · L1 a b 10m</th><td>condensatore, induttore</td></tr>
      <tr><th>V1 in gnd DC 9</th><td>sorgente continua</td></tr>
      <tr><th>V1 in gnd SIN off amp f</th><td>sinusoide: offset, ampiezza (di picco), frequenza</td></tr>
      <tr><th>V1 in gnd PULSE v1 v2 f · STEP v1 v2 t0</th><td>onda quadra (50%) · gradino a t0</td></tr>
      <tr><th>D1 anodo catodo [SI|1N4007|LED|SCHOTTKY]</th><td>diodo; l'ordine dei nodi è la polarità</td></tr>
      <tr><th>DZ1 anodo catodo ZENER 5.1</th><td>zener con V<sub>z</sub></td></tr>
      <tr><th>Q1 c b e NPN [beta]</th><td>transistor NPN (β default 100)</td></tr>
      <tr><th>.tran 20m [dt]</th><td>simula nel tempo (senza, solo il punto di lavoro)</td></tr>
      <tr><th>.probe out · .probe I(R1)</th><td>multimetro su un nodo / corrente in una parte</td></tr>
      <tr><th>.scope in out</th><td>fino a due canali sull'oscilloscopio</td></tr>
      <tr><th>.replace C1</th><td>nei livelli di riparazione: sostituisce una parte</td></tr>
    </table>
    <p>Suffissi: <code>p n u m k M</code> (attenzione: <code>m</code> = milli, <code>M</code> = mega). <code>gnd</code> o <code>0</code> è la massa. Commenti con <code>#</code>.</p>
    <h3>Lo schema</h3>
    <p>I nodi sono <b>binari orizzontali ordinati per potenziale</b>: più in alto, più volt. Ogni componente è una colonna tra i suoi due nodi; il colore dei fili è la tensione, le formiche che marciano sono la corrente (velocità ∝ log|I|). Un ponticello dove un filo attraversa un binario significa <em>nessun contatto</em>. Clicca un nodo o una parte per metterci la sonda.</p>
    <h3>Controlli</h3>
    <table>
      <tr><th>Esegui / Pausa</th><td>Ctrl/Cmd + Invio</td></tr>
      <tr><th>Passo</th><td>F8 — un'iterazione del punto di lavoro, o un passo temporale</td></tr>
      <tr><th>Velocità</th><td>il cursore; l'ultimo scatto è Turbo</td></tr>
    </table>
    <h3>I limiti sono veri</h3>
    <p>Una resistenza da ¼ W con 0,3 W sopra <b>brucia</b> e si apre; un LED oltre 30 mA idem; uno zener sopra 0,5 W, un transistor sopra 1,5 W o 1 A. Nei transitori la sollecitazione è mediata (inerzia termica), così uno spunto di pochi millisecondi non uccide un raddrizzatore.</p>
    <h3>Livelli</h3>
    <p>Ogni livello ti dà una scheda (bloccata) e ti chiede di aggiungere o sostituire qualcosa. La verifica misura il circuito su più casi — alcuni mostrati, altri nascosti con tolleranze diverse — così passa un progetto che regge, non un colpo di fortuna.</p>
    <h3>Una nota onesta</h3>
    <p>Questo laboratorio l'ho <b>buttato giù con l'AI</b> (Claude Code), in una sera, per <b>imparare io in prima persona</b>: risolutore, modelli, livelli e testi li ha scritti l'AI su mie indicazioni, e <b>non sono in grado di garantire che sia tutto corretto</b>. I test tornano con le formule del manuale, ma un test scritto dalla stessa mano che ha scritto il codice non è una revisione. Una verifica indipendente c'è: il bottone <b>Seconda opinione su Falstad</b> apre lo stesso circuito in CircuitJS — sui circuiti lineari coincidono al decimo di millivolt, sui semiconduttori i modelli differiscono di qualche decina di mV (dettagli nel README). Se qualcosa non ti torna, <a href="https://github.com/manzolo/ElectronicsSimulator/issues/new" target="_blank" rel="noopener">apri una issue</a>: è così che può diventare giusto.</p>`,

  // ---- codici di errore del parser / del motore ----
  errUnknownElement: 'Non so cosa sia “{0}”: le parti iniziano per R, C, L, V, I, D o Q.',
  errDuplicateName: '“{0}” è già definito.',
  errNeedNodes: '“{0}” ha bisogno di {1} nodi.',
  errBadValue: 'Valore non valido per “{0}” (es. 4.7k, 100n).',
  errBadRating: 'Potenza nominale non valida per “{0}” (es. 0.5W).',
  errBadSource: 'Tipo di sorgente sconosciuto per “{0}”: usa DC, SIN, PULSE o STEP.',
  errSourceArgs: 'Una sorgente {0} vuole {1} numeri.',
  errBadFreq: 'Frequenza non valida per “{0}”.',
  errUnknownModel: 'Modello sconosciuto “{0}”.',
  errZenerVoltage: 'Lo zener “{0}” vuole la sua V<sub>z</sub> (es. ZENER 5.1).',
  errTranValue: '.tran vuole una durata (es. .tran 20m).',
  errProbeArg: 'Indica cosa sondare: un nodo o I(componente).',
  errReplaceArg: 'Indica quale componente sostituire.',
  errUnknownDirective: 'Direttiva sconosciuta “{0}”.',
  errNoGround: 'Nessun nodo è collegato a gnd: il circuito non ha riferimento.',
  errUnknownComponent: 'Componente sconosciuto “{0}”.',
  errUnknownNode: 'Nodo sconosciuto “{0}”.',
  errRedefinesFixture: '“{0}” è già sulla scheda: non puoi ridefinirlo.',
  errEmpty: 'La netlist è vuota.',
  errBuild: 'Errore nel costruire il circuito: {0}',
  errNoConverge: 'Il risolutore non converge: il circuito così com\'è non ha un punto di lavoro stabile.',
  errSingular: 'Sistema singolare: c\'è un nodo che non è collegato a niente, o due sorgenti in conflitto.',
  errBudget: 'Troppi passi: la simulazione è stata fermata.',
  errNotAllowed: '“{0}” è di tipo {1}: in questo livello non è ammesso.',
  errTooMany: 'Troppi componenti: al massimo {0}.',
  errNotE12: '“{0}” non è un valore della serie E12.',
  errNoReplaceHere: 'In questo livello non si sostituiscono parti.',
  errTooManyReplace: 'Puoi sostituire al massimo {0} parte.',
};
