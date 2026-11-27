const { z } = require('zod');
const { HttpError } = require('./errorHandler');

// Valida req.body con un esquema de zod y lo reemplaza por los datos ya normalizados.
const validate = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body ?? {});
  if (!resultado.success) {
    throw new HttpError(400, 'Datos inválidos', z.flattenError(resultado.error).fieldErrors);
  }
  req.body = resultado.data;
  next();
};

// Los formularios mandan '' cuando un campo opcional queda vacío.
const opcional = (schema) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

module.exports = { validate, opcional };
