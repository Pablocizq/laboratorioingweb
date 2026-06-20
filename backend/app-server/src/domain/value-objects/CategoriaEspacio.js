/**
 * Valor objeto que encapsula la categoría reservable de un espacio y las
 * reglas de transición y asignación que se derivan de ella.
 */

const CATEGORIAS_POSIBLES = ["aula", "seminario", "laboratorio", "despacho", "sala comun"];

// Cambios de categoría permitidos desde cada tipo
const CAMBIOS_PERMITIDOS = {
  aula: ["seminario", "sala comun"],
  laboratorio: ["aula", "seminario"],
  seminario: ["aula", "sala comun"],
  despacho: [],
  "sala comun": ["aula", "seminario"],
};

// Modos de asignación aceptados por cada categoría
const MODOS_ASIGNACION = {
  aula: ["eina"],
  "sala comun": ["eina"],
  seminario: ["eina", "departamento"],
  laboratorio: ["eina", "departamento"],
  despacho: ["departamento", "persona"],
};

class CategoriaEspacio {
  constructor(valor) {
    const clave = (valor || "").toString().trim().toLowerCase();
    if (!CATEGORIAS_POSIBLES.includes(clave)) {
      throw new Error(`Categoría no válida: '${valor}'. Permitidas: ${CATEGORIAS_POSIBLES.join(", ")}`);
    }
    this._valor = clave;
    Object.freeze(this);
  }

  get valor() { return this._valor; }

  // Comprobamos igualdad por valor, no por referencia
  equals(otra) {
    if (!(otra instanceof CategoriaEspacio)) return false;
    return this._valor === otra._valor;
  }

  esAula() { return this._valor === "aula"; }
  esSeminario() { return this._valor === "seminario"; }
  esLaboratorio() { return this._valor === "laboratorio"; }
  esDespacho() { return this._valor === "despacho"; }
  esSalaComun() { return this._valor === "sala comun"; }

  // Comprobamos si el modo de asignación recibido es compatible con esta categoría
  admiteAsignacion(modo) {
    return (MODOS_ASIGNACION[this._valor] || []).includes(modo);
  }

  asignacionesPermitidas() {
    return MODOS_ASIGNACION[this._valor] || [];
  }

  toString() { return this._valor; }

  static get VALORES() { return [...CATEGORIAS_POSIBLES]; }

  // Comprobamos si el cambio de categoría está permitido según el tipo físico del espacio
  static esTransicionValida(desde, hasta, tipoFisico = null) {
    const catOrigen = (desde instanceof CategoriaEspacio) ? desde.valor : (desde || "").toLowerCase();
    const catDestino = (hasta instanceof CategoriaEspacio) ? hasta.valor : (hasta || "").toLowerCase();

    // Mapeamos el tipo físico a la clave de categoría equivalente
    let tipoClave = null;
    if (tipoFisico) {
      const raw = tipoFisico.toString().toLowerCase().trim();
      if (raw.includes("laboratorio") || raw.includes("lab") || raw.includes("sala inform") || raw.includes("informatica") || raw.includes("informática")) {
        tipoClave = "laboratorio";
      } else if (raw.includes("aula")) {
        tipoClave = "aula";
      } else if (raw.includes("seminario")) {
        tipoClave = "seminario";
      } else if (raw.includes("despacho")) {
        tipoClave = "despacho";
      } else if (raw.includes("comun") || raw.includes("común")) {
        tipoClave = "sala comun";
      } else {
        tipoClave = raw;
      }
    }

    const base = tipoClave && CAMBIOS_PERMITIDOS[tipoClave] !== undefined ? tipoClave : catOrigen;
    const posibles = CAMBIOS_PERMITIDOS[base] || [];

    // Siempre permitimos volver al tipo físico original
    if (tipoClave && catDestino === tipoClave) return true;

    return posibles.includes(catDestino);
  }
}

module.exports = CategoriaEspacio;
