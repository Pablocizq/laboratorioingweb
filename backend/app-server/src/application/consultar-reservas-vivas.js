/**
 * Caso de uso: Consultar reservas vivas
 * Sólo gerentes.
 */

class ConsultarReservasVivas {
  constructor(repositorioReservas, repositorioUsuarios) {
    this.repoReservas = repositorioReservas;
    this.repoUsuarios = repositorioUsuarios;
  }

  async ejecutar({ esGerente }) {
    if (!esGerente) {
      const err = new Error("Solo los gerentes pueden consultar todas las reservas activas.");
      err.statusCode = 403;
      throw err;
    }

    const reservas = await this.repoReservas.buscarVivas();
    const hoy = new Date();
    const fechaHoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    const horaAhoraStr = `${String(hoy.getHours()).padStart(2, "0")}:${String(hoy.getMinutes()).padStart(2, "0")}`;

    const vivas = [];
    for (const r of reservas) {
      let estadoActual = "proxima";
      let cancelable = true;

      if (r.fecha < fechaHoyStr) {
        estadoActual = "pasada";
        cancelable = false;
      } else if (r.fecha === fechaHoyStr) {
        if (r.horaFin <= horaAhoraStr) {
          estadoActual = "pasada";
          cancelable = false;
        } else if (r.horaInicio <= horaAhoraStr && r.horaFin > horaAhoraStr) {
          estadoActual = "en_curso";
          cancelable = false;
        }
      }

      const usuario = await this.repoUsuarios.buscarPorId(r.usuarioId);

      vivas.push({
        id: r.id,
        espacioIds: r.espacioIds,
        fecha: r.fecha,
        horaInicio: r.horaInicio,
        horaFin: r.horaFin,
        duracionMins: r.duracionMinutos,
        tipoUso: r.tipoUso,
        detalles: r.detalles,
        estadoBD: r.estado,
        estadoActual: estadoActual,
        sePuedeCancelar: cancelable,
        solicitante: usuario ? {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        } : null
      });
    }

    return vivas;
  }
}

module.exports = ConsultarReservasVivas;
