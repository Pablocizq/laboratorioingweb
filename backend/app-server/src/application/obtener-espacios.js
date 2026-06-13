class ObtenerEspacios {
  constructor(repositorioEspacios) {
    this.repositorio = repositorioEspacios;
  }

  async ejecutar(filtros) {
    // La capa de aplicación ya no sabe nada de Sequelize ni bases de datos.
    // Solo delega en la abstracción del Repositorio (Capa de Dominio).
    return await this.repositorio.buscarPorFiltros(filtros);
  }
}

module.exports = ObtenerEspacios;
