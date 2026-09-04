// The free-play sandbox: a complete little bench — bridge rectifier, reservoir,
// Zener reference and pass transistor — with the scope already on the two
// interesting nodes. No fixture, no verification: everything is yours to edit.

export const SANDBOX = {
  netlist: `# Alimentatore stabilizzato / stabilized supply
V1 a b SIN 0 15 50        # secondario del trasformatore / transformer secondary
D1 a p 1N4007
D2 b p 1N4007
D3 gnd a 1N4007
D4 gnd b 1N4007
C1 p gnd 2200u            # livellamento / reservoir
R1 p z 1k
DZ1 gnd z ZENER 6.2       # riferimento / reference
Q1 p z out NPN            # transistor serie / pass transistor
C2 out gnd 100u
RL out gnd 100 2W         # carico / load
.scope p out
.probe out I(RL)
.tran 80m`,
};
