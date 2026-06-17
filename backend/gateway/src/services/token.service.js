const jwt = require("jsonwebtoken");
const { secreto, expiracion } = require("../config/jwt.config");

/**
 * Firma un JWT con los datos del usuario.
 * Solo incluye los campos que el Gateway necesita para tomar decisiones
 * de autorización; no0 incluye la contraseña.
 *
 * @param {object} usuario - datos serializados del usuario (sin contraseña)
 * @returns {string} token JWT firmado
 */

function generarToken(usuario) {
  const payload = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    esGerente: usuario.esGerente ?? false,
    departamentoId: usuario.departamentoId ?? null,
  };
  return jwt.sign(payload, secreto, { expiresIn: expiracion });
}

/**
 * Verifica y decodifica un JWT.
 * Lanza excepción si el token ha expirado, está manipulado o es inválido.
 *
 * @param {string} token - token JWT a verificar
 * @returns {object} payload decodificado
 */
function verificarToken(token) {
  return jwt.verify(token, secreto);
}

module.exports = { generarToken, verificarToken };
