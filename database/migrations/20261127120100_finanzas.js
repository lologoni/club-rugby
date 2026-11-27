// Módulo 2: cuotas, pagos y excepciones de deuda.

exports.up = async (knex) => {
  await knex.schema.createTable('cuotas', (t) => {
    t.increments('id');
    t.integer('jugador_id').notNullable().references('jugadores.usuario_id').onDelete('RESTRICT');
    // Formato 'YYYY-MM'
    t.string('periodo', 7).notNullable();
    t.decimal('monto', 12, 2).notNullable();
    t.date('fecha_generacion').notNullable().defaultTo(knex.fn.now());
    t.date('fecha_vencimiento').notNullable();
    t.enu('estado', ['PENDIENTE', 'PAGADA']).notNullable().defaultTo('PENDIENTE');
    t.timestamp('fecha_pago', { useTz: true });

    // Generar dos veces el mismo mes no duplica cuotas.
    t.unique(['jugador_id', 'periodo']);
    t.index(['estado', 'fecha_vencimiento']);
    t.index(['periodo']);
  });
  await knex.raw(`
    ALTER TABLE cuotas
      ADD CONSTRAINT cuotas_periodo_formato CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
      ADD CONSTRAINT cuotas_monto_positivo CHECK (monto > 0)
  `);

  await knex.schema.createTable('pagos', (t) => {
    t.increments('id');
    t.integer('cuota_id').notNullable().references('cuotas.id').onDelete('RESTRICT');
    t.timestamp('fecha', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.decimal('monto', 12, 2).notNullable();
    t.enu('metodo_pago', ['MERCADO_PAGO', 'EFECTIVO', 'TRANSFERENCIA']).notNullable();
    t.enu('estado_transaccion', ['APROBADO', 'RECHAZADO', 'PENDIENTE']).notNullable();
    // Id del pago en Mercado Pago; con cuota_id forma la clave de idempotencia del webhook.
    t.string('id_transaccion_mp', 64);
    // Tesorero que cargó un pago manual (null si vino de Mercado Pago).
    t.integer('registrado_por').references('usuarios.id').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['id_transaccion_mp', 'cuota_id']);
    t.index(['cuota_id']);
    t.index(['fecha']);
  });
  // Una cuota no puede tener dos pagos aprobados.
  await knex.raw(`
    CREATE UNIQUE INDEX pagos_un_aprobado_por_cuota
      ON pagos (cuota_id) WHERE estado_transaccion = 'APROBADO'
  `);

  await knex.schema.createTable('excepciones', (t) => {
    t.increments('id');
    t.integer('jugador_id').notNullable().references('jugadores.usuario_id').onDelete('RESTRICT');
    t.enu('tipo', ['BECA', 'RETRASO_CONTEMPLADO', 'COLABORACION']).notNullable();
    t.date('fecha_inicio').notNullable().defaultTo(knex.fn.now());
    // null = sin vencimiento
    t.date('fecha_fin');
    t.text('observacion');
    // null en las excepciones importadas del Excel.
    t.integer('autorizada_por').references('usuarios.id').onDelete('RESTRICT');
    t.timestamp('anulada_en', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['jugador_id', 'fecha_fin']);
  });
  await knex.raw(`
    ALTER TABLE excepciones
      ADD CONSTRAINT excepciones_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
  `);

  // Estado financiero de cada jugador, calculado siempre al momento:
  //   AL_DIA      sin cuotas vencidas impagas
  //   EXCEPTUADO  con cuotas vencidas impagas y una excepción vigente
  //   MOROSO      con cuotas vencidas impagas y sin excepción vigente
  await knex.raw(`
    CREATE VIEW v_estado_financiero AS
    SELECT
      j.usuario_id AS jugador_id,
      COALESCE(v.deuda, 0)::numeric(12, 2) AS deuda,
      COALESCE(v.cuotas_vencidas, 0)::int AS cuotas_vencidas,
      e.id AS excepcion_id,
      e.tipo AS excepcion_tipo,
      e.fecha_fin AS excepcion_fecha_fin,
      CASE
        WHEN COALESCE(v.cuotas_vencidas, 0) = 0 THEN 'AL_DIA'
        WHEN e.id IS NOT NULL THEN 'EXCEPTUADO'
        ELSE 'MOROSO'
      END AS estado
    FROM jugadores j
    LEFT JOIN (
      SELECT jugador_id, SUM(monto) AS deuda, COUNT(*) AS cuotas_vencidas
      FROM cuotas
      WHERE estado = 'PENDIENTE' AND fecha_vencimiento < CURRENT_DATE
      GROUP BY jugador_id
    ) v ON v.jugador_id = j.usuario_id
    LEFT JOIN LATERAL (
      SELECT id, tipo, fecha_fin
      FROM excepciones x
      WHERE x.jugador_id = j.usuario_id
        AND x.anulada_en IS NULL
        AND x.fecha_inicio <= CURRENT_DATE
        AND (x.fecha_fin IS NULL OR x.fecha_fin >= CURRENT_DATE)
      ORDER BY x.fecha_fin DESC NULLS FIRST
      LIMIT 1
    ) e ON true
  `);
};

exports.down = async (knex) => {
  await knex.raw('DROP VIEW IF EXISTS v_estado_financiero');
  await knex.schema.dropTable('excepciones');
  await knex.schema.dropTable('pagos');
  await knex.schema.dropTable('cuotas');
};
