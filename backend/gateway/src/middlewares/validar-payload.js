function validarPayload(validador) {
  return (req, res, next) => {
    try {
      req.datosValidados = validador(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ error: error.message || "Datos de entrada no válidos" });
    }
  };
}

module.exports = validarPayload;
