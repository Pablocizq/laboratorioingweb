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
    let modelo;
    if (reserva.id) {
      modelo = await this.modeloReserva.findByPk(reserva.id);
      if (modelo) {
        await modelo.update({
          usuarioId: reserva.usuarioId,
          fecha: reserva.fecha,
          horaInicio: reserva.horaInicio,
          duracion: reserva.duracionMinutos,
          tipoUso: reserva.tipoUso,
          numPersonas: reserva.asistentes,
          descripcion: reserva.detalles,
          estado: reserva.estado,
        });
      }
    }

    if (!modelo) {
      modelo = await this.modeloReserva.create({
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
    }

    return this._aEntidad(modelo, reserva.espacioIds);
  }

  async buscarPorId(id) {
    const modelo = await this.modeloReserva.findByPk(id);
    if (!modelo) return null;

    const enlaces = await this.modeloReservaEspacio.findAll({
      where: { reservaId: id },
    });
    const ids = enlaces.map((e) => e.espacioId);

    return this._aEntidad(modelo, ids);
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

  async buscarVivas() {
    const ahora = new Date();
    const fechaHoy = ahora.toISOString().split("T")[0];

    const modelos = await this.modeloReserva.findAll({
      where: {
        estado: "aceptada",
        // Solo fechas de hoy en adelant
        fecha: { [Op.gte]: fechaHoy },
      },
      order: [["fecha", "ASC"], ["horaInicio", "ASC"]],
    });

    if (!modelos.length) return [];

    const idsReserva = modelos.map((m) => m.id);
    const enlaces = await this.modeloReservaEspacio.findAll({
      where: { reservaId: idsReserva },
    });

    const horaAhora = ahora.toTimeString().slice(0, 5);

    // Si es hoy quitamos las que ya han terminado
    const entidades = modelos.map((m) => {
      const ids = enlaces
        .filter((e) => e.reservaId === m.id)
        .map((e) => e.espacioId);
      return this._aEntidad(m, ids);
    });

    return entidades.filter((r) => {
      if (r.fecha > fechaHoy) return true;
      return r.horaFin > horaAhora;
    });
  }
}

module.exports = RepositorioReservasSQL;
