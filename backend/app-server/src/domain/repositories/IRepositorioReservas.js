class IRepositorioReservas {
  async guardar(reserva) {
    throw new Error("ERR_NOT_IMPLEMENTED: guardar");
  }

  async buscarActivasPorEspacioYFecha(espacioId, fecha) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarActivasPorEspacioYFecha");
  }
}

module.exports = IRepositorioReservas;
