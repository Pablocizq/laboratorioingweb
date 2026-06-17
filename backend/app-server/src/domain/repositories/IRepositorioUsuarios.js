class IRepositorioUsuarios {
  async buscarPorId(id) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorId");
  }

  async buscarPorNombre(nombre) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorNombre");
  }

  async buscarPorEmail(email) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorEmail");
  }
}

module.exports = IRepositorioUsuarios;
