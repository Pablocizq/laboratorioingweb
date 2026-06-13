class IRepositorioUsuarios {
  async buscarPorId(id) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorId");
  }

  async buscarPorNombre(nombre) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorNombre");
  }
}

module.exports = IRepositorioUsuarios;
