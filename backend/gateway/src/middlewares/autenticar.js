const { verificarToken } = require("../services/token.service");

/**
 * Middleware de autenticación JWT.
 * Extrae el token del header Authorization, lo verifica y adjunta
 * el payload decodificado a req.sesion para uso en controladores.
 *
 * Precondición:  header Authorization 
 * Postcondición: req.sesion contiene el usuario autenticado
 */

function autenticar(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Acceso denegado: token no proporcionado." });
    }

    const token = authHeader.slice(7);
    req.sesion = verificarToken(token);
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

module.exports = autenticar;
