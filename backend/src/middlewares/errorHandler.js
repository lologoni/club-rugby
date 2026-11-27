// Para cortar un request con un código propio: throw new HttpError(404, 'Socio no encontrado')
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);

  const body = {
    error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Error interno' : err.message,
  };
  if (err.details) body.details = err.details;

  res.status(status).json(body);
}

module.exports = { HttpError, notFound, errorHandler };
