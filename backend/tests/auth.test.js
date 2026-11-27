const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/db/knex');

// Todo lo que crea este archivo usa este dominio para poder limpiarlo.
const DOMINIO = '@test-auth.local';
const DIVISION = 'TEST-AUTH';

async function limpiar() {
  const ids = db('usuarios').select('id').whereLike('email', `%${DOMINIO}`);
  await db('jugadores').whereIn('usuario_id', ids).del();
  await db('usuarios').whereLike('email', `%${DOMINIO}`).del();
  await db('divisiones').where({ nombre: DIVISION }).del();
}

async function crearUsuario(datos) {
  const [u] = await db('usuarios')
    .insert({ password_hash: await bcrypt.hash('clave-segura', 10), ...datos })
    .returning('*');
  return u;
}

const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

let divisionId;
let tokenTesorero;

beforeAll(async () => {
  await limpiar();
  [{ id: divisionId }] = await db('divisiones').insert({ nombre: DIVISION }).returning('id');
  await crearUsuario({
    nombre: 'Tesorera',
    apellido: 'Prueba',
    dni: 'TA0000001',
    email: `tesorera${DOMINIO}`,
    rol: 'TESORERO',
  });
  await crearUsuario({
    nombre: 'Baja',
    apellido: 'Prueba',
    dni: 'TA0000002',
    email: `baja${DOMINIO}`,
    rol: 'ENTRENADOR',
    estado: 'INACTIVO',
  });
  tokenTesorero = (await login(`tesorera${DOMINIO}`, 'clave-segura')).body.token;
});

afterAll(async () => {
  await limpiar();
  await db.destroy();
});

describe('POST /api/auth/login', () => {
  test('devuelve token y usuario sin el hash; el correo no distingue mayúsculas', async () => {
    const res = await login(`  TESORERA${DOMINIO}`, 'clave-segura');
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toMatchObject({ email: `tesorera${DOMINIO}`, rol: 'TESORERO' });
    expect(res.body.usuario).not.toHaveProperty('password_hash');
  });

  test('contraseña incorrecta o correo inexistente: 401 con el mismo mensaje', async () => {
    const malaClave = await login(`tesorera${DOMINIO}`, 'otra');
    const noExiste = await login(`nadie${DOMINIO}`, 'clave-segura');
    expect(malaClave.status).toBe(401);
    expect(noExiste.status).toBe(401);
    expect(malaClave.body.error).toBe(noExiste.body.error);
  });

  test('usuario dado de baja: 403', async () => {
    const res = await login(`baja${DOMINIO}`, 'clave-segura');
    expect(res.status).toBe(403);
  });

  test('datos faltantes: 400 con el detalle por campo', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'no-es-correo' });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty('email');
    expect(res.body.details).toHaveProperty('password');
  });
});

describe('GET /api/auth/me', () => {
  test('sin token: 401', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  test('token inválido: 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer xxx');
    expect(res.status).toBe(401);
  });

  test('con token: devuelve el usuario', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenTesorero}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('TESORERO');
  });
});

describe('alta, roles y cambio de contraseña', () => {
  const jugador = {
    nombre: 'Tomás',
    apellido: 'Rivero',
    dni: '40.111.222',
    email: `Tomas.Rivero${DOMINIO}`,
    fechaNacimiento: '2005-03-14',
    telefono: '',
    rol: 'JUGADOR',
    puesto: 'Pilar',
  };
  let tokenJugador;

  const registrar = (body, token = tokenTesorero) =>
    request(app).post('/api/auth/register').set('Authorization', `Bearer ${token}`).send(body);

  test('jugador sin división: 400', async () => {
    const res = await registrar(jugador);
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty('divisionId');
  });

  test('el tesorero da de alta un jugador con número de socio', async () => {
    const res = await registrar({ ...jugador, divisionId: String(divisionId) });
    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({ dni: '40111222', email: `tomas.rivero${DOMINIO}` });

    const fila = await db('jugadores').where({ usuario_id: res.body.usuario.id }).first();
    expect(fila).toMatchObject({ division_id: divisionId, puesto: 'Pilar' });
    expect(fila.nro_socio).toBeGreaterThan(0);
  });

  test('DNI o correo repetidos: 409', async () => {
    const res = await registrar({ ...jugador, divisionId, email: `otro${DOMINIO}` });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/DNI/);
  });

  test('el jugador entra con su DNI como contraseña inicial', async () => {
    const res = await login(`tomas.rivero${DOMINIO}`, '40111222');
    expect(res.status).toBe(200);
    tokenJugador = res.body.token;
  });

  test('un jugador no puede dar de alta: 403', async () => {
    const res = await registrar({ ...jugador, divisionId, dni: '99999999' }, tokenJugador);
    expect(res.status).toBe(403);
  });

  test('cambio de contraseña', async () => {
    const cambiar = (body) =>
      request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${tokenJugador}`)
        .send(body);

    expect((await cambiar({ passwordActual: 'mal', passwordNueva: 'nueva-clave' })).status).toBe(
      400,
    );
    expect((await cambiar({ passwordActual: '40111222', passwordNueva: 'corta' })).status).toBe(
      400,
    );
    expect(
      (await cambiar({ passwordActual: '40111222', passwordNueva: 'nueva-clave' })).status,
    ).toBe(204);

    expect((await login(`tomas.rivero${DOMINIO}`, '40111222')).status).toBe(401);
    expect((await login(`tomas.rivero${DOMINIO}`, 'nueva-clave')).status).toBe(200);
  });

  test('si lo dan de baja, su token deja de servir', async () => {
    await db('usuarios')
      .where({ email: `tomas.rivero${DOMINIO}` })
      .update({ estado: 'INACTIVO' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenJugador}`);
    expect(res.status).toBe(401);
  });
});
