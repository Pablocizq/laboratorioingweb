const IntervaloReserva = require("../value-objects/IntervaloReserva");

/**
 * @entity Reserva
 * Agregado raíz que representa una reserva de uno o más espacios.
 */
class Reserva {
  constructor({
    id = null,
    espacioIds,
    usuarioId,
    fecha,
    horaInicio,
    duracionMinutos,
    tipoUso = null,
    asistentes = null,
    detalles = null,
    estado = "aceptada",
  }) {
    if (!espacioIds?.length) {
      throw new Error("Debe incluir al menos un espacio");
    }
    if (!usuarioId) throw new Error("usuarioId es obligatorio");

    this.id = id;
    this.espacioIds = espacioIds.map(Number);
    this.usuarioId = usuarioId;
    this.tipoUso = tipoUso;
    this.asistentes = asistentes != null ? Number(asistentes) : null;
    this.detalles = detalles;
    this.estado = estado;
    this._intervalo = new IntervaloReserva(fecha, horaInicio, duracionMinutos);
  }

  get fecha() { return this._intervalo.fecha; }
  get horaInicio() { return this._intervalo.horaInicio; }
  get duracionMinutos() { return this._intervalo.duracionMinutos; }
  get horaFin() { return this._intervalo.horaFin; }
  get intervalo() { return this._intervalo; }

  incluyeEspacio(espacioId) {
    return this.espacioIds.includes(Number(espacioId));
  }

  estaVigente() {
    return this.estado === "aceptada";
  }

  solapaCon(otraReserva) {
    return this._intervalo.solapaCon(otraReserva.intervalo);
  }
}

module.exports = Reserva;
