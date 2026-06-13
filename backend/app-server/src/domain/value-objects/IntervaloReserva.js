/**
 * @value-object IntervaloReserva
 * Franja horaria de una reserva dentro de un único día.
 */
class IntervaloReserva {
  constructor(fecha, horaInicio, duracionMinutos) {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error("fecha debe tener formato YYYY-MM-DD");
    }
    if (!horaInicio || !/^\d{2}:\d{2}$/.test(horaInicio)) {
      throw new Error("horaInicio debe tener formato HH:MM");
    }

    const mins = Number(duracionMinutos);
    if (Number.isNaN(mins) || mins <= 0) {
      throw new Error("duracionMinutos debe ser un número positivo");
    }

    this._fecha = fecha;
    this._horaInicio = horaInicio;
    this._duracionMinutos = mins;
    Object.freeze(this);
  }

  get fecha() { return this._fecha; }
  get horaInicio() { return this._horaInicio; }
  get duracionMinutos() { return this._duracionMinutos; }

  get horaFin() {
    const [h, m] = this._horaInicio.split(":").map(Number);
    const total = h * 60 + m + this._duracionMinutos;
    const hFin = Math.floor(total / 60) % 24;
    const mFin = total % 60;
    return `${String(hFin).padStart(2, "0")}:${String(mFin).padStart(2, "0")}`;
  }

  /**
   * Dos intervalos se solapan si comparten fecha y algún minuto en común.
   */
  solapaCon(otro) {
    if (!(otro instanceof IntervaloReserva)) return false;
    if (this._fecha !== otro._fecha) return false;

    const aInicio = this._minutosDesdeMedianoche(this._horaInicio);
    const aFin = aInicio + this._duracionMinutos;
    const bInicio = this._minutosDesdeMedianoche(otro._horaInicio);
    const bFin = bInicio + otro._duracionMinutos;

    return aInicio < bFin && bInicio < aFin;
  }

  _minutosDesdeMedianoche(hora) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
  }
}

module.exports = IntervaloReserva;
