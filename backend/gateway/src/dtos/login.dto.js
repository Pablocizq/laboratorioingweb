/**
 * Valida y normaliza el body del endpoint de login.
 *
 * Precondición:  body es el objeto recibido en req.body
 * Postcondición: devuelve { correo, clave } normalizados
 */

function validarLoginDto(body) {
  const { correo, clave } = body;

  if (!correo) throw new Error("El campo 'correo' es obligatorio.");
  if (typeof correo !== "string" || !correo.includes("@")) {
    throw new Error("El correo debe tener un formato válido (usuario@dominio).");
  }
  if (!clave) throw new Error("El campo 'clave' es obligatorio.");
  if (typeof clave !== "string" || clave.length < 1) {
    throw new Error("La clave proporcionada no es válida.");
  }

  return {
    correo: correo.trim().toLowerCase(),
    clave: clave.trim(),
  };
}

module.exports = { validarLoginDto };
