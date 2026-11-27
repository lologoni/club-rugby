const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../db/knex');
const { HttpError } = require('../middlewares/errorHandler');
const { validate, opcional } = require('../middlewares/validate');
const { CAMPOS_PUBLICOS, firmarToken, requireAuth, requireRole } = require('../middlewares/auth');

const router = Router();

const email = z.string().trim().toLowerCase().pipe(z.email('Correo inválido'));
// bcrypt solo usa los primeros 72 bytes de la contraseña.
const passwordNueva = z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres');

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá la contraseña'),
});

const registroSchema = z
  .object({
    nombre: z.string().trim().min(1, 'Obligatorio').max(80),
    apellido: z.string().trim().min(1, 'Obligatorio').max(80),
    // Se aceptan puntos y espacios ("30.123.456") y se guarda sin ellos.
    dni: z
      .string()
      .transform((s) => s.replace(/[.\s]/g, ''))
      .pipe(z.string().regex(/^[A-Za-z0-9]{6,15}$/, 'DNI o pasaporte inválido')),
    email,
    telefono: opcional(z.string().trim().max(40)),
    fechaNacimiento: opcional(z.iso.date('Fecha inválida (AAAA-MM-DD)')),
    rol: z.enum(['TESORERO', 'ANALISTA', 'ENTRENADOR', 'JUGADOR'], 'Rol inválido'),
    divisionId: opcional(z.coerce.number().int().positive()),
    puesto: opcional(z.string().trim().max(30)),
  })
  .refine((d) => d.rol !== 'JUGADOR' || d.divisionId, {
    message: 'La división es obligatoria para jugadores',
    path: ['divisionId'],
  });

const passwordSchema = z.object({
  passwordActual: z.string().min(1, 'Ingresá la contraseña actual'),
  passwordNueva,
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const usuario = await db('usuarios').where({ email }).first();

  // password_hash puede ser null si la cuenta todavía no tiene contraseña.
  const valida = usuario?.password_hash && (await bcrypt.compare(password, usuario.password_hash));
  if (!valida) throw new HttpError(401, 'Correo o contraseña incorrectos');
  if (usuario.estado !== 'ACTIVO') throw new HttpError(403, 'Tu cuenta está dada de baja');

  const publico = Object.fromEntries(CAMPOS_PUBLICOS.map((c) => [c, usuario[c]]));
  res.json({ token: firmarToken(usuario), usuario: publico });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ usuario: req.usuario });
});

// Alta de un miembro desde "Crear Cuenta" (solo tesorería).
// La contraseña inicial es el DNI; la persona la cambia con PUT /password.
router.post(
  '/register',
  requireAuth,
  requireRole('TESORERO'),
  validate(registroSchema),
  async (req, res) => {
    const d = req.body;
    const passwordHash = await bcrypt.hash(d.dni, 10);

    try {
      const usuario = await db.transaction(async (trx) => {
        const [nuevo] = await trx('usuarios')
          .insert({
            nombre: d.nombre,
            apellido: d.apellido,
            dni: d.dni,
            email: d.email,
            telefono: d.telefono,
            fecha_nacimiento: d.fechaNacimiento,
            rol: d.rol,
            password_hash: passwordHash,
          })
          .returning(CAMPOS_PUBLICOS);

        if (d.rol === 'JUGADOR') {
          const division = await trx('divisiones').where({ id: d.divisionId }).first();
          if (!division) throw new HttpError(400, 'La división no existe');

          // max + 1 alcanza con un solo tesorero cargando; si dos altas coinciden, el unique
          // de nro_socio corta la segunda y no queda un número repetido.
          const { max } = await trx('jugadores').max('nro_socio as max').first();
          await trx('jugadores').insert({
            usuario_id: nuevo.id,
            division_id: d.divisionId,
            puesto: d.puesto,
            nro_socio: (max || 0) + 1,
          });
        }
        return nuevo;
      });

      res.status(201).json({ usuario });
    } catch (err) {
      if (err.code === '23505' && /dni|email/.test(err.constraint)) {
        const campo = err.constraint.includes('dni') ? 'DNI' : 'correo';
        throw new HttpError(409, `Ya existe un usuario con ese ${campo}`);
      }
      throw err;
    }
  },
);

router.put('/password', requireAuth, validate(passwordSchema), async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  const { password_hash: hashActual } = await db('usuarios')
    .select('password_hash')
    .where({ id: req.usuario.id })
    .first();

  // 400 y no 401: un 401 haría que el frontend cierre la sesión.
  if (!hashActual || !(await bcrypt.compare(passwordActual, hashActual))) {
    throw new HttpError(400, 'La contraseña actual no es correcta');
  }

  await db('usuarios')
    .where({ id: req.usuario.id })
    .update({ password_hash: await bcrypt.hash(passwordNueva, 10), updated_at: db.fn.now() });
  res.status(204).end();
});

module.exports = router;
