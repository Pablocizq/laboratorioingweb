const fs = require("fs");
const path = require("path");

function extraerCapacidadesDesdeCSV(rutaBase) {
  const registroCapacidades = new Map();
  const archivoCsv = path.join(rutaBase, "ESPACIOS_ADA_BYRON.csv");

  if (!fs.existsSync(archivoCsv)) {
    console.warn(`No hemos encontrado el documento CSV en: ${archivoCsv}`);
    return registroCapacidades;
  }

  const datosCrudos = fs.readFileSync(archivoCsv, "utf-8");
  const filas = datosCrudos.split("\n");

  // Procesamos línea por línea saltando las cabeceras
  for (let indice = 1; indice < filas.length; indice++) {
    const filaActual = filas[indice].trim();
    if (!filaActual) continue;

    const fragmentos = filaActual.split(";");
    if (fragmentos.length >= 5) {
      const codigoSala = fragmentos[0].trim();
      const numeroPlazas = parseInt(fragmentos[4].trim(), 10);

      if (!isNaN(numeroPlazas)) {
        registroCapacidades.set(codigoSala, numeroPlazas);
      }
    }
  }

  return registroCapacidades;
}

function deducirTipologia(cadenaUso, cadenaNombre) {
  const usoLimpio = (cadenaUso || "").toString().trim().toLowerCase();
  const nombreLimpio = (cadenaNombre || "").toString().trim().toLowerCase();

  if (nombreLimpio.startsWith("seminario") || usoLimpio.includes("seminario")) {
    return "seminario";
  }

  if (
    nombreLimpio.includes("sala comun") || nombreLimpio.includes("sala común") ||
    nombreLimpio.includes("salon de actos") || nombreLimpio.includes("sala de juntas") ||
    nombreLimpio.includes("biblioteca") ||
    usoLimpio.includes("comun") || usoLimpio.includes("común")
  ) {
    return "sala comun";
  }

  const coincideConLab = usoLimpio.includes("lab") || usoLimpio.includes("inform");
  if (coincideConLab) return "laboratorio";

  if (usoLimpio.includes("aula")) return "aula";
  if (usoLimpio.includes("despacho")) return "despacho";
  if (usoLimpio.includes("pasillo")) return "pasillo";

  return "otros";
}

function comprobarDisponibilidadReserva(tipoEspacio) {
  const permitidos = ["aula", "seminario", "laboratorio", "sala comun", "despacho"];
  const tipoLimpio = (tipoEspacio || "").toString().trim().toLowerCase();

  return permitidos.includes(tipoLimpio);
}

async function iniciarCargaDeDatos({ Espacio, Departamento, Usuario, EspacioUsuario }) {
  console.log("Iniciando la carga masiva de espacios...");
  const directorioOrigen = process.env.DATA_DIR || path.join(__dirname, "../../../../data/espacios_geojson");

  if (!fs.existsSync(directorioOrigen)) {
    console.warn("Directorio de origen no detectado. Abortamos el proceso de importación.");
    return;
  }

  const registroCapacidades = extraerCapacidadesDesdeCSV(directorioOrigen);
  const ficherosJson = fs.readdirSync(directorioOrigen).filter(nombre => nombre.endsWith(".json"));

  let listaEspaciosNuevos = [];

  for (const fichero of ficherosJson) {
    const rutaAbsoluta = path.join(directorioOrigen, fichero);
    const textoJson = fs.readFileSync(rutaAbsoluta, "utf-8");
    const objetoParseado = JSON.parse(textoJson);

    if (!objetoParseado.features) continue;

    for (const elemento of objetoParseado.features) {
      const propiedades = elemento.properties;

      const nombreEdificio = (propiedades?.EDIFICIO || "").toUpperCase();
      if (!nombreEdificio.includes("ADA BYRON")) continue;

      const identificadorUnico = propiedades.ID_ESPACIO || "SIN_ID";
      const usoOriginal = propiedades.USO || null;

      const nombreEspacio = propiedades.Nombre || propiedades.NOMBRE || null;
      const tipoDefinitivo = deducirTipologia(usoOriginal, nombreEspacio);
      const permiteReserva = comprobarDisponibilidadReserva(tipoDefinitivo);

      let plazasAsignadas = registroCapacidades.get(identificadorUnico) || null;

      if (plazasAsignadas === null && permiteReserva) {
        plazasAsignadas = 40;
      }

      listaEspaciosNuevos.push({
        idEspacio: identificadorUnico,
        nombre: propiedades.Nombre || propiedades.NOMBRE || null,
        tipoFisico: usoOriginal || "Desconocido",
        planta: isNaN(parseInt(propiedades.Altura)) ? 0 : parseInt(propiedades.Altura),
        aforoMaximo: plazasAsignadas,
        porcentajeOcupacion: 100,
        reservable: permiteReserva,
        categoria: tipoDefinitivo,
        asignadoAEina: true,
        departamentoId: null,
      });
    }
  }

  if (listaEspaciosNuevos.length > 0) {
    await Espacio.bulkCreate(listaEspaciosNuevos, { ignoreDuplicates: true });
    console.log(`Finalizamos la importación con ${listaEspaciosNuevos.length} registros insertados.`);
  } else {
    console.log("No detectamos registros procesables en los documentos proporcionados.");
    return;
  }

  console.log("Asignando despachos y laboratorios a los departamentos/usuarios...");

  const { Op } = require("sequelize");

  // 1) Aulas y salas comunes -> SIEMPRE EINA
  await Espacio.update(
    { asignadoAEina: true, departamentoId: null },
    { where: { categoria: ["aula", "sala comun"] } }
  );

  const dInf = await Departamento.findOne({ where: { nombre: "Informática e Ingeniería de Sistemas" } });
  const dElec = await Departamento.findOne({ where: { nombre: "Ingeniería Electrónica y Comunicaciones" } });

  // 2) SALA INFORMÁTICA -> departamento de Informática
  if (dInf) {
    await Espacio.update(
      { asignadoAEina: false, departamentoId: dInf.id },
      { where: { tipoFisico: { [Op.iLike]: "%SALA INFORMÁTICA%" } } }
    );
  }

  // 3) Seminarios y laboratorios -> repartimos entre EINA, INF y ELEC
  const labsYSeminarios = await Espacio.findAll({
    where: {
      categoria: ["laboratorio", "seminario"],
      tipoFisico: { [Op.notILike]: "%SALA INFORMÁTICA%" },
    },
    order: [["id", "ASC"]],
  });

  for (let i = 0; i < labsYSeminarios.length; i++) {
    const espacio = labsYSeminarios[i];
    if (i % 3 === 0) {
      await espacio.update({ asignadoAEina: true, departamentoId: null });
    } else if (i % 3 === 1 && dInf) {
      await espacio.update({ asignadoAEina: false, departamentoId: dInf.id });
    } else if (dElec) {
      await espacio.update({ asignadoAEina: false, departamentoId: dElec.id });
    }
  }

  // 4) Despachos
  const despachos = await Espacio.findAll({
    where: { categoria: "despacho" },
    order: [["id", "ASC"]],
  });

  const invInf = await Usuario.findOne({ where: { email: "investigadorinf@unizar.es" } });
  const invElec = await Usuario.findOne({ where: { email: "investigadorelec@unizar.es" } });
  const docInf = await Usuario.findOne({ where: { email: "docenteinf@unizar.es" } });

  for (let i = 0; i < despachos.length; i++) {
    const despacho = despachos[i];
    const caso = i % 5;

    switch (caso) {
      case 0:
        if (dInf) await despacho.update({ asignadoAEina: false, departamentoId: dInf.id });
        break;
      case 1:
        if (dElec) await despacho.update({ asignadoAEina: false, departamentoId: dElec.id });
        break;
      case 2:
        if (invInf) {
          await despacho.update({ asignadoAEina: false, departamentoId: null });
          await EspacioUsuario.findOrCreate({ where: { usuarioId: invInf.id, espacioId: despacho.id } });
        }
        break;
      case 3:
        if (invElec) {
          await despacho.update({ asignadoAEina: false, departamentoId: null });
          await EspacioUsuario.findOrCreate({ where: { usuarioId: invElec.id, espacioId: despacho.id } });
        }
        break;
      case 4:
        if (docInf) {
          await despacho.update({ asignadoAEina: false, departamentoId: null, reservable: false });
          await EspacioUsuario.findOrCreate({ where: { usuarioId: docInf.id, espacioId: despacho.id } });
        }
        break;
    }
  }

  console.log("✓ Asignaciones de espacios completadas.");
}

module.exports = iniciarCargaDeDatos;
