const { conectar, Usuario, Espacio, Reserva, ReservaEspacio } = require("./infrastructure/database");

async function main() {
  console.log("[App-server] Iniciando...");

  await conectar();

  const RepositorioEspaciosSQL = require("./infrastructure/repositories/RepositorioEspaciosSQL");
  const RepositorioUsuariosSQL = require("./infrastructure/repositories/RepositorioUsuariosSQL");
  const RepositorioReservasSQL = require("./infrastructure/repositories/RepositorioReservasSQL");

  const ObtenerEspacios       = require("./application/obtener-espacios");
  const CrearReserva          = require("./application/crear-reserva");
  const IniciarSesion         = require("./application/iniciar-sesion");
  const ConsultarMisReservas  = require("./application/consultar-mis-reservas");
  const CancelarReserva       = require("./application/cancelar-reserva");

  const repoEspacios = new RepositorioEspaciosSQL(Espacio);
  const repoUsuarios = new RepositorioUsuariosSQL(Usuario);
  const repoReservas = new RepositorioReservasSQL(Reserva, ReservaEspacio);

  const casosDeUso = {
    obtenerEspacios:      new ObtenerEspacios(repoEspacios),
    crearReserva:         new CrearReserva(repoEspacios, repoReservas, repoUsuarios),
    iniciarSesion:        new IniciarSesion(repoUsuarios),
    consultarMisReservas: new ConsultarMisReservas(repoReservas),
    cancelarReserva:      new CancelarReserva(repoReservas),
  };

  const { conectarRabbit } = require("./messaging/broker-connection");
  const { arrancarServidorRPC } = require("./messaging/rpc-server");

  await conectarRabbit();
  await arrancarServidorRPC(casosDeUso);

  console.log("[App-server] Listo y esperando peticiones de Gateway.");
}

main().catch((err) => {
  console.error("[App-server] Error fatal:", err);
  process.exit(1);
});
