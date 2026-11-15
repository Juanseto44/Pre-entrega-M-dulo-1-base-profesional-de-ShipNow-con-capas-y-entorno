// Crea un error con código HTTP para que el middleware de errores
// sepa qué responder (400, 404, 409, etc.) en lugar de un 500
export const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
