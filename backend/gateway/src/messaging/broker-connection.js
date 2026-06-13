const amqplib = require("amqplib");

// Variables globales para la conexión y el canal
let conexionActiva = null;
let canalActivo = null;

async function conectarRabbit(maxRetries = 5, msDelay = 2000) {
  if (canalActivo) return { conn: conexionActiva, ch: canalActivo };

  for (let intento = 1; intento <= maxRetries; intento++) {
    try {
      const brokerUrl = process.env.RABBITMQ_URL || "amqp://localhost";
      conexionActiva = await amqplib.connect(brokerUrl);
      canalActivo = await conexionActiva.createChannel();
      console.log("[Gateway] Conexión exitosa con RabbitMQ.");
      return { conn: conexionActiva, ch: canalActivo };
    } catch (error) {
      console.warn(`[Gateway] RabbitMQ inalcanzable. Reintento ${intento} de ${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, msDelay));
    }
  }

  throw new Error("Fallo crítico: No se pudo enlazar con RabbitMQ tras múltiples intentos.");
}

async function obtenerCanal() {
  if (!canalActivo) await conectarRabbit();
  return canalActivo;
}

module.exports = { conectarRabbit, obtenerCanal };
