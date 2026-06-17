const bcrypt = require("bcryptjs");

/**
 * Caso de uso: Inicio de sesión.
 * Valida las credenciales del usuario contra la base de datos y,
 * si son correctas, devuelve los datos del usuario
 * para que el Gateway pueda firmar el JWT.
 */

class IniciarSesion {
  constructor(repositorioUsuarios) {
    this.repoUsuarios = repositorioUsuarios;
  }

  async ejecutar({ correo, clave }) {
    if (!correo || !clave) {
      const err = new Error("Correo y clave son campos obligatorios.");
      err.statusCode = 400;
      throw err;
    }

    const usuario = await this.repoUsuarios.buscarPorEmail(correo);
    if (!usuario) {
      const err = new Error("Credenciales incorrectas.");
      err.statusCode = 401;
      throw err;
    }

    const claveValida = await bcrypt.compare(clave, usuario.contrasenia);
    if (!claveValida) {
      const err = new Error("Credenciales incorrectas.");
      err.statusCode = 401;
      throw err;
    }

    return usuario.serializar();
  }
}

module.exports = IniciarSesion;
