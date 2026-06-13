const { randomUUID } = require("crypto");
const { obtenerCanal } = require("./broker-connection");

async function enviarPeticionRPC(nombreCola, payload) {
  const canal = await obtenerCanal();

  // Nos aseguramos de que la cola destino exista (productor)
  await canal.assertQueue(nombreCola, { durable: true });

  // Cola temporal de un solo uso para escuchar la respuesta
  const infoCola = await canal.assertQueue("", { exclusive: true });
  const colaRespuesta = infoCola.queue;

  // Identificador único para cruzar la petición con su respuesta
  const idCorrelacion = randomUUID();

  return new Promise((resolve, reject) => {
    // Si en 10s no hay respuesta, abortamos para no bloquear el hilo
    const temporizador = setTimeout(() => {
      reject(new Error("Timeout: El servidor de aplicaciones no ha respondido a tiempo."));
    }, 10000);

    // Escuchamos la respuesta en la cola temporal
    canal.consume(
      colaRespuesta,
      (mensaje) => {
        if (!mensaje) return;

        // Comprobamos que el ID coincide con nuestra petición
        if (mensaje.properties.correlationId === idCorrelacion) {
          clearTimeout(temporizador);
          try {
            const cuerpo = JSON.parse(mensaje.content.toString());
            resolve(cuerpo);
          } catch (err) {
            reject(err);
          }
        }
      },
      { noAck: true }
    );

    // Despachamos el mensaje al App-Server
    canal.sendToQueue(
      nombreCola,
      Buffer.from(JSON.stringify(payload)),
      {
        correlationId: idCorrelacion,
        replyTo: colaRespuesta,
        persistent: true,
      }
    );
  });
}

module.exports = { enviarPeticionRPC };
