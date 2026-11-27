// Datos de prueba para desarrollo y la demo.
// Borra todo y vuelve a cargar, así que se puede correr las veces que haga falta.
//
// Cuentas (contraseña de todas: club1234):
//   tesorero@club.test      Tesorero
//   analista@club.test      Analista de video
//   entrenador@club.test    Entrenador (Plantel Superior)
//   entrenador2@club.test   Entrenador (M17)
//   tomas.rodriguez@club.test  y el resto de los jugadores: nombre.apellido@club.test
//
// Estados financieros que quedan cargados (con fecha de hoy entre 11/11 y 10/12/2026):
//   Morosos:     Joaquín Méndez, Felipe Castro, Nahuel Benítez, Franco Medina, Valentín Rojas
//   Exceptuados: Mateo Fernández (beca), Agustín Herrera (colaboración en buffet),
//                Facundo Ruiz (retraso contemplado hasta el 15/12)
//   Inactivo:    Ramiro Paz (baja lógica)

// bcrypt de 'club1234' (compatible con bcrypt y bcryptjs)
const PASSWORD_HASH = '$2a$10$WtBm4McWIoBNA/shz9FtuuHhlVqV0SROLl8pm52CJojzpHQVUoyOC';
const MONTO_CUOTA = 15000;
const PERIODOS = ['2026-08', '2026-09', '2026-10', '2026-11'];

const TABLAS = [
  'prestamo_items',
  'prestamos',
  'materiales',
  'citaciones',
  'convocatorias',
  'testeos_fisicos',
  'metricas_partido',
  'partidos',
  'pagos',
  'excepciones',
  'cuotas',
  'jugadores',
  'usuarios',
  'divisiones',
];

// PRNG con semilla fija para que los datos salgan iguales en todas las máquinas.
function crearRandom(semilla) {
  let a = semilla;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rnd.entre = (min, max) => min + Math.floor(rnd() * (max - min + 1));
  rnd.elegir = (lista) => lista[Math.floor(rnd() * lista.length)];
  return rnd;
}

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const emailDe = (nombre, apellido) =>
  sinTildes(`${nombre}.${apellido}@club.test`).toLowerCase().replace(/\s+/g, '');

function sumarDias(fechaISO, dias) {
  const d = new Date(`${fechaISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// La cuota del período YYYY-MM vence el día 10 del mes siguiente.
function vencimientoDe(periodo) {
  const [anio, mes] = periodo.split('-').map(Number);
  const siguiente = mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, '0')}`;
  return `${siguiente}-10`;
}

const PUESTOS = [
  'Pilar',
  'Hooker',
  'Pilar',
  'Segunda línea',
  'Segunda línea',
  'Ala',
  'Ala',
  'Octavo',
  'Medio scrum',
  'Apertura',
  'Wing',
  'Centro',
  'Centro',
  'Wing',
  'Fullback',
];
const FORWARDS = ['Pilar', 'Hooker', 'Segunda línea', 'Ala', 'Octavo'];

// [nombre, apellido, dni, puesto, división]; los primeros salen de los wireframes.
const JUGADORES = [
  ['Tomás', 'Rodríguez', '40123456', 'Pilar', 'Plantel Superior'],
  ['Joaquín', 'Méndez', '41234567', 'Hooker', 'Plantel Superior'],
  ['Bruno', 'Silva', '42345678', 'Apertura', 'Plantel Superior'],
  ['Mateo', 'Fernández', '38987654', 'Centro', 'Plantel Superior'],
  ['Lucas', 'Gómez', '43456789', 'Wing', 'Plantel Superior'],
  ['Andrés', 'Torres', '35654321', 'Fullback', 'Plantel Superior'],
  ['Santiago', 'López', '44567890', 'Octavo', 'M17'],
  ['Felipe', 'Castro', '45678901', 'Medio scrum', 'M17'],
  ['Ignacio', 'Pérez', '46789012', 'Wing', 'M15'],
  ['Diego', 'Romero', '47876543', 'Fullback', 'M15'],
];
const NOMBRES_EXTRA = [
  ['Nahuel', 'Benítez'],
  ['Franco', 'Medina'],
  ['Agustín', 'Herrera'],
  ['Facundo', 'Ruiz'],
  ['Valentín', 'Rojas'],
  ['Ramiro', 'Paz'],
  ['Julián', 'Molina'],
  ['Tobías', 'Acuña'],
  ['Martín', 'Suárez'],
  ['Gonzalo', 'Ríos'],
  ['Emiliano', 'Vera'],
  ['Thiago', 'Luna'],
  ['Benjamín', 'Ortiz'],
  ['Lautaro', 'Navarro'],
  ['Simón', 'Ibarra'],
  ['Juan Cruz', 'Godoy'],
  ['Máximo', 'Correa'],
  ['Bautista', 'Ferreyra'],
  ['Alejo', 'Cabrera'],
  ['Pedro', 'Quiroga'],
  ['Manuel', 'Arias'],
  ['Ezequiel', 'Peralta'],
  ['Dante', 'Figueroa'],
  ['Lorenzo', 'Sosa'],
  ['Nicanor', 'Aguirre'],
  ['Camilo', 'Domínguez'],
  ['Ian', 'Moreno'],
  ['Francisco', 'Villalba'],
  ['León', 'Giménez'],
  ['Hernán', 'Pereyra'],
];
// Cuántos jugadores extra va a cada división (total 40 con los de arriba).
const REPARTO_EXTRA = [
  ['Plantel Superior', 16],
  ['M19', 6],
  ['M17', 5],
  ['M15', 3],
];
const NACIMIENTO = {
  'Plantel Superior': [1995, 2006],
  M19: [2007, 2008],
  M17: [2009, 2010],
  M15: [2011, 2012],
};

const MOROSOS = [
  'Joaquín Méndez',
  'Felipe Castro',
  'Nahuel Benítez',
  'Franco Medina',
  'Valentín Rojas',
];
const EXCEPTUADOS = {
  'Mateo Fernández': {
    tipo: 'BECA',
    fecha_inicio: '2026-03-01',
    fecha_fin: null,
    observacion: 'Beca deportiva',
  },
  'Agustín Herrera': {
    tipo: 'COLABORACION',
    fecha_inicio: '2026-11-01',
    fecha_fin: '2026-12-31',
    observacion: 'Trabajo en buffet los días de partido',
  },
  'Facundo Ruiz': {
    tipo: 'RETRASO_CONTEMPLADO',
    fecha_inicio: '2026-11-15',
    fecha_fin: '2026-12-15',
    observacion: 'Avisó que paga a mediados de diciembre',
  },
};
const INACTIVO = 'Ramiro Paz';

const RIVALES = [
  'Belgrano',
  'Hindú',
  'SIC',
  'Alumni',
  'CUBA',
  'Newman',
  'Pucará',
  'La Plata RC',
  'Regatas',
  'Los Tilos',
  'San Luis',
  'Champagnat',
];
const HORA_DIVISION = {
  'Plantel Superior': '15:30',
  M19: '13:30',
  M17: '11:00',
  M15: '10:00',
};
// Fechas de partidos jugados por división; el último de cada lista queda agendado.
const FECHAS_PARTIDOS = {
  'Plantel Superior': [
    '2026-08-22',
    '2026-08-29',
    '2026-09-05',
    '2026-09-12',
    '2026-09-19',
    '2026-09-26',
    '2026-10-03',
    '2026-10-17',
    '2026-10-31',
    '2026-11-14',
    '2026-11-21',
    '2026-12-05',
  ],
  M19: ['2026-09-05', '2026-09-26', '2026-10-17', '2026-11-14', '2026-12-05'],
  M17: ['2026-09-05', '2026-09-26', '2026-10-17', '2026-11-14', '2026-12-05'],
  M15: ['2026-09-12', '2026-10-03', '2026-10-31', '2026-11-21', '2026-12-05'],
};

exports.seed = async (knex) => {
  const rnd = crearRandom(23);

  await knex.raw(`TRUNCATE ${TABLAS.join(', ')} RESTART IDENTITY CASCADE`);

  // Divisiones
  const divisiones = await knex('divisiones')
    .insert(['M15', 'M17', 'M19', 'Plantel Superior'].map((nombre) => ({ nombre })))
    .returning(['id', 'nombre']);
  const divisionId = Object.fromEntries(divisiones.map((d) => [d.nombre, d.id]));

  // Staff
  const staff = [
    ['Carlos', 'Vidal', '34543210', 'TESORERO', 'tesorero@club.test'],
    ['Martina', 'Sosa', '33221100', 'ANALISTA', 'analista@club.test'],
    ['Pablo', 'Giménez', '36765432', 'ENTRENADOR', 'entrenador@club.test'],
    ['Federico', 'Acosta', '31987123', 'ENTRENADOR', 'entrenador2@club.test'],
  ];
  const staffIds = await knex('usuarios')
    .insert(
      staff.map(([nombre, apellido, dni, rol, email]) => ({
        nombre,
        apellido,
        dni,
        email,
        rol,
        telefono: `+54 221 4${dni.slice(-6)}`,
        fecha_nacimiento: `19${rnd.entre(75, 92)}-0${rnd.entre(1, 9)}-1${rnd.entre(0, 9)}`,
        password_hash: PASSWORD_HASH,
        fecha_alta: '2024-03-01',
      })),
    )
    .returning(['id', 'rol']);
  const tesoreroId = staffIds[0].id;
  const analistaId = staffIds[1].id;
  const entrenadorId = staffIds[2].id;
  const entrenador2Id = staffIds[3].id;

  // Jugadores
  const listaJugadores = [...JUGADORES];
  let extra = 0;
  for (const [division, cantidad] of REPARTO_EXTRA) {
    for (let i = 0; i < cantidad; i++) {
      const [nombre, apellido] = NOMBRES_EXTRA[extra];
      const dni = String(39000000 + extra * 211537).slice(0, 8);
      listaJugadores.push([nombre, apellido, dni, PUESTOS[i % PUESTOS.length], division]);
      extra++;
    }
  }

  const jugadores = [];
  for (const [i, [nombre, apellido, dni, puesto, division]] of listaJugadores.entries()) {
    const completo = `${nombre} ${apellido}`;
    const inactivo = completo === INACTIVO;
    const [anioDesde, anioHasta] = NACIMIENTO[division];
    const [usuario] = await knex('usuarios')
      .insert({
        nombre,
        apellido,
        dni,
        email: emailDe(nombre, apellido),
        telefono: `+54 221 5${dni.slice(-6)}`,
        fecha_nacimiento: `${rnd.entre(anioDesde, anioHasta)}-${String(rnd.entre(1, 12)).padStart(2, '0')}-${String(rnd.entre(1, 28)).padStart(2, '0')}`,
        password_hash: PASSWORD_HASH,
        rol: 'JUGADOR',
        estado: inactivo ? 'INACTIVO' : 'ACTIVO',
        fecha_alta: `202${rnd.entre(2, 5)}-03-01`,
        fecha_baja: inactivo ? '2026-10-01' : null,
      })
      .returning('id');
    await knex('jugadores').insert({
      usuario_id: usuario.id,
      nro_socio: 1001 + i,
      division_id: divisionId[division],
      puesto,
    });
    jugadores.push({ id: usuario.id, completo, puesto, division, inactivo });
  }
  const activos = jugadores.filter((j) => !j.inactivo);

  // Cuotas y pagos
  for (const j of jugadores) {
    const periodos = j.inactivo ? PERIODOS.slice(0, 2) : PERIODOS;
    for (const periodo of periodos) {
      const vencimiento = vencimientoDe(periodo);
      let pagada = true;
      if (MOROSOS.includes(j.completo) || EXCEPTUADOS[j.completo]) {
        // Deben octubre; Méndez además debe septiembre.
        pagada = periodo < '2026-09' || (periodo === '2026-09' && j.completo !== 'Joaquín Méndez');
      }
      // Noviembre todavía no venció: paga más o menos la mitad.
      if (periodo === '2026-11' && pagada) pagada = rnd() < 0.45;

      const fechaPago = sumarDias(vencimiento, -rnd.entre(1, 20));
      const [cuota] = await knex('cuotas')
        .insert({
          jugador_id: j.id,
          periodo,
          monto: MONTO_CUOTA,
          fecha_generacion: `${periodo}-01`,
          fecha_vencimiento: vencimiento,
          estado: pagada ? 'PAGADA' : 'PENDIENTE',
          fecha_pago: pagada ? `${fechaPago}T15:00:00-03:00` : null,
        })
        .returning('id');

      if (pagada) {
        const metodo =
          periodo >= '2026-10' ? 'MERCADO_PAGO' : rnd.elegir(['EFECTIVO', 'TRANSFERENCIA']);
        await knex('pagos').insert({
          cuota_id: cuota.id,
          fecha: `${fechaPago}T15:00:00-03:00`,
          monto: MONTO_CUOTA,
          metodo_pago: metodo,
          estado_transaccion: 'APROBADO',
          id_transaccion_mp: metodo === 'MERCADO_PAGO' ? String(1300000000 + cuota.id) : null,
          registrado_por: metodo === 'MERCADO_PAGO' ? null : tesoreroId,
        });
      } else if (periodo === '2026-10' && j.completo === 'Felipe Castro') {
        // Un intento rechazado para que el historial tenga de todo.
        await knex('pagos').insert({
          cuota_id: cuota.id,
          fecha: '2026-11-05T19:20:00-03:00',
          monto: MONTO_CUOTA,
          metodo_pago: 'MERCADO_PAGO',
          estado_transaccion: 'RECHAZADO',
          id_transaccion_mp: String(1300000000 + cuota.id),
        });
      }
    }
  }

  // Excepciones vigentes y una vencida para el historial.
  for (const j of jugadores) {
    const e = EXCEPTUADOS[j.completo];
    if (e) await knex('excepciones').insert({ jugador_id: j.id, autorizada_por: tesoreroId, ...e });
  }
  await knex('excepciones').insert({
    jugador_id: activos[0].id,
    tipo: 'RETRASO_CONTEMPLADO',
    fecha_inicio: '2026-08-10',
    fecha_fin: '2026-08-31',
    observacion: 'Pagó agosto a fin de mes',
    autorizada_por: tesoreroId,
  });

  // Partidos
  const partidos = [];
  for (const [division, fechas] of Object.entries(FECHAS_PARTIDOS)) {
    for (const [i, fecha] of fechas.entries()) {
      const jugado = i < fechas.length - 1;
      const condicion = !jugado || i % 2 === 0 ? 'LOCAL' : 'VISITANTE';
      const rival =
        division === 'Plantel Superior' && !jugado
          ? 'CUBA'
          : RIVALES[(i * 5 + division.length) % RIVALES.length];
      const [p] = await knex('partidos')
        .insert({
          division_id: divisionId[division],
          rival,
          fecha: `${fecha}T${HORA_DIVISION[division]}:00-03:00`,
          condicion,
          lugar: condicion === 'LOCAL' ? 'Cancha del club' : `Cancha de ${rival}`,
          estado: jugado ? 'JUGADO' : 'AGENDADO',
          puntos_propios: jugado ? rnd.entre(7, 45) : null,
          puntos_rival: jugado ? rnd.entre(5, 40) : null,
        })
        .returning('id');
      partidos.push({ id: p.id, division, jugado });
    }
  }

  // Métricas post-partido: los primeros 15 de la división son titulares, el resto entra de suplente.
  for (const p of partidos.filter((x) => x.jugado)) {
    const plantel = activos.filter((j) => j.division === p.division);
    const filas = plantel.map((j, i) => {
      const titular = i < 15;
      const forward = FORWARDS.includes(j.puesto);
      const factor = titular ? 1 : 0.4;
      const n = (min, max) => Math.round(rnd.entre(min, max) * factor);
      return {
        partido_id: p.id,
        jugador_id: j.id,
        cargado_por: analistaId,
        minutos_jugados: titular ? rnd.entre(55, 80) : rnd.entre(10, 30),
        tackles_positivos: n(forward ? 5 : 3, forward ? 14 : 9),
        tackles_negativos: n(0, 3),
        tackles_neutros: n(0, 3),
        duelos_ganados: n(1, 8),
        duelos_perdidos: n(0, 5),
        duelos_neutros: n(0, 3),
        obtenciones_scrum: forward && j.puesto !== 'Ala' ? n(0, 4) : 0,
        obtenciones_lineout: ['Hooker', 'Segunda línea'].includes(j.puesto) ? n(1, 6) : 0,
        obtenciones_ruck: n(0, 6),
        obtenciones_maul: forward ? n(0, 2) : 0,
        obtenciones_kickoff: n(0, 2),
      };
    });
    if (filas.length) await knex('metricas_partido').insert(filas);
  }

  // Testeos físicos: tres tomas con una mejora leve entre cada una.
  const tomas = ['2026-08-15', '2026-09-19', '2026-11-07'];
  const testeos = [];
  for (const j of activos) {
    const forward = FORWARDS.includes(j.puesto);
    let velocidad = forward ? 6.0 + rnd() * 0.6 : 5.2 + rnd() * 0.5;
    let fuerza = forward ? 120 + rnd() * 40 : 85 + rnd() * 30;
    let resistencia = forward ? 42 + rnd() * 6 : 48 + rnd() * 7;
    for (const fecha of tomas) {
      const registrado_por = j.division === 'M17' ? entrenador2Id : entrenadorId;
      testeos.push(
        {
          jugador_id: j.id,
          registrado_por,
          tipo: 'VELOCIDAD_40M',
          valor: velocidad.toFixed(2),
          unidad: 'seg',
          fecha,
        },
        {
          jugador_id: j.id,
          registrado_por,
          tipo: 'FUERZA_MAXIMA',
          valor: fuerza.toFixed(1),
          unidad: 'kg',
          fecha,
        },
        {
          jugador_id: j.id,
          registrado_por,
          tipo: 'RESISTENCIA',
          valor: resistencia.toFixed(1),
          unidad: 'ml/kg',
          fecha,
        },
      );
      velocidad -= rnd() * 0.12;
      fuerza += rnd() * 6;
      resistencia += rnd() * 1.5;
    }
  }
  await knex('testeos_fisicos').insert(testeos);

  // Convocatoria publicada para el próximo partido del Plantel Superior (sin morosos).
  const proximo = partidos.find((p) => p.division === 'Plantel Superior' && !p.jugado);
  const [convocatoria] = await knex('convocatorias')
    .insert({
      partido_id: proximo.id,
      entrenador_id: entrenadorId,
      estado: 'PUBLICADA',
      hora_citacion: '13:30',
      publicada_en: '2026-11-26T20:00:00-03:00',
    })
    .returning('id');
  const habilitados = activos.filter(
    (j) => j.division === 'Plantel Superior' && !MOROSOS.includes(j.completo),
  );
  await knex('citaciones').insert(
    habilitados.slice(0, 15 + 5).map((j, i) => ({
      convocatoria_id: convocatoria.id,
      jugador_id: j.id,
      tipo: i < 15 ? 'TITULAR' : 'SUPLENTE',
      puesto: j.puesto,
      confirmado: i % 3 !== 0,
      fecha_confirmacion: i % 3 !== 0 ? '2026-11-27T10:00:00-03:00' : null,
    })),
  );

  // Materiales y préstamos. El stock disponible se calcula a partir de los préstamos activos.
  const catalogo = [
    ['Pelota Match N°5', 'Pelota', 12],
    ['Pelota Entrenamiento N°4', 'Pelota', 20],
    ['Escudo de choque', 'Escudo', 30],
    ['Conos', 'Cono', 50],
    ['Camiseta Titular', 'Camiseta', 25],
    ['Postes de tackle', 'Otro', 8],
  ];
  const materiales = await knex('materiales')
    .insert(
      catalogo.map(([nombre, categoria, total]) => ({
        nombre,
        categoria,
        stock_total: total,
        stock_disponible: total,
      })),
    )
    .returning(['id', 'nombre']);
  const materialId = Object.fromEntries(materiales.map((m) => [m.nombre, m.id]));

  const prestamos = [
    {
      entrenador_id: entrenador2Id,
      responsable: 'Federico Acosta',
      fecha_retiro: '2026-11-24T10:00:00-03:00',
      fecha_estimada_devolucion: '2026-11-25T22:00:00-03:00',
      estado: 'ACTIVO',
      items: [
        ['Pelota Match N°5', 4],
        ['Postes de tackle', 5],
      ],
    },
    {
      entrenador_id: entrenadorId,
      responsable: 'Pablo Giménez',
      fecha_retiro: '2026-11-27T19:00:00-03:00',
      fecha_estimada_devolucion: '2026-11-28T22:00:00-03:00',
      estado: 'ACTIVO',
      items: [
        ['Conos', 38],
        ['Escudo de choque', 8],
        ['Camiseta Titular', 7],
      ],
    },
    {
      entrenador_id: entrenadorId,
      responsable: 'Pablo Giménez',
      fecha_retiro: '2026-11-20T19:00:00-03:00',
      fecha_estimada_devolucion: '2026-11-20T22:00:00-03:00',
      estado: 'DEVUELTO',
      fecha_devolucion: '2026-11-20T21:45:00-03:00',
      observacion: 'Se pinchó una pelota',
      items: [['Pelota Entrenamiento N°4', 6, 5]],
    },
  ];
  for (const { items, ...prestamo } of prestamos) {
    const [p] = await knex('prestamos').insert(prestamo).returning('id');
    for (const [nombre, prestada, devuelta] of items) {
      await knex('prestamo_items').insert({
        prestamo_id: p.id,
        material_id: materialId[nombre],
        cantidad_prestada: prestada,
        cantidad_devuelta: devuelta ?? null,
      });
      if (prestamo.estado === 'ACTIVO') {
        await knex('materiales')
          .where({ id: materialId[nombre] })
          .decrement('stock_disponible', prestada);
      } else if (devuelta < prestada) {
        // Lo perdido o roto se da de baja del total.
        await knex('materiales')
          .where({ id: materialId[nombre] })
          .decrement({ stock_total: prestada - devuelta, stock_disponible: prestada - devuelta });
      }
    }
  }
};
