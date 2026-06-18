const { Op } = require("sequelize");
const IRepositorioReservas = require("../../domain/repositories/IRepositorioReservas");
const ReservaEntity = require("../../domain/entities/Reserva");

class RepositorioReservasSQL extends IRepositorioReservas {
  constructor(modeloReserva, modeloReservaEspacio) {
    super();
    this.modeloReserva = modeloReserva;
    this.modeloReservaEspacio = modeloReservaEspacio;
  }

  _aEntidad(modelo, espacioIds) {
    if (!modelo) return null;
    const datos = modelo.toJSON ? modelo.toJSON() : modelo;
    return new ReservaEntity({
      id: datos.id,
      espacioIds,
      usuarioId: datos.usuarioId,
      fecha: datos.fecha,
      horaInicio: String(datos.horaInicio).slice(0, 5),
      duracionMinutos: datos.duracion,
      tipoUso: datos.tipoUso,
      asistentes: datos.numPersonas,
      detalles: datos.descripcion,
      estado: datos.estado,
    });
  }

  async guardar(reserva) {
    const modelo = await this.modeloReserva.create({
      usuarioId: reserva.usuarioId,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      duracion: reserva.duracionMinutos,
      tipoUso: reserva.tipoUso,
      numPersonas: reserva.asistentes,
      descripcion: reserva.detalles,
      estado: reserva.estado,
    });

    await Promise.all(
      reserva.espacioIds.map((espacioId) =>
        this.modeloReservaEspacio.create({
          reservaId: modelo.id,
          espacioId,
        })
      )
    );

    return this._aEntidad(modelo, reserva.espacioIds);
  }

  async buscarActivasPorEspacioYFecha(espacioId, fecha) {
    const enlaces = await this.modeloReservaEspacio.findAll({
      where: { espacioId },
    });
    const idsReserva = enlaces.map((e) => e.reservaId);
    if (!idsReserva.length) return [];

    const modelos = await this.modeloReserva.findAll({
      where: {
        id: { [Op.in]: idsReserva },
        fecha,
        estado: { [Op.ne]: "cancelada" },
      },
    });

    return modelos.map((m) => {
      const ids = enlaces
        .filter((e) => e.reservaId === m.id)
        .map((e) => e.espacioId);
      return this._aEntidad(m, ids);
    });
  }

  async buscarPorUsuario(usuarioId) {
    const modelos = await this.modeloReserva.findAll({
      where: { usuarioId },
      order: [["fecha", "DESC"], ["horaInicio", "DESC"]],
    });

    if (!modelos.length) return [];

    const idsReserva = modelos.map((m) => m.id);
    const enlaces = await this.modeloReservaEspacio.findAll({
      where: { reservaId: idsReserva },
    });

    return modelos.map((m) => {
      const ids = enlaces
        .filter((e) => e.reservaId === m.id)
        .map((e) => e.espacioId);
      return this._aEntidad(m, ids);
    });
  }
}

module.exports = RepositorioReservasSQL;
