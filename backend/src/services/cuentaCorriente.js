// Servicios de cuenta corriente que usan otros módulos (citaciones y webhook de Mercado Pago).
// Detalle de contratos y errores en docs/servicios-cuenta-corriente.md.
//
// PROVISORIO hasta el domingo 29/11: las firmas ya son las definitivas, pero el cuerpo
// devuelve datos fijos y no toca la base. Cuando se reemplace no cambia nada para quien lo usa.

const { HttpError } = require('../middlewares/errorHandler');

const ETIQUETAS = { AL_DIA: 'Al día', MOROSO: 'Moroso', EXCEPTUADO: 'Exceptuado' };
const METODOS = ['MERCADO_PAGO', 'EFECTIVO', 'TRANSFERENCIA'];
const ESTADOS_TRANSACCION = ['APROBADO', 'RECHAZADO', 'PENDIENTE'];

/**
 * Estado financiero de un socio para la interfaz y las citaciones.
 *
 * @param {number} socioId  id del jugador (es el mismo que su id de usuario)
 * @returns {Promise<{
 *   socioId: number,
 *   estado: 'AL_DIA' | 'MOROSO' | 'EXCEPTUADO',
 *   etiqueta: 'Al día' | 'Moroso' | 'Exceptuado',
 *   deuda: number,
 *   cuotasVencidas: number,
 *   excepcionVigente: null | {
 *     id: number,
 *     tipo: 'BECA' | 'RETRASO_CONTEMPLADO' | 'COLABORACION',
 *     fechaFin: string | null,
 *   },
 * }>}
 * @throws {HttpError} 404 si el socio no existe
 */
async function obtenerEstadoFinanciero(socioId) {
  const id = Number(socioId);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Socio no encontrado');

  // Datos fijos: múltiplos de 7 morosos, múltiplos de 11 exceptuados, el resto al día.
  let estado = 'AL_DIA';
  if (id % 7 === 0) estado = 'MOROSO';
  else if (id % 11 === 0) estado = 'EXCEPTUADO';

  return {
    socioId: id,
    estado,
    etiqueta: ETIQUETAS[estado],
    deuda: estado === 'AL_DIA' ? 0 : 15000,
    cuotasVencidas: estado === 'AL_DIA' ? 0 : 1,
    excepcionVigente: estado === 'EXCEPTUADO' ? { id: 1, tipo: 'BECA', fechaFin: null } : null,
  };
}

/**
 * Registra un pago sobre una cuota, en una transacción.
 * Si es APROBADO marca la cuota como PAGADA.
 * Es idempotente: si llega dos veces el mismo idTransaccionMp para la misma cuota,
 * no inserta nada y devuelve el pago existente con duplicado = true.
 *
 * @param {number} cuotaId
 * @param {{
 *   monto: number,
 *   metodoPago: 'MERCADO_PAGO' | 'EFECTIVO' | 'TRANSFERENCIA',
 *   estadoTransaccion: 'APROBADO' | 'RECHAZADO' | 'PENDIENTE',
 *   idTransaccionMp?: string,
 *   fecha?: string | Date,
 *   registradoPor?: number,
 * }} datosPago  idTransaccionMp es obligatorio si metodoPago es MERCADO_PAGO;
 *               registradoPor es el id del tesorero en los pagos manuales.
 * @returns {Promise<{
 *   pago: {
 *     id: number,
 *     cuotaId: number,
 *     monto: number,
 *     metodoPago: string,
 *     estadoTransaccion: string,
 *     idTransaccionMp: string | null,
 *     fecha: string,
 *   },
 *   cuota: { id: number, estado: 'PENDIENTE' | 'PAGADA' },
 *   duplicado: boolean,
 * }>}
 * @throws {HttpError} 400 datos inválidos · 404 cuota inexistente ·
 *                     409 la cuota ya tiene otro pago aprobado · 422 el monto no coincide
 */
async function registrarPago(cuotaId, datosPago = {}) {
  const id = Number(cuotaId);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Cuota no encontrada');

  const { monto, metodoPago, estadoTransaccion, idTransaccionMp = null, fecha } = datosPago;
  if (!(Number(monto) > 0)) throw new HttpError(400, 'El monto debe ser mayor a 0');
  if (!METODOS.includes(metodoPago)) throw new HttpError(400, 'Método de pago inválido');
  if (!ESTADOS_TRANSACCION.includes(estadoTransaccion)) {
    throw new HttpError(400, 'Estado de transacción inválido');
  }
  if (metodoPago === 'MERCADO_PAGO' && !idTransaccionMp) {
    throw new HttpError(400, 'Falta idTransaccionMp');
  }

  return {
    pago: {
      id: 1,
      cuotaId: id,
      monto: Number(monto),
      metodoPago,
      estadoTransaccion,
      idTransaccionMp,
      fecha: new Date(fecha || Date.now()).toISOString(),
    },
    cuota: { id, estado: estadoTransaccion === 'APROBADO' ? 'PAGADA' : 'PENDIENTE' },
    duplicado: false,
  };
}

module.exports = { obtenerEstadoFinanciero, registrarPago };
