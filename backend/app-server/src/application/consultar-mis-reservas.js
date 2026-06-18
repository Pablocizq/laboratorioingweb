/**
 * Caso de uso: Consulta de reservas del usuario autenticado.
 * Devuelve todas las reservas del usuario ordenadas por fecha.
 */

class ConsultarMisReservas {
  constructor(repositorioReservas) {
    this.repoReservas = repositorioReservas;
  }

  async ejecutar({ usuarioId }) {
    if (!usuarioId) {
      const err = new Error("Petición sin identificador de usuario.");
      err.statusCode = 401;
      throw err;
    }

    const reservas = await this.repoReservas.buscarPorUsuario(usuarioId);

    return reservas.map((r) => ({
      id: r.id,
      espacioIds: r.espacioIds,
      fecha: r.fecha,
      horaInicio: r.horaInicio,
      horaFin: r.horaFin,
      duracionMins: r.duracionMinutos,
      tipoUso: r.tipoUso,
      detalles: r.detalles,
      estado: r.estado,
    }));
  }
}

module.exports = ConsultarMisReservas;
