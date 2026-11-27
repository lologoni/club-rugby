// Módulo 1: padrón y usuarios.
// Todas las personas del club son usuarios con un único rol. Los jugadores/socios
// tienen además una fila en `jugadores` que comparte la PK con `usuarios`,
// así que el id de socio y el id de usuario son el mismo número.

exports.up = async (knex) => {
  await knex.schema.createTable('divisiones', (t) => {
    t.increments('id');
    t.string('nombre', 50).notNullable().unique();
  });

  await knex.schema.createTable('usuarios', (t) => {
    t.increments('id');
    t.string('nombre', 80).notNullable();
    t.string('apellido', 80).notNullable();
    t.string('dni', 15).notNullable().unique();
    // Se guarda siempre en minúsculas.
    t.string('email', 120).notNullable().unique();
    t.string('telefono', 40);
    t.date('fecha_nacimiento');
    // Puede quedar en null hasta que la persona cree su contraseña.
    t.string('password_hash', 100);
    t.enu('rol', ['TESORERO', 'ANALISTA', 'ENTRENADOR', 'JUGADOR']).notNullable();
    // Baja lógica (RNF-04): nunca se borran usuarios, se pasan a INACTIVO.
    t.enu('estado', ['ACTIVO', 'INACTIVO']).notNullable().defaultTo('ACTIVO');
    t.date('fecha_alta').notNullable().defaultTo(knex.fn.now());
    t.date('fecha_baja');
    t.timestamps(true, true);

    t.index(['rol', 'estado']);
  });

  await knex.schema.createTable('jugadores', (t) => {
    t.integer('usuario_id').primary().references('usuarios.id').onDelete('RESTRICT');
    t.integer('nro_socio').unique();
    t.integer('division_id').notNullable().references('divisiones.id').onDelete('RESTRICT');
    // Pilar, Hooker, Segunda línea, Ala, Octavo, Medio scrum, Apertura, Centro, Wing, Fullback
    t.string('puesto', 30);

    t.index(['division_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('jugadores');
  await knex.schema.dropTable('usuarios');
  await knex.schema.dropTable('divisiones');
};
