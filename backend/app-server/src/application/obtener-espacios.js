class ObtenerEspacios {
  constructor(repositorioEspacios) {
    this.repositorio = repositorioEspacios;
  }

  async ejecutar(filtros) {
    return await this.repositorio.buscarPorFiltros(filtros);
  }
}

module.exports = ObtenerEspacios;
