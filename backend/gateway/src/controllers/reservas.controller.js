const { enviarPeticionRPC } = require("../messaging/rpc-client");

/**
 * POST /api/reservas
 * Crea una nueva reserva para el usuario autenticado.
 * El id del usuario se extrae del token JWT (req.sesion),
 * no del body, para evitar suplantación de identidad.
 *
 * Precondición:  req.sesion contiene el payload del JWT
 * Postcondición: devuelve la reserva creada
 */

async function crearReserva(req, res) {
  try {
    const colaPeticiones = process.env.REQUEST_QUEUE || "reservas.requests";

    const datosReserva = {
      ...req.body,
      usuarioId: req.sesion.id,
    };

    const respuestaServidor = await enviarPeticionRPC(colaPeticiones, {
      operacion: "CREAR_RESERVA",
      datos: datosReserva,
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
      error: "Fallo de comunicación con el servidor al crear la reserva.",
    });
  }
}

module.exports = { crearReserva };
