/**
 * @entity Espacio
 * Entidad de dominio que representa un espacio físico en el edificio.
 */

class Espacio {
  constructor({ id, idEspacio, nombre, tipoFisico, planta, aforoMaximo, porcentajeOcupacion, reservable, categoria, asignadoAEina, departamentoId, usuariosAsignados = [] }) {
    this.id = id;
    this.idEspacio = idEspacio;
    this.nombre = nombre;
    this.tipoFisico = tipoFisico;
    this.planta = planta;
    this.aforoMaximo = aforoMaximo;
    this.porcentajeOcupacion = porcentajeOcupacion;
    this.reservable = reservable;
    this.categoria = categoria;
    this.asignadoAEina = asignadoAEina;
    this.departamentoId = departamentoId;
    this.usuariosAsignados = Array.isArray(usuariosAsignados) ? usuariosAsignados : [];
  }

  esReservable() {
    return this.reservable === true;
  }

  esDespacho() {
    return (this.categoria || "").trim().toLowerCase() === "despacho";
  }

  calcularCapacidadPermitida() {
    if (!this.aforoMaximo) return 0;
    const pct = this.porcentajeOcupacion ?? 100;
    return Math.ceil(this.aforoMaximo * pct / 100);
  }

  admiteAsistentes(totalAsistentes) {
    if (!this.aforoMaximo) return true;
    return Number(totalAsistentes) <= this.calcularCapacidadPermitida();
  }

  estaAsignadoA(usuarioId) {
    return this.usuariosAsignados.some(u => String(u.id ?? u) === String(usuarioId));
  }
}

module.exports = Espacio;
