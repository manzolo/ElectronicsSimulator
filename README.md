# EDU-ELN · Electronics Playground

🇮🇹 Italiano · [🇬🇧 English](README.en.md)

**▶ Provalo online: <https://manzolo.github.io/ElectronicsSimulator/?lang=it>**

Un laboratorio interattivo per capire **l'elettronica analogica guardandola
lavorare**. Scrivi un circuito come netlist (una riga per componente); un
risolutore scritto a mano — analisi nodale modificata + Newton-Raphson, niente
librerie, niente SPICE — calcola tensioni e correnti e le **mostra**: i nodi
diventano binari orizzontali ordinati per potenziale (più in alto, più volt),
i fili prendono il colore della loro tensione, le correnti marciano lungo i
componenti, un LED si accende in proporzione alla corrente. Sul banco ci sono
un **multimetro** e un **oscilloscopio a due tracce**. E i limiti sono veri:
una resistenza da ¼ W con 0,3 W sopra **brucia**, si apre, e il circuito
cambia.

![Il capstone: alimentatore stabilizzato con il condensatore di livellamento secco — lo scopio su p mostra il dente di sega che sprofonda, l'uscita ronza](img/capstone.png)

È il piano terra della collana EDU-\* — quella che va *dal transistor al web*
e che, prima di questo lab, cominciava dai gate logici: sotto
[EDU-NUM](https://github.com/manzolo/NumberSimulator) ed
[EDU-16](https://github.com/manzolo/AssemblerSimulator) c'era il vuoto. Gli
altri fratelli: [EDU-SQL](https://github.com/manzolo/SqlSimulator),
[EDU-NET](https://github.com/manzolo/NetworkSimulator),
[EDU-REGEX](https://github.com/manzolo/RegexSimulator),
[EDU-NN](https://github.com/manzolo/NeuralSimulator),
[EDU-OS](https://github.com/manzolo/OsSimulator),
[EDU-ALGO](https://github.com/manzolo/AlgoSimulator),
[EDU-CRYPTO](https://github.com/manzolo/CryptoSimulator),
[EDU-GIT](https://github.com/manzolo/GitSimulator) e
[EDU-BRANCH](https://github.com/manzolo/GitBranchingSimulator).

## Una nota onesta

Questo laboratorio l'ho **buttato giù con l'AI** (Claude Code), in una sera, per **imparare io
in prima persona**: il risolutore, i modelli dei componenti, i livelli e questi stessi testi li
ha scritti l'AI su mie indicazioni, e **io non sono in grado di garantire che sia tutto
corretto**. I test confrontano il motore con le formule del manuale (partitore, 1/e, −3 dB,
ripple ≈ I/(2f·C), I<sub>c</sub> = β·I<sub>b</sub>) e tornano — ma un test scritto dalla stessa
mano che ha scritto il codice non è una revisione. Se trovi un valore che non ti torna, un
modello troppo semplificato o una spiegazione sbagliata, **[apri una
issue](https://github.com/manzolo/ElectronicsSimulator/issues/new)**: è esattamente il modo in
cui questo lab può diventare giusto. Nel sito il link «Segnala un problema» precompila già
livello, lingua e stato del motore.

## Perché un motore scritto a mano

È l'unico lab della collana con un modello **continuo** e non simbolico: la
correttezza sta nel risolutore, non in una tabella di transizioni. Ed è
proprio per questo che va scritto a mano — perché ogni numero che vedi esce da
un'equazione che puoi leggere:

- **MNA** (`js/core/solver.js`): ogni componente "stampa" la propria
  conduttanza e sorgente equivalente nella matrice; una resistenza è una
  conduttanza, condensatori e induttori nel transitorio diventano il loro
  *companion model* (Eulero all'indietro), le sorgenti di tensione aggiungono
  un'incognita di corrente.
- **Newton-Raphson**: diodi, zener e transistor (Ebers-Moll) vengono
  linearizzati intorno alla stima corrente e iterati finché la stima non si
  ferma; le tensioni di giunzione sono limitate tra un'iterazione e l'altra
  (`pnjlim`, come in SPICE) così un esponenziale non scappa.
- **Il tick**: nel punto di lavoro ogni tick è **un'iterazione** di Newton
  (guardi il risolutore convergere); nel transitorio ogni tick è **un passo
  temporale**. Stesso protocollo dei fratelli
  (`nextTime`/`stepOnce`/`advanceTo`/`finalState`), stesso Player.
- **I limiti**: potenza nominale delle resistenze, corrente massima dei diodi,
  potenza degli zener e dei transistor. Superati → evento `burn`, il componente
  si apre, lo stesso istante viene risolto di nuovo. Nei transitori la
  sollecitazione è mediata (inerzia termica): uno spunto di pochi
  millisecondi non uccide un raddrizzatore, un sovraccarico continuo sì.
- **Deterministico**: nessun `Math.random`, nessun `Date.now`. Stessa netlist,
  stessi numeri, sempre.

Il modello è deliberatamente piccolo e didattico — un diodo di Shockley, uno
zener col ginocchio a V<sub>z</sub>, un NPN con β — ma i numeri sono quelli
veri: il LED fa 2,0 V a 15 mA, il silicio 0,71 V a 10 mA, il filtro RC taglia a
−3 dB dove dice la formula.

## La netlist

```
V1 in gnd DC 9              R1 in out 4.7k [0.5W]      C1 out gnd 100n
V1 in gnd SIN 0 5 1k        L1 a b 10m                 D1 a k [SI|1N4007|LED|SCHOTTKY]
V1 in gnd PULSE 0 3.3 1k    Q1 c b e NPN [beta]        DZ1 a k ZENER 5.1
V1 in gnd STEP 5 0 0        .tran 20m [dt]             .probe out · .probe I(R1)
.scope in out               .replace C1                # commento
```

Suffissi `p n u m k M` (con una scelta deliberata: `m` è milli e `M` è mega,
non come SPICE). Errori posizionati sul token, come nell'editor di EDU-SQL.

## Curriculum

**Non serve alcun prerequisito**: alla prima visita si apre una guida
("Basi") che spiega da zero tensione, corrente e resistenza con l'analogia
dell'acqua, perché "in alto è più volt", i componenti che si incontreranno,
come si scrive una netlist e come si legge uno strumento, più un glossario.
Resta sempre raggiungibile dal bottone in alto.

14 livelli + una sandbox, in tre archi:

1. **Componenti e leggi** — la legge di Ohm (e la potenza) · serie/parallelo e
   il partitore, con la serie E12 · il partitore *sotto carico* (Thévenin) ·
   il LED e la resistenza di zavorra — con quella troppo piccola che brucia ·
   Kirchhoff e il ponte di Wheatstone da bilanciare.
2. **Il tempo e i segnali** — il condensatore e la costante di tempo ·
   l'oscilloscopio (V<sub>pp</sub>, offset, frequenza) · il filtro RC
   passa-basso a −3 dB · il diodo e il raddrizzatore a semionda · il ponte di
   Graetz e il ripple · lo zener come riferimento · il transistor come
   interruttore (saturazione, β che balla, il limite del GPIO).
3. **Il banco** — i due livelli che nessun altro simulatore ha: una scheda che
   *non funziona*, lo schema bloccato, e la sonda. **13**: l'alimentatore non
   parte — segui il segnale finché non sparisce. **14**: tensione bassa e
   ronzio — il sintomo è all'uscita, la causa è due stadi più a monte. Misuri,
   deduci, sostituisci **un** componente con `.replace`.

Ogni livello ti dà una scheda (bloccata) e ti chiede di aggiungere o
sostituire qualcosa; la verifica **misura** il circuito su più casi — alcuni
mostrati, altri **nascosti con tolleranze diverse** (la pila a 9,2 V, il carico
a 390 Ω invece di 470, un transistor con β = 60) — così passa un progetto che
regge, non un colpo di fortuna. Non c'è una "risposta giusta": il 330 µF passa
il caso visibile e fallisce il carico pesante, il 470 µF regge entrambi.

## Avvio

Sito statico puro, moduli ES, **zero build, zero dipendenze**. Servi la cartella
con un qualsiasi server statico (i moduli ES non funzionano via `file://`):

```
npm run serve        # python3 -m http.server 8000
# apri http://localhost:8000
```

Deploy su GitHub Pages da `main`/root così com'è (`.nojekyll`, percorsi relativi).

## Sviluppo / test

```
npm test             # node --test — unità, parser, fisica del risolutore, tutti i 14 livelli, anti-trucco
npm run e2e          # smoke test headless su Chrome: primer, livello 1, il LED che brucia, la riparazione del capstone, cambio lingua
```

Il core (`js/core/`) è completamente DOM-free e deterministico, quindi
testabile headless: lo stesso motore anima il circuito e corregge la tua
risposta. I test di fisica confrontano il risolutore con le formule
(partitore, 1/e, −3 dB, ripple ≈ I/(2f·C), I<sub>c</sub> = β·I<sub>b</sub>).

## Licenza

MIT © Andrea Manzi (manzolo)
