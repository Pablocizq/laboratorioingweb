/**
 * @entity Espacio
 * Entidad de dominio que representa un espacio físico en el edificio.
 */
class Espacio {
  constructor({ id, idEspacio, nombre, tipoFisico, planta, aforoMaximo, porcentajeOcupacion, reservable, categoria, asignadoAEina, departamentoId }) {
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
  }

  // Aquí irían las reglas de negocio, getters y setters de dominio puro
  // sin depender de bases de datos ni librerías externas.
  esReservable() {
    return this.reservable;
  }
}

module.exports = Espacio;
