/**
 * @entity Usuario
 * Representación de dominio de un usuario del sistema.
 */

class Usuario {
  constructor({ id, nombre, email, contrasenia, rol, esGerente, departamentoId }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.contrasenia = contrasenia ?? null;
    this.rol = rol;
    this.esGerente = Boolean(esGerente);
    this.departamentoId = departamentoId ?? null;
  }

  tieneRolOperativo() {
    return this.esGerente || this.rol != null;
  }

  // Devuelve los datos del usuario para enviar al Gateway
  serializar() {
    return {
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      rol: this.rol,
      esGerente: this.esGerente,
      departamentoId: this.departamentoId,
    };
  }
}

module.exports = Usuario;
