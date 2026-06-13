const TIPOS_USO = ["docencia", "investigacion", "gestion", "otros"];

function validarCrearReserva(body) {
  const {
    nombre,
    espacioIds,
    fecha,
    tipoUso,
    asistentes,
    horaInicio,
    duracionMins,
    detalles,
  } = body;

  if (!nombre || !String(nombre).trim()) {
    throw new Error("El campo nombre es obligatorio");
  }

  if (!espacioIds || !Array.isArray(espacioIds) || espacioIds.length === 0) {
    throw new Error("espacioIds debe ser un array con al menos un id");
  }

  for (const id of espacioIds) {
    const num = Number(id);
    if (Number.isNaN(num) || num <= 0) {
      throw new Error("Cada elemento de espacioIds debe ser un id numérico válido");
    }
  }

  if (!fecha) throw new Error("El campo fecha es obligatorio (YYYY-MM-DD)");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha).trim())) {
    throw new Error("fecha debe tener formato YYYY-MM-DD");
  }

  if (!horaInicio) throw new Error("El campo horaInicio es obligatorio (HH:MM)");
  if (!/^\d{2}:\d{2}$/.test(String(horaInicio).trim())) {
    throw new Error("horaInicio debe tener formato HH:MM");
  }

  if (!duracionMins) throw new Error("El campo duracionMins es obligatorio");
  const duracion = Number(duracionMins);
  if (Number.isNaN(duracion) || duracion <= 0) {
    throw new Error("duracionMins debe ser un número positivo");
  }

  if (!tipoUso) throw new Error("El campo tipoUso es obligatorio");
  if (!TIPOS_USO.includes(String(tipoUso).trim())) {
    throw new Error(`tipoUso debe ser uno de: ${TIPOS_USO.join(", ")}`);
  }

  if (!asistentes) throw new Error("El campo asistentes es obligatorio");
  const numAsistentes = Number(asistentes);
  if (Number.isNaN(numAsistentes) || numAsistentes <= 0) {
    throw new Error("asistentes debe ser un número positivo");
  }

  return {
    nombre: String(nombre).trim(),
    espacioIds: espacioIds.map(Number),
    fecha: String(fecha).trim(),
    horaInicio: String(horaInicio).trim(),
    duracionMins: duracion,
    tipoUso: String(tipoUso).trim(),
    asistentes: numAsistentes,
    detalles: detalles ? String(detalles).trim() : null,
  };
}

module.exports = { validarCrearReserva };
