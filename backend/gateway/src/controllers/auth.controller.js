const { enviarPeticionRPC } = require("../messaging/rpc-client");
const { generarToken } = require("../services/token.service");
const { validarLoginDto } = require("../dtos/login.dto");

/**
 * POST /api/auth/login
 * Valida las credenciales en el App-Server vía RPC y, si son correctas,
 * firma un JWT con los datos del usuario y lo devuelve al cliente.
 *
 * Precondición:  body contiene { correo, clave }
 * Postcondición: devuelve { token, usuario } con el JWT firmado
 */

async function login(req, res) {
  try {
    // Validar y normalizar el body antes de enviarlo al App-Server
    let credenciales;
    try {
      credenciales = validarLoginDto(req.body);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const colaPeticiones = process.env.REQUEST_QUEUE || "reservas.requests";
    const respuesta = await enviarPeticionRPC(colaPeticiones, {
      operacion: "INICIAR_SESION",
      datos: credenciales,
    });

    if (!respuesta.exito) {
      return res.status(respuesta.codigoEstado || 401).json({ error: respuesta.mensajeError });
    }

    const usuario = respuesta.contenido;
    const token = generarToken(usuario);

    return res.status(200).json({ token, usuario });
  } catch (error) {
    console.error("[Gateway Auth Error]", error);
    return res.status(500).json({ error: "Error interno al procesar el login." });
  }
}

module.exports = { login };
