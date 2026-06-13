const { obtenerCanal } = require("./broker-connection");

async function arrancarServidorRPC(casosDeUso) {
  const canal = await obtenerCanal();
  const nombreCola = process.env.REQUEST_QUEUE || "reservas.requests";

  // Aseguramos que la cola para recibir peticiones existe
  await canal.assertQueue(nombreCola, { durable: true });
  console.log(`[App-Server] Consumidor activado. Escuchando peticiones RPC en la cola: ${nombreCola}`);

  canal.consume(nombreCola, async (mensaje) => {
    if (!mensaje) return;

    // Extraemos la información de enrutamiento (patrón RPC)
    const responderA = mensaje.properties.replyTo;
    const idCorrelacion = mensaje.properties.correlationId;
    let resultadoOperacion;

    try {
      const { operacion, datos } = JSON.parse(mensaje.content.toString());

      // --- Enrutador de Casos de Uso ---
      if (operacion === "BUSCAR_ESPACIOS") {
        const respuesta = await casosDeUso.obtenerEspacios.ejecutar(datos);
        resultadoOperacion = { exito: true, contenido: respuesta };
      } else {
        // Operación no implementada
        resultadoOperacion = { exito: false, mensajeError: `Operación desconocida: ${operacion}` };
      }

    } catch (error) {
      // Capturamos el error de dominio para devolverlo al Gateway
      resultadoOperacion = {
        exito: false,
        codigoEstado: error.statusCode || 500,
        mensajeError: error.message || "Error interno del servidor",
      };
    }

    // Devolvemos la respuesta al Gateway usando la cola temporal
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
