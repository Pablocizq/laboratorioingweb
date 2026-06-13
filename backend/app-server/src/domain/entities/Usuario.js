/**
 * @entity Usuario
 * Representación de dominio de un usuario del sistema.
 */
class Usuario {
  constructor({ id, nombre, email, rol, esGerente, departamentoId }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.rol = rol;
    this.esGerente = Boolean(esGerente);
    this.departamentoId = departamentoId ?? null;
  }

  tieneRolOperativo() {
    return this.esGerente || this.rol != null;
  }
}

module.exports = Usuario;
