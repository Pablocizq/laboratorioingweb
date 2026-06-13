/**
 * @repository IRepositorioEspacios
 * Interfaz abstracta del repositorio de Espacios (Capa de Dominio).
 * Define el contrato que debe cumplir la capa de infraestructura.
 */
class IRepositorioEspacios {
  async buscarPorFiltros(filtros) {
    throw new Error("ERR_NOT_IMPLEMENTED: buscarPorFiltros");
  }
}

module.exports = IRepositorioEspacios;
