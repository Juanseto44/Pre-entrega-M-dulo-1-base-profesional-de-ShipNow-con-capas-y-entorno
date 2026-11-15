// Se ejecuta cuando ninguna ruta coincide con la petición
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Ruta no encontrada"
  });
};

// Captura cualquier error que llegue con next(error)
// Tiene 4 parámetros: así Express lo reconoce como manejador de errores
export const errorHandler = (error, req, res, next) => {
  // JSON mal formado en el body
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      status: "error",
      message: "El body no es un JSON válido"
    });
  }

  const statusCode = error.statusCode || 500;

  // Solo los errores inesperados se imprimen completos en la consola
  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    status: "error",
    message: statusCode === 500 ? "Error interno del servidor" : error.message
  });
};
