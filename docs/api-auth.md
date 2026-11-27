# API de autenticación

Base: `http://localhost:3000/api/auth`. Todas las respuestas son JSON; los errores tienen la forma `{ "error": "mensaje" }` y, si son de validación (400), además `details` con los mensajes por campo:

```json
{ "error": "Datos inválidos", "details": { "email": ["Correo inválido"] } }
```

## Cómo mandar el token

Después del login, todas las rutas protegidas llevan el header:

```
Authorization: Bearer <token>
```

El token dura 8 h (`JWT_EXPIRES_IN`). Cualquier **401** significa "sesión inválida": el frontend tiene que borrar el token y mandar al login. Un **403** significa "estás logueado pero tu rol no puede hacer esto".

## Cuentas de prueba (seeds)

Contraseña de todas: `club1234`.

| Rol        | Correo                                                        |
| ---------- | ------------------------------------------------------------- |
| TESORERO   | `tesorero@club.test`                                          |
| ANALISTA   | `analista@club.test`                                          |
| ENTRENADOR | `entrenador@club.test`, `entrenador2@club.test`               |
| JUGADOR    | `nombre.apellido@club.test` (ej. `tomas.rodriguez@club.test`) |

## Endpoints

### `POST /login`

Pantalla "Bienvenido de nuevo".

```json
{ "email": "tesorero@club.test", "password": "club1234" }
```

**200**

```json
{
  "token": "eyJhbGciOi...",
  "usuario": {
    "id": 1,
    "nombre": "Carlos",
    "apellido": "Vidal",
    "email": "tesorero@club.test",
    "dni": "34543210",
    "rol": "TESORERO"
  }
}
```

| Código | Cuándo                                                                          |
| ------ | ------------------------------------------------------------------------------- |
| 400    | Falta el correo o la contraseña, o el correo no tiene formato válido            |
| 401    | "Correo o contraseña incorrectos" (mismo mensaje en los dos casos, a propósito) |
| 403    | "Tu cuenta está dada de baja"                                                   |

El correo no distingue mayúsculas ni espacios.

### `GET /me` (requiere token)

Devuelve el usuario del token. Sirve para restaurar la sesión al recargar la página.

**200** `{ "usuario": { "id", "nombre", "apellido", "email", "dni", "rol" } }`

**401** si no hay token, venció o el usuario fue dado de baja después de loguearse.

### `POST /register` (requiere token de TESORERO)

Pantalla "Crear Cuenta".

```json
{
  "nombre": "Tomás",
  "apellido": "Rivero",
  "dni": "40.111.222",
  "email": "tomas.rivero@club.test",
  "telefono": "221 555-1234",
  "fechaNacimiento": "2005-03-14",
  "rol": "JUGADOR",
  "divisionId": 4,
  "puesto": "Pilar"
}
```

| Campo             | Obligatorio       | Notas                                                                  |
| ----------------- | ----------------- | ---------------------------------------------------------------------- |
| `nombre`          | sí                | El wireframe tiene "Nombre y Apellido" en un solo campo: van separados |
| `apellido`        | sí                |                                                                        |
| `dni`             | sí                | DNI o pasaporte, 6 a 15 letras/números; los puntos se ignoran          |
| `email`           | sí                |                                                                        |
| `telefono`        | no                | Teléfono o contacto de emergencia                                      |
| `fechaNacimiento` | no                | `AAAA-MM-DD` (lo que devuelve un `<input type="date">`)                |
| `rol`             | sí                | `TESORERO`, `ANALISTA`, `ENTRENADOR` o `JUGADOR`                       |
| `divisionId`      | solo para JUGADOR | Id de la división                                                      |
| `puesto`          | no                | Solo se guarda para JUGADOR                                            |

Los campos opcionales pueden venir vacíos (`""`) o no venir.

**La contraseña inicial es el DNI sin puntos** (en el ejemplo, `40111222`). Conviene que la pantalla lo avise después de guardar. El switch "Enviar correo con enlace para crear contraseña" por ahora no hace nada.

**201** `{ "usuario": { "id", "nombre", "apellido", "email", "dni", "rol" } }`. Si es jugador, además queda creado su número de socio.

| Código | Cuándo                                                   |
| ------ | -------------------------------------------------------- |
| 400    | Datos inválidos (ver `details`) o la división no existe  |
| 403    | El usuario logueado no es tesorero                       |
| 409    | "Ya existe un usuario con ese DNI" / "...con ese correo" |

Ids de división de los seeds: 1 = M15, 2 = M17, 3 = M19, 4 = Plantel Superior. Hasta que esté el endpoint de divisiones del ABM, se pueden dejar fijas en el select.

### `PUT /password` (requiere token)

Cambio de contraseña del usuario logueado (por ejemplo, después de entrar con el DNI).

```json
{ "passwordActual": "40111222", "passwordNueva": "mi-clave-nueva" }
```

**204** sin cuerpo.

**400** si la contraseña actual no coincide o la nueva tiene menos de 8 caracteres. Es 400 y no 401 para que el frontend no cierre la sesión.

## En el backend: proteger rutas

```js
const { requireAuth, requireRole } = require('../middlewares/auth');

router.get('/', requireAuth, requireRole('TESORERO', 'ENTRENADOR'), async (req, res) => {
  // req.usuario = { id, nombre, apellido, email, dni, rol }
});
```

`requireAuth` vuelve a buscar el usuario en la base en cada request, así que una baja corta el acceso en el momento aunque el token no haya vencido.

Para validar el body está `validate(schema)` en `middlewares/validate.js` (con zod); devuelve el 400 con `details` de arriba.
