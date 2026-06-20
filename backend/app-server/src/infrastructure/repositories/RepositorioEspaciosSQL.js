const { Op } = require("sequelize");
const IRepositorioEspacios = require("../../domain/repositories/IRepositorioEspacios");
const Espacio = require("../../domain/entities/Espacio");

// Mapeamos una fila de BD a un objeto de dominio, incluyendo usuarios asignados
function filaAEntidad(fila) {
  const datos = fila.toJSON();
  const asignados = (fila.usuariosAsignados || []).map(u => ({
    id: u.id,
    rol: u.rol,
    departamentoId: u.departamentoId,
  }));
  return new Espacio({ ...datos, usuariosAsignados: asignados });
}

class RepositorioEspaciosSQL extends IRepositorioEspacios {
  constructor(modeloEspacio, modeloRelacion, modeloUsuario) {
    super();
    this.modeloEspacio = modeloEspacio;
    this.modeloRelacion = modeloRelacion;
    this.modeloUsuario = modeloUsuario;
  }

  async buscarPorFiltros(filtros) {
    const where = {};

    if (filtros.identificador) {
      where.idEspacio = { [Op.iLike]: `%${filtros.identificador}%` };
    }
    if (filtros.categoria) {
      where.categoria = filtros.categoria;
    }
    if (filtros.planta !== undefined && filtros.planta !== null && filtros.planta !== "") {
      where.planta = parseInt(filtros.planta, 10);
    }
    if (filtros.ocupantesMinimos) {
      where.aforoMaximo = { [Op.gte]: parseInt(filtros.ocupantesMinimos, 10) };
    }

    const filas = await this.modeloEspacio.findAll({
      where,
      include: [{
        model: this.modeloUsuario,
        as: "usuariosAsignados",
        attributes: ["id", "rol", "departamentoId"],
      }],
      order: [["idEspacio", "ASC"]],
    });

    return filas.map(filaAEntidad);
  }

  async buscarPorId(gid) {
    const fila = await this.modeloEspacio.findByPk(gid, {
      include: [{
        model: this.modeloUsuario,
        as: "usuariosAsignados",
        attributes: ["id", "rol", "departamentoId"],
      }],
    });
    if (!fila) return null;
    return filaAEntidad(fila);
  }

  // Actualizamos solo la categoría y recargamos la entidad actualizada
  async cambiarCategoria(gid, nuevaCategoria) {
    const reg = await this.modeloEspacio.findByPk(gid);
    if (!reg) return null;
    reg.categoria = nuevaCategoria;
    await reg.save();
    return this.buscarPorId(gid);
  }

  // Actualizamos solo el flag reservable
  async cambiarReservable(gid, estado) {
    const reg = await this.modeloEspacio.findByPk(gid);
    if (!reg) return null;
    reg.reservable = estado;
    await reg.save();
    return this.buscarPorId(gid);
  }

  // Actualizamos solo el porcentaje de ocupación
  async cambiarPorcentaje(gid, porcentaje) {
    const reg = await this.modeloEspacio.findByPk(gid);
    if (!reg) return null;
    reg.porcentajeOcupacion = porcentaje;
    await reg.save();
    return this.buscarPorId(gid);
  }

  // Reemplazamos completamente la asignación del espacio
  async actualizarAsignacion(gid, { departamentoId, asignadoAEina, usuariosAsignados }) {
    const reg = await this.modeloEspacio.findByPk(gid);
    if (!reg) return null;

    reg.departamentoId = departamentoId ?? null;
    reg.asignadoAEina = asignadoAEina ?? false;
    await reg.save();

    // Borramos las relaciones previas y creamos las nuevas
    await this.modeloRelacion.destroy({ where: { espacioId: gid } });
    if (usuariosAsignados && usuariosAsignados.length > 0) {
      await Promise.all(
        usuariosAsignados.map(uid =>
          this.modeloRelacion.create({ usuarioId: uid, espacioId: gid })
        )
      );
    }

    return this.buscarPorId(gid);
  }
}

module.exports = RepositorioEspaciosSQL;
