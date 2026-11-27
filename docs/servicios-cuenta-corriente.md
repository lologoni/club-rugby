# Servicios de cuenta corriente

Funciones que expone el módulo de cuenta corriente para el resto del backend. Se importan desde `backend/src/services/cuentaCorriente.js`:

```js
const { obtenerEstadoFinanciero, registrarPago } = require('../services/cuentaCorriente');
```

Hasta el domingo 29/11 devuelven datos fijos (ver abajo). Las firmas no cambian cuando pasen a usar la base.

## `obtenerEstadoFinanciero(socioId)`

Lo usan el motor de citaciones (`validarElegibilidad`) y la pantalla Cuenta y Pagos.

`socioId` es el id del jugador, que es el mismo que su id en `usuarios`.

Devuelve:

```js
{
  socioId: 12,
  estado: 'MOROSO',          // 'AL_DIA' | 'MOROSO' | 'EXCEPTUADO'
  etiqueta: 'Moroso',        // 'Al día' | 'Moroso' | 'Exceptuado', para el StatusBadge
  deuda: 15000,              // suma de cuotas vencidas impagas
  cuotasVencidas: 1,
  excepcionVigente: null     // o { id, tipo: 'BECA' | 'RETRASO_CONTEMPLADO' | 'COLABORACION', fechaFin }
}
```

Reglas:

- **AL_DIA**: no tiene cuotas vencidas impagas.
- **EXCEPTUADO**: tiene cuotas vencidas impagas y una excepción vigente (beca, retraso contemplado o colaboración).
- **MOROSO**: tiene cuotas vencidas impagas y ninguna excepción vigente.

Para citaciones: se puede citar si `estado !== 'MOROSO'`.

Errores: `404` si el socio no existe.

Para listados (por ejemplo, el filtro por estado del Padrón) conviene leer la vista `v_estado_financiero` en vez de llamar a la función por cada socio. Tiene las columnas `jugador_id`, `deuda`, `cuotas_vencidas`, `excepcion_id`, `excepcion_tipo`, `excepcion_fecha_fin` y `estado`.

## `registrarPago(cuotaId, datosPago)`

Lo usa el webhook de Mercado Pago. También sirve para pagos manuales del tesorero.

```js
await registrarPago(cuotaId, {
  monto: 15000,
  metodoPago: 'MERCADO_PAGO', // 'MERCADO_PAGO' | 'EFECTIVO' | 'TRANSFERENCIA'
  estadoTransaccion: 'APROBADO', // 'APROBADO' | 'RECHAZADO' | 'PENDIENTE'
  idTransaccionMp: '1300000123', // obligatorio con MERCADO_PAGO
  fecha: '2026-11-29T18:00:00-03:00', // opcional, por defecto ahora
  registradoPor: 1, // opcional, id del tesorero en pagos manuales
});
```

Devuelve:

```js
{
  pago: { id, cuotaId, monto, metodoPago, estadoTransaccion, idTransaccionMp, fecha },
  cuota: { id, estado: 'PAGADA' },  // 'PENDIENTE' si el pago no fue aprobado
  duplicado: false
}
```

Comportamiento:

- Corre en una transacción: el pago y el cambio de la cuota a `PAGADA` se guardan juntos o no se guarda nada.
- Es **idempotente**: si Mercado Pago reenvía la notificación con el mismo `idTransaccionMp` para la misma cuota, no se inserta otro pago y se devuelve el existente con `duplicado: true`. El webhook tiene que responder 200 igual.
- Un pago `RECHAZADO` o `PENDIENTE` queda registrado en el historial y la cuota sigue `PENDIENTE`.
- Como el estado del socio se calcula a partir de las cuotas, al aprobarse el pago pasa a "Al día" solo, sin intervención del tesorero (RF-03).

Errores (`HttpError`, los maneja el `errorHandler`):

| Código | Cuándo                                                                       |
| ------ | ---------------------------------------------------------------------------- |
| 400    | Monto, método o estado inválidos, o falta `idTransaccionMp` con Mercado Pago |
| 404    | La cuota no existe                                                           |
| 409    | La cuota ya tiene otro pago aprobado                                         |
| 422    | El monto no coincide con el de la cuota                                      |

## Datos fijos hasta el domingo 29/11

- `obtenerEstadoFinanciero`: los ids múltiplos de 7 son `MOROSO`, los múltiplos de 11 son `EXCEPTUADO` (con una beca) y el resto `AL_DIA`.
- `registrarPago`: valida los datos y devuelve la respuesta armada, pero no escribe en la base.
