// Módulo 3: partidos, métricas post-video y testeos físicos.

exports.up = async (knex) => {
  await knex.schema.createTable('partidos', (t) => {
    t.increments('id');
    t.integer('division_id').notNullable().references('divisiones.id').onDelete('RESTRICT');
    t.string('rival', 80).notNullable();
    t.timestamp('fecha', { useTz: true }).notNullable();
    t.enu('condicion', ['LOCAL', 'VISITANTE']).notNullable();
    t.string('lugar', 120);
    t.enu('estado', ['AGENDADO', 'JUGADO']).notNullable().defaultTo('AGENDADO');
    t.integer('puntos_propios');
    t.integer('puntos_rival');
    t.timestamps(true, true);

    t.index(['division_id', 'fecha']);
    t.index(['fecha']);
  });

  // Una fila por jugador y partido con los contadores que carga el analista.
  await knex.schema.createTable('metricas_partido', (t) => {
    t.increments('id');
    t.integer('partido_id').notNullable().references('partidos.id').onDelete('RESTRICT');
    t.integer('jugador_id').notNullable().references('jugadores.usuario_id').onDelete('RESTRICT');
    t.integer('cargado_por').references('usuarios.id').onDelete('RESTRICT');
    t.integer('minutos_jugados').notNullable().defaultTo(0);
    t.integer('tackles_positivos').notNullable().defaultTo(0);
    t.integer('tackles_negativos').notNullable().defaultTo(0);
    t.integer('tackles_neutros').notNullable().defaultTo(0);
    t.integer('duelos_ganados').notNullable().defaultTo(0);
    t.integer('duelos_perdidos').notNullable().defaultTo(0);
    t.integer('duelos_neutros').notNullable().defaultTo(0);
    t.integer('obtenciones_scrum').notNullable().defaultTo(0);
    t.integer('obtenciones_lineout').notNullable().defaultTo(0);
    t.integer('obtenciones_ruck').notNullable().defaultTo(0);
    t.integer('obtenciones_maul').notNullable().defaultTo(0);
    t.integer('obtenciones_kickoff').notNullable().defaultTo(0);
    t.timestamps(true, true);

    t.unique(['partido_id', 'jugador_id']);
    t.index(['jugador_id']);
  });
  await knex.raw(`
    ALTER TABLE metricas_partido ADD CONSTRAINT metricas_no_negativas CHECK (
      minutos_jugados >= 0
      AND tackles_positivos >= 0 AND tackles_negativos >= 0 AND tackles_neutros >= 0
      AND duelos_ganados >= 0 AND duelos_perdidos >= 0 AND duelos_neutros >= 0
      AND obtenciones_scrum >= 0 AND obtenciones_lineout >= 0 AND obtenciones_ruck >= 0
      AND obtenciones_maul >= 0 AND obtenciones_kickoff >= 0
    )
  `);

  await knex.schema.createTable('testeos_fisicos', (t) => {
    t.increments('id');
    t.integer('jugador_id').notNullable().references('jugadores.usuario_id').onDelete('RESTRICT');
    t.integer('registrado_por').references('usuarios.id').onDelete('RESTRICT');
    t.enu('tipo', ['VELOCIDAD_40M', 'FUERZA_MAXIMA', 'RESISTENCIA']).notNullable();
    t.decimal('valor', 8, 2).notNullable();
    // seg, kg, ml/kg
    t.string('unidad', 10).notNullable();
    t.date('fecha').notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['jugador_id', 'tipo', 'fecha']);
  });
  await knex.raw(
    'ALTER TABLE testeos_fisicos ADD CONSTRAINT testeos_valor_positivo CHECK (valor > 0)',
  );
};

exports.down = async (knex) => {
  await knex.schema.dropTable('testeos_fisicos');
  await knex.schema.dropTable('metricas_partido');
  await knex.schema.dropTable('partidos');
};
