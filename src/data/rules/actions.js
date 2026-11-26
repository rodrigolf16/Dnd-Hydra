export const STANDARD_ACTIONS = [
  { id: 'std-dash', name: 'Correr (Dash)', kind: 'action', icon: '⚡', short: 'Duplica su movimiento este turno (+velocidad).', meta: 'Usa acción' },
  { id: 'std-disengage', name: 'Destrabarse (Disengage)', kind: 'action', icon: '↺', short: 'Su movimiento no provoca ataques de oportunidad este turno.', meta: 'Usa acción' },
  { id: 'std-dodge', name: 'Esquivar (Dodge)', kind: 'action', icon: '⛨', short: 'Ataques contra él tienen desventaja hasta su próximo turno.', meta: 'Usa acción' },
  { id: 'std-hide', name: 'Esconderse (Hide)', kind: 'action', icon: '◐', short: 'Tira 1×d20 + Sigilo (CD 15) y anota el resultado.', meta: '1 dado físico (d20)', diceKind: 'stealth' },
  { id: 'std-help', name: 'Ayudar (Help)', kind: 'action', icon: '✚', short: 'Otorga ventaja a un aliado en su próxima prueba o ataque.', meta: 'Usa acción' },
  { id: 'std-ready', name: 'Preparar acción (Ready)', kind: 'action', icon: '⧗', short: 'Define un desencadenante y ejecuta la acción con su Reacción.', meta: 'Usa acción + reacción' }
];

export const MASTERY_DESCRIPTIONS = {
  mellar: 'Mellar (Nick): cuando atacas con un arma ligera, haces el ataque extra con otra arma ligera dentro de la misma Acción Atacar (sin gastar tu Acción adicional, 1/turno).',
  molestar: 'Molestar (Vex): si impactas y haces daño, tienes Ventaja en tu próximo ataque contra esa criatura antes del final de tu siguiente turno.',
  hender: 'Hender (Cleave): al impactar cuerpo a cuerpo, puedes hacer un ataque extra contra otra criatura a 1,5 m de la primera (sin sumar mod. al daño, 1/turno).',
  rozar: 'Rozar (Graze): si fallas el ataque, igual haces daño igual a tu modificador de característica (FUE).',
  empujar: 'Empujar (Push): al impactar, puedes empujar a una criatura Grande o menor hasta 3 m en línea recta.',
  derribar: 'Derribar (Topple): al impactar, el objetivo hace salvación de CON (CD 8 + comp. + mod.) o cae Derribado.',
  ralentizar: 'Ralentizar (Slow): al impactar y hacer daño, reduces la velocidad del objetivo en 3 m hasta el inicio de tu próximo turno.'
};
