/**
 * @service DetectorConflictosHorario
 * Detecta solapamientos entre reservas activas.
 */
class DetectorConflictosHorario {
  static encontrarSolapadas(nuevaReserva, reservasExistentes) {
    return reservasExistentes.filter((r) => {
      if (!r.estaVigente()) return false;
      return nuevaReserva.solapaCon(r);
    });
  }
}

module.exports = DetectorConflictosHorario;
