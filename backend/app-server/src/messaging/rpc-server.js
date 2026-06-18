const { obtenerCanal } = require("./broker-connection");

async function arrancarServidorRPC(casosDeUso) {
  const canal = await obtenerCanal();
  const nombreCola = process.env.REQUEST_QUEUE || "reservas.requests";

  await canal.assertQueue(nombreCola, { durable: true });
  console.log(`[App-Server] Consumidor activado. Escuchando peticiones RPC en la cola: ${nombreCola}`);

  canal.consume(nombreCola, async (mensaje) => {
    if (!mensaje) return;

    // Extraemos la información de enrutamiento
    const responderA = mensaje.properties.replyTo;
    const idCorrelacion = mensaje.properties.correlationId;
    let resultadoOperacion;

    try {
      const { operacion, datos } = JSON.parse(mensaje.content.toString());

      // Casos de Uso
      if (operacion === "BUSCAR_ESPACIOS") {
        const respuesta = await casosDeUso.obtenerEspacios.ejecutar(datos);
        resultadoOperacion = { exito: true, contenido: respuesta };
      } else if (operacion === "CREAR_RESERVA") {
        const respuesta = await casosDeUso.crearReserva.ejecutar(datos);
        resultadoOperacion = { exito: true, contenido: respuesta };
      } else if (operacion === "INICIAR_SESION") {
        const respuesta = await casosDeUso.iniciarSesion.ejecutar(datos);
        resultadoOperacion = { exito: true, contenido: respuesta };
      } else if (operacion === "CONSULTAR_MIS_RESERVAS") {
        const respuesta = await casosDeUso.consultarMisReservas.ejecutar(datos);
        resultadoOperacion = { exito: true, contenido: respuesta };
      } else {
        resultadoOperacion = { exito: false, mensajeError: `Operación desconocida: ${operacion}` };
      }

    } catch (error) {
      // Capturamos el error para devolverlo al Gateway
      resultadoOperacion = {
        exito: false,
        codigoEstado: error.statusCode || 500,
        mensajeError: error.message || "Error interno del servidor",
      };
    }

    // Devolvemos la respuesta al Gateway usando la cola
    if (responderA) {
      canal.sendToQueue(
        responderA,
        Buffer.from(JSON.stringify(resultadoOperacion)),
        { correlationId: idCorrelacion }
      );
    }

    // Confirmamos a RabbitMQ que ya hemos procesado este mensaje
    canal.ack(mensaje);
  });
}

module.exports = { arrancarServidorRPC };
