const { enviarPeticionRPC } = require("../messaging/rpc-client");

async function buscarEspacios(req, res) {
  try {
    // Recogemos los posibles filtros de la query string de la URL
    const { identificador, categoria, ocupantesMinimos, planta } = req.query;

    const colaPeticiones = process.env.REQUEST_QUEUE || "reservas.requests";
    
    // Delegamos la búsqueda al App-Server
    const respuestaServidor = await enviarPeticionRPC(colaPeticiones, {
      operacion: "BUSCAR_ESPACIOS",
      datos: { identificador, categoria, ocupantesMinimos, planta }
    });

    if (!respuestaServidor.exito) {
      return res.status(respuestaServidor.codigoEstado || 500).json({
        error: respuestaServidor.mensajeError
      });
    }

    return res.status(200).json(respuestaServidor.contenido);

  } catch (error) {
    console.error("[Gateway Espacios Error]", error);
    return res.status(500).json({ error: "Fallo de comunicación con el servidor interno al buscar espacios." });
  }
}

module.exports = { buscarEspacios };
