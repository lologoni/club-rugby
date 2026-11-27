// Módulo 4: convocatorias y citaciones.

exports.up = async (knex) => {
  await knex.schema.createTable('convocatorias', (t) => {
    t.increments('id');
    t.integer('partido_id').notNullable().unique().references('partidos.id').onDelete('RESTRICT');
    t.integer('entrenador_id').notNullable().references('usuarios.id').onDelete('RESTRICT');
    t.enu('estado', ['BORRADOR', 'PUBLICADA']).notNullable().defaultTo('BORRADOR');
    t.time('hora_citacion');
    t.timestamp('publicada_en', { useTz: true });
    t.timestamps(true, true);
  });

  await knex.schema.createTable('citaciones', (t) => {
    t.increments('id');
    // Las citaciones son parte de la convocatoria: si se borra un borrador, se van con él.
    t.integer('convocatoria_id').notNullable().references('convocatorias.id').onDelete('CASCADE');
    t.integer('jugador_id').notNullable().references('jugadores.usuario_id').onDelete('RESTRICT');
    t.enu('tipo', ['TITULAR', 'SUPLENTE']).notNullable();
    t.string('puesto', 30);
    t.boolean('confirmado').notNullable().defaultTo(false);
    t.timestamp('fecha_confirmacion', { useTz: true });

    t.unique(['convocatoria_id', 'jugador_id']);
    t.index(['jugador_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('citaciones');
  await knex.schema.dropTable('convocatorias');
};
