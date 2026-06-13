const { conectar, Usuario, Espacio } = require("./infrastructure/database");

async function main() {
  console.log("[App-server] Iniciando...");

  // Conectamos a la base de datos y ejecutamos seed
  await conectar();

  // Inicializamos Casos de Uso e Inyección de Dependencias
  const RepositorioEspaciosSQL = require("./infrastructure/repositories/RepositorioEspaciosSQL");
  const ObtenerEspacios = require("./application/obtener-espacios");
  
  const repoEspacios = new RepositorioEspaciosSQL(Espacio);

  const casosDeUso = {
    obtenerEspacios: new ObtenerEspacios(repoEspacios)
  };

  // Conectamos a RabbitMQ y arrancamos el consumidor RPC
  const { conectarRabbit } = require("./messaging/broker-connection");
  const { arrancarServidorRPC } = require("./messaging/rpc-server");

  await conectarRabbit();
  await arrancarServidorRPC(casosDeUso);

  console.log("[App-server] Listo y esperando peticiones RPC de Gateway.");
}

main().catch((err) => {
  console.error("[App-server] Error fatal:", err);
  process.exit(1);
});
