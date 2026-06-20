/**
 * @repository IRepositorioEspacios
 * Interfaz abstracta del repositorio de Espacios.
 * Define el contrato que debe cumplir la capa de infraestructura.
 */
class IRepositorioEspacios {

  async buscarPorFiltros(filtros) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorFiltros");
  }

  async buscarPorId(id) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorId");
  }

  async updateCategoria(id, categoria) {
    throw new Error("ERR_NOT_IMPLEMENTED: updateCategoria");
  }

  async updateReservable(id, reservable) {
    throw new Error("ERR_NOT_IMPLEMENTED: updateReservable");
  }

  async updatePorcentaje(id, porcentaje) {
    throw new Error("ERR_NOT_IMPLEMENTED: updatePorcentaje");
  }

  async updateAsignacion(id, { departamentoId, asignadoAEina, usuariosAsignados }) {
    throw new Error("ERR_NOT_IMPLEMENTED: updateAsignacion");
  }
}

module.exports = IRepositorioEspacios;
