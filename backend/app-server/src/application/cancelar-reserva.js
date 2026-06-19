/**
 * Caso de uso: Cancelar reserva.
 * Permite a un usuario cancelar su propia reserva.
 */

class CancelarReserva {
  constructor(repositorioReservas) {
    this.repoReservas = repositorioReservas;
  }

  async ejecutar({ reservaId, usuarioId }) {
    if (!reservaId) {
      const err = new Error("El id de la reserva es obligatorio.");
      err.statusCode = 400;
      throw err;
    }
    if (!usuarioId) {
      const err = new Error("Petición sin identificador de usuario.");
      err.statusCode = 401;
      throw err;
    }

    const reserva = await this.repoReservas.buscarPorId(reservaId);
    if (!reserva) {
      const err = new Error("La reserva no existe.");
      err.statusCode = 404;
      throw err;
    }

    if (!reserva.estaActiva()) {
      const err = new Error("Solo se pueden cancelar reservas que estén activas.");
      err.statusCode = 400;
      throw err;
    }

    const hoy = new Date();
    const fechaHoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    const horaAhoraStr = `${String(hoy.getHours()).padStart(2, "0")}:${String(hoy.getMinutes()).padStart(2, "0")}`;

    if (reserva.fecha < fechaHoyStr || (reserva.fecha === fechaHoyStr && reserva.horaFin <= horaAhoraStr)) {
      const err = new Error("No se puede cancelar una reserva que ya ha finalizado.");
      err.statusCode = 400;
      throw err;
    }

    if (String(reserva.usuarioId) !== String(usuarioId)) {
      const err = new Error("No tienes permiso para cancelar esta reserva.");
      err.statusCode = 403;
      throw err;
    }

    reserva.cancelar();
    await this.repoReservas.guardar(reserva);

    return { id: reserva.id, estado: reserva.estado };
  }
}

module.exports = CancelarReserva;
