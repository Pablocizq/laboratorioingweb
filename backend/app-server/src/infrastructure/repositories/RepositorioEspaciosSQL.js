const { Op } = require("sequelize");
const IRepositorioEspacios = require("../../domain/repositories/IRepositorioEspacios");
const EspacioEntity = require("../../domain/entities/Espacio");

/**
 * Implementación concreta del repositorio usando Sequelize y PostgreSQL (Capa de Infraestructura).
 */
class RepositorioEspaciosSQL extends IRepositorioEspacios {
  constructor(modeloSequelize) {
    super();
    this.modeloDB = modeloSequelize;
  }

  async buscarPorFiltros(filtros) {
    const condiciones = {};

    if (filtros.identificador) {
      condiciones.idEspacio = { [Op.iLike]: `%${filtros.identificador}%` };
    }
    if (filtros.categoria) {
      condiciones.categoria = filtros.categoria;
    }
    if (filtros.planta !== undefined && filtros.planta !== null && filtros.planta !== "") {
      condiciones.planta = parseInt(filtros.planta, 10);
    }
    if (filtros.ocupantesMinimos) {
      condiciones.aforoMaximo = { [Op.gte]: parseInt(filtros.ocupantesMinimos, 10) };
    }

    const resultadosDB = await this.modeloDB.findAll({
      where: condiciones,
      order: [["idEspacio", "ASC"]]
    });

    // Mapeamos los modelos de base de datos a Entidades de Dominio puras
    // y luego a JSON plano para devolverlo, cumpliendo las capas.
    return resultadosDB.map(fila => {
      const entidad = new EspacioEntity(fila.toJSON());
      return { ...entidad }; // Serializamos la entidad
    });
  }
}

module.exports = RepositorioEspaciosSQL;
