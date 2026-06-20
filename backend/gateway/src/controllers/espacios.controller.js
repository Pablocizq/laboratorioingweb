const { enviarPeticionRPC } = require("../messaging/rpc-client");

// Recogemos los posibles filtros de la query string y delegamos al App-Server
async function buscarEspacios(req, res) {
  try {
    const { identificador, categoria, ocupantesMinimos, planta } = req.query;
    const cola = process.env.REQUEST_QUEUE || "reservas.requests";

    const resultado = await enviarPeticionRPC(cola, {
      operacion: "BUSCAR_ESPACIOS",
      datos: { identificador, categoria, ocupantesMinimos, planta },
    });

    if (!resultado.exito) {
      return res.status(resultado.codigoEstado || 500).json({ error: resultado.mensajeError });
    }

    return res.status(200).json(resultado.contenido);

  } catch (e) {
    console.error("[Gateway] Error al buscar espacios:", e);
    return res.status(500).json({ error: "Fallo de comunicación con el servidor interno al buscar espacios." });
  }
}

// Enviamos la solicitud de modificación al App-Server con los datos del gerente
async function modificarEspacio(req, res) {
  try {
    const idEspacio = parseInt(req.params.id, 10);
    const datosNuevos = req.body;
    const gerenteActual = req.sesion ? req.sesion.esGerente : false;
    const cola = process.env.REQUEST_QUEUE || "reservas.requests";

    const resultado = await enviarPeticionRPC(cola, {
      operacion: "MODIFICAR_ESPACIO",
      datos: { espacioId: idEspacio, cambios: datosNuevos, esGerente: gerenteActual },
    });

    if (!resultado.exito) {
      return res.status(resultado.codigoEstado || 500).json({ error: resultado.mensajeError });
    }

    return res.status(200).json(resultado.contenido);

  } catch (e) {
    console.error("[Gateway] Error al modificar espacio:", e);
    return res.status(500).json({ error: "Fallo de comunicación con el servidor interno al modificar espacio." });
  }
}

module.exports = { buscarEspacios, modificarEspacio };
