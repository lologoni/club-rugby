const jwt = require('jsonwebtoken');
const db = require('../db/knex');
const { HttpError } = require('./errorHandler');

// Datos del usuario que se pueden devolver al frontend (nunca password_hash).
const CAMPOS_PUBLICOS = ['id', 'nombre', 'apellido', 'email', 'dni', 'rol'];

function secreto() {
  if (!process.env.JWT_SECRET) throw new Error('Falta JWT_SECRET en el .env');
  return process.env.JWT_SECRET;
}

function firmarToken(usuario) {
  return jwt.sign({ sub: String(usuario.id), rol: usuario.rol }, secreto(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// Se consulta el usuario en cada request para que una baja corte el acceso
// aunque el token todavía no haya vencido.
async function requireAuth(req, res, next) {
  const [tipo, token] = (req.get('Authorization') || '').split(' ');
  if (tipo !== 'Bearer' || !token) throw new HttpError(401, 'Falta el token de acceso');

  let payload;
  try {
    payload = jwt.verify(token, secreto());
  } catch {
    throw new HttpError(401, 'El token es inválido o venció');
  }

  const usuario = await db('usuarios')
    .select(CAMPOS_PUBLICOS)
    .where({ id: payload.sub, estado: 'ACTIVO' })
    .first();
  if (!usuario) throw new HttpError(401, 'El usuario no existe o está dado de baja');

  req.usuario = usuario;
  next();
}

// Va siempre después de requireAuth: router.get('/', requireAuth, requireRole('TESORERO'), ...)
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      throw new HttpError(403, 'No tenés permiso para esta acción');
    }
    next();
  };

module.exports = { CAMPOS_PUBLICOS, firmarToken, requireAuth, requireRole };
