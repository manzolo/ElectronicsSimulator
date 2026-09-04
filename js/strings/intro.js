// The beginner's primer — "what you need to know BEFORE level 1", assuming
// zero prior knowledge. Shown automatically on the first visit and always
// available from the header. One {it, en} object, same tr() convention as
// the level content.

export const INTRO = {
  it: `
<p>Benvenuto sul banco. Questa pagina spiega <b>da zero</b> le idee che
incontrerai nei livelli: niente formule difficili, cinque minuti di lettura.
Puoi riaprirla quando vuoi dal bottone <b>Basi</b> in alto.</p>

<h3>Tre parole: tensione, corrente, resistenza</h3>
<p>Pensa all'acqua in un tubo. La <b>tensione</b> (volt, V) è la
<i>pressione</i>: quanto la pila spinge. La <b>corrente</b> (ampere, A) è
<i>quanta acqua passa</i> ogni secondo. La <b>resistenza</b> (ohm, Ω) è
quanto il tubo è stretto. La legge di Ohm dice solo questo: più spingi, più
passa; più il tubo è stretto, meno passa.</p>
<pre>I = V / R        esempio del livello 1:  9 V / 450 Ω = 0,020 A = 20 mA</pre>
<p>Passare corrente in una resistenza la scalda: la <b>potenza</b> (watt, W)
è P = V · I. Una resistenza comune regge ¼ W. Qui, se le chiedi di più,
<b>brucia davvero</b> — e il circuito cambia.</p>

<h3>Perché "in alto è più volt"</h3>
<p>Nello schema di questo laboratorio i punti del circuito (i <b>nodi</b>)
sono disegnati come <b>binari orizzontali, ordinati per tensione</b>: il più
alto è quello con più volt, in fondo c'è la <b>massa</b> (<code>gnd</code>,
lo zero da cui si misura tutto). La corrente, come l'acqua, <i>scende</i>:
va dai binari alti a quelli bassi attraverso i componenti. Se tieni a mente
questa immagine, hai già capito metà dell'elettronica.</p>

<h3>I componenti che incontrerai</h3>
<p>· <b>Resistenza</b> (R): frena la corrente. La userai per dimensionare,
dividere una tensione, proteggere un LED.<br>
· <b>Condensatore</b> (C): un piccolo serbatoio di carica. Si riempie e si
svuota <i>nel tempo</i>: è lui che introduce la parola "tempo" nel
laboratorio (livello 6) e che spiana le tensioni (livello 10).<br>
· <b>Diodo</b> (D): una valvola a senso unico. Passa da anodo a catodo, e si
tiene 0,7 V per il disturbo. Il <b>LED</b> è un diodo che fa luce; lo
<b>zener</b> è un diodo che, al contrario, tiene ferma una tensione.<br>
· <b>Transistor</b> (Q): un rubinetto comandato. Una piccola corrente nella
base apre il passaggio a una corrente cento volte più grande.</p>

<h3>Come si scrive un circuito</h3>
<p>Non si disegna: si <b>elenca</b>, una riga per componente — nome, i nodi
a cui è attaccato, il valore. Si chiama <b>netlist</b> ed è quello che usano
anche i programmi professionali.</p>
<pre>V1 in gnd DC 9      # una pila da 9 V tra il nodo "in" e la massa
R1 in gnd 450       # una resistenza da 450 Ω tra "in" e la massa
.probe I(R1)        # un amperometro su R1</pre>
<p>I valori si scrivono come al banco: <code>4.7k</code>, <code>100n</code>,
<code>2200u</code>. Le lettere sono i prefissi: k = mille, m = millesimo,
u (o µ) = milionesimo, n = miliardesimo. Attenzione a una sola trappola:
<code>m</code> minuscola è milli, <code>M</code> maiuscola è mega.</p>

<h3>Gli strumenti</h3>
<p>Il <b>multimetro</b> dà un numero: una tensione tra un nodo e massa
(<code>.probe out</code>) o una corrente in un componente
(<code>.probe I(R1)</code>). L'<b>oscilloscopio</b> dà una forma: la
tensione di un nodo nel tempo (<code>.scope out</code>). Nei livelli dove
conta il tempo si aggiunge <code>.tran 20m</code> — "simula per 20
millisecondi". Puoi anche cliccare un nodo o un componente nello schema per
metterci la sonda.</p>

<h3>Piccolo glossario</h3>
<table>
<tr><th>parola</th><th>in una frase</th></tr>
<tr><td><b>nodo</b></td><td>un punto del circuito: tutto ciò che è collegato da un filo è lo stesso nodo</td></tr>
<tr><td><b>massa (gnd)</b></td><td>il nodo di riferimento, per convenzione a 0 V</td></tr>
<tr><td><b>serie / parallelo</b></td><td>uno dopo l'altro (stessa corrente) / fianco a fianco (stessa tensione)</td></tr>
<tr><td><b>partitore</b></td><td>due resistenze in serie che dividono una tensione (livello 2)</td></tr>
<tr><td><b>carico</b></td><td>ciò che il circuito deve alimentare — e che lo disturba (livello 3)</td></tr>
<tr><td><b>E12</b></td><td>i dodici valori per decade che esistono davvero in negozio: 1,0 1,2 1,5 1,8 2,2 2,7 3,3 3,9 4,7 5,6 6,8 8,2</td></tr>
<tr><td><b>costante di tempo τ</b></td><td>R·C: quanto ci mette un condensatore a scaricarsi al 37% (livello 6)</td></tr>
<tr><td><b>V<sub>pp</sub>, offset, frequenza</b></td><td>le tre cose che si leggono su un'onda (livello 7)</td></tr>
<tr><td><b>ripple</b></td><td>il residuo di alternata che resta su una tensione "continua" (livelli 10, 14)</td></tr>
<tr><td><b>saturazione</b></td><td>il transistor tutto aperto: da collettore a emettitore quasi zero volt (livello 12)</td></tr>
<tr><td><b>punto di lavoro</b></td><td>le tensioni e correnti a regime, in continua: è la prima cosa che il risolutore calcola</td></tr>
</table>

<h3>Come si usa il laboratorio</h3>
<p>In ogni livello: leggi la lezione a sinistra, guarda la <b>scheda</b> che
ti viene data (bloccata, in grigio), scrivi le tue righe sotto — o usa il
pannello <b>Componenti</b> a destra, è la stessa cosa in due vesti — e premi
<b>Esegui</b>. Guarda i fili colorarsi e le correnti scorrere; con lo
slider vai fino al <b>turbo</b>, con <b>Passo</b> avanzi di un tick alla
volta. La verifica prova il tuo circuito su più casi, alcuni <b>nascosti</b>
con tolleranze diverse: passa quello che regge, non quello che indovina.</p>
<p>Gli ultimi due livelli sono diversi: non progetti, <b>ripari</b>. Hai una
scheda che non funziona e una sonda. Segui il segnale finché non sparisce.
Buon lavoro.</p>`,

  en: `
<p>Welcome to the bench. This page explains <b>from zero</b> the ideas you
will meet in the levels: no hard formulas, five minutes of reading. You can
reopen it anytime from the <b>Basics</b> button in the header.</p>

<h3>Three words: voltage, current, resistance</h3>
<p>Think of water in a pipe. <b>Voltage</b> (volts, V) is the
<i>pressure</i>: how hard the battery pushes. <b>Current</b> (amperes, A) is
<i>how much water passes</i> each second. <b>Resistance</b> (ohms, Ω) is how
narrow the pipe is. Ohm's law says just this: push harder, more flows;
narrower pipe, less flows.</p>
<pre>I = V / R        level 1's example:  9 V / 450 Ω = 0.020 A = 20 mA</pre>
<p>Passing current through a resistor heats it: <b>power</b> (watts, W) is
P = V · I. A common resistor takes ¼ W. Here, if you ask for more, it
<b>really burns</b> — and the circuit changes.</p>

<h3>Why "higher is more volts"</h3>
<p>In this lab's schematic the points of the circuit (the <b>nodes</b>) are
drawn as <b>horizontal rails, ordered by voltage</b>: the top one has the
most volts, at the bottom sits <b>ground</b> (<code>gnd</code>, the zero
everything is measured from). Current, like water, <i>flows down</i>: from
the high rails to the low ones through the parts. Keep that picture in mind
and you already understand half of electronics.</p>

<h3>The parts you will meet</h3>
<p>· <b>Resistor</b> (R): slows current. You will use it to size, to divide
a voltage, to protect an LED.<br>
· <b>Capacitor</b> (C): a small reservoir of charge. It fills and empties
<i>over time</i>: it is what brings the word "time" into the lab (level 6)
and what smooths voltages (level 10).<br>
· <b>Diode</b> (D): a one-way valve. It passes from anode to cathode and
keeps 0.7 V for the trouble. An <b>LED</b> is a diode that emits light; a
<b>Zener</b> is a diode that, backwards, holds a voltage steady.<br>
· <b>Transistor</b> (Q): a controlled tap. A small current into the base
opens the way for a current a hundred times larger.</p>

<h3>How a circuit is written</h3>
<p>You do not draw it: you <b>list</b> it, one line per part — name, the
nodes it connects, the value. It is called a <b>netlist</b>, and it is what
professional tools use too.</p>
<pre>V1 in gnd DC 9      # a 9 V battery between node "in" and ground
R1 in gnd 450       # a 450 Ω resistor between "in" and ground
.probe I(R1)        # an ammeter on R1</pre>
<p>Values are written as on the bench: <code>4.7k</code>, <code>100n</code>,
<code>2200u</code>. The letters are prefixes: k = thousand, m = thousandth,
u (or µ) = millionth, n = billionth. Mind one trap: lowercase <code>m</code>
is milli, uppercase <code>M</code> is mega.</p>

<h3>The instruments</h3>
<p>The <b>multimeter</b> gives a number: a voltage between a node and ground
(<code>.probe out</code>) or a current through a part
(<code>.probe I(R1)</code>). The <b>oscilloscope</b> gives a shape: a node's
voltage over time (<code>.scope out</code>). In levels where time matters you
add <code>.tran 20m</code> — "simulate for 20 milliseconds". You can also
click a node or a part in the schematic to put the probe on it.</p>

<h3>A small glossary</h3>
<table>
<tr><th>word</th><th>in one sentence</th></tr>
<tr><td><b>node</b></td><td>a point of the circuit: everything joined by a wire is the same node</td></tr>
<tr><td><b>ground (gnd)</b></td><td>the reference node, 0 V by convention</td></tr>
<tr><td><b>series / parallel</b></td><td>one after the other (same current) / side by side (same voltage)</td></tr>
<tr><td><b>divider</b></td><td>two resistors in series that split a voltage (level 2)</td></tr>
<tr><td><b>load</b></td><td>what the circuit has to feed — and what disturbs it (level 3)</td></tr>
<tr><td><b>E12</b></td><td>the twelve values per decade that actually exist in the shop: 1.0 1.2 1.5 1.8 2.2 2.7 3.3 3.9 4.7 5.6 6.8 8.2</td></tr>
<tr><td><b>time constant τ</b></td><td>R·C: how long a capacitor takes to discharge to 37% (level 6)</td></tr>
<tr><td><b>V<sub>pp</sub>, offset, frequency</b></td><td>the three things you read off a wave (level 7)</td></tr>
<tr><td><b>ripple</b></td><td>the leftover AC riding on a "DC" voltage (levels 10, 14)</td></tr>
<tr><td><b>saturation</b></td><td>the transistor fully on: collector to emitter almost zero volts (level 12)</td></tr>
<tr><td><b>operating point</b></td><td>the steady DC voltages and currents: the first thing the solver computes</td></tr>
</table>

<h3>How to use the lab</h3>
<p>In every level: read the lesson on the left, look at the <b>board</b> you
are given (locked, in grey), write your lines below it — or use the
<b>Parts</b> panel on the right, same thing in two outfits — and press
<b>Run</b>. Watch the wires take colour and the currents flow; the slider
goes all the way to <b>turbo</b>, <b>Step</b> advances one tick at a time.
Verification tries your circuit on several cases, some <b>hidden</b> with
different tolerances: what holds passes, what guesses does not.</p>
<p>The last two levels are different: you do not design, you <b>repair</b>.
You get a board that does not work, and a probe. Follow the signal until it
disappears. Enjoy.</p>`,
};
