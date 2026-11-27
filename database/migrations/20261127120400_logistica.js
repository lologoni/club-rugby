// Módulo 5: materiales y préstamos.

exports.up = async (knex) => {
  await knex.schema.createTable('materiales', (t) => {
    t.increments('id');
    t.string('nombre', 80).notNullable().unique();
    // Pelota, Escudo, Cono, Camiseta, Otro
    t.string('categoria', 30).notNullable();
    t.integer('stock_total').notNullable();
    t.integer('stock_disponible').notNullable();
    t.boolean('activo').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE materiales ADD CONSTRAINT materiales_stock_valido
      CHECK (stock_total >= 0 AND stock_disponible >= 0 AND stock_disponible <= stock_total)
  `);

  await knex.schema.createTable('prestamos', (t) => {
    t.increments('id');
    // Usuario que registró el préstamo.
    t.integer('entrenador_id').notNullable().references('usuarios.id').onDelete('RESTRICT');
    // Quien retira físicamente (entrenador, delegado...).
    t.string('responsable', 80).notNullable();
    t.timestamp('fecha_retiro', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('fecha_estimada_devolucion', { useTz: true }).notNullable();
    t.enu('estado', ['ACTIVO', 'DEVUELTO']).notNullable().defaultTo('ACTIVO');
    t.timestamp('fecha_devolucion', { useTz: true });
    t.text('observacion');
    t.timestamps(true, true);

    t.index(['estado', 'fecha_estimada_devolucion']);
    t.index(['entrenador_id']);
  });

  await knex.schema.createTable('prestamo_items', (t) => {
    t.increments('id');
    t.integer('prestamo_id').notNullable().references('prestamos.id').onDelete('CASCADE');
    t.integer('material_id').notNullable().references('materiales.id').onDelete('RESTRICT');
    t.integer('cantidad_prestada').notNullable();
    // null mientras no se devuelve; menor a lo prestado si hubo roturas o pérdidas.
    t.integer('cantidad_devuelta');

    t.unique(['prestamo_id', 'material_id']);
    t.index(['material_id']);
  });
  await knex.raw(`
    ALTER TABLE prestamo_items ADD CONSTRAINT prestamo_items_cantidades CHECK (
      cantidad_prestada > 0
      AND (cantidad_devuelta IS NULL OR cantidad_devuelta BETWEEN 0 AND cantidad_prestada)
    )
  `);
};

exports.down = async (knex) => {
  await knex.schema.dropTable('prestamo_items');
  await knex.schema.dropTable('prestamos');
  await knex.schema.dropTable('materiales');
};
