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
}

module.exports = IRepositorioEspacios;
