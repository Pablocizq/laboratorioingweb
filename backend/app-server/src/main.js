const { conectar } = require("./infrastructure/database");

async function main() {
  console.log("[App-server] Iniciando...");

  // Conectamos a la base de datos y ejecutamos seed
  await conectar();

  // TODO: Conectamos a RabbitMQ y consumimos mensajes
  console.log("[App-server] Listo y esperando mensajes.");
}

main().catch((err) => {
  console.error("[App-server] Error fatal:", err);
  process.exit(1);
});
