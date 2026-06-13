/**
 * @policy PoliticaPermisosReserva
 * Aplicamos políticas de reserva según el rol y la categoria de espacio 
 * que se quiere reservar.
 */
class PoliticaPermisosReserva {
  /**
   * @param {string|null} rol
   * @param {boolean} esGerente
   * @param {string} categoria
   * @param {number|null} deptUsuarioId
   * @param {number|null} deptEspacioId
   */
  static puedeReservar(rol, esGerente, categoria, deptUsuarioId, deptEspacioId) {
    if (esGerente) return true;
    if (!rol || !categoria) return false;

    const cat = categoria.trim().toLowerCase();

    // estudiantes solo salas comunes
    if (rol === "estudiante") {
      return cat === "sala comun";
    }

    // aulas — no técnicos de laboratorio
    if (cat === "aula") {
      return rol !== "tecnico_laboratorio";
    }

    // laboratorios — restricción de departamento para ciertos roles
    if (cat === "laboratorio") {
      const rolesConDepartamento = [
        "tecnico_laboratorio",
        "investigador_contratado",
        "docente_investigador",
      ];
      if (rolesConDepartamento.includes(rol)) {
        return deptUsuarioId != null
          && deptEspacioId != null
          && deptUsuarioId === deptEspacioId;
      }
      return true;
    }

    // seminarios y salas comunes: permitidos
    if (cat === "seminario" || cat === "sala comun") {
      return true;
    }

    return false;
  }
}

module.exports = PoliticaPermisosReserva;
