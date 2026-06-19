class IRepositorioReservas {
  async guardar(reserva) {
    throw new Error("ERR_NOT_IMPLEMENTED: guardar");
  }

  async buscarActivasPorEspacioYFecha(espacioId, fecha) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarActivasPorEspacioYFecha");
  }

  async buscarPorUsuario(usuarioId) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorUsuario");
  }

  async buscarPorId(id) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorId");
  }

  async buscarVivas() {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarVivas");
  }
}

module.exports = IRepositorioReservas;
