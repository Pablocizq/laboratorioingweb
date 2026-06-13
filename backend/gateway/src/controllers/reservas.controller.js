const { enviarPeticionRPC } = require("../messaging/rpc-client");

async function crearReserva(req, res) {
  try {
    const colaPeticiones = process.env.REQUEST_QUEUE || "reservas.requests";

    const respuestaServidor = await enviarPeticionRPC(colaPeticiones, {
      operacion: "CREAR_RESERVA",
      datos: req.datosValidados,
    });

    if (!respuestaServidor.exito) {
      return res.status(respuestaServidor.codigoEstado || 500).json({
        error: respuestaServidor.mensajeError,
      });
    }

    return res.status(201).json(respuestaServidor.contenido);
  } catch (error) {
    console.error("[Gateway Reservas Error]", error);
    return res.status(500).json({
      error: "Fallo de comunicación con el servidor interno al crear la reserva.",
    });
  }
}

module.exports = { crearReserva };
