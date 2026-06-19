const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

const Departamento = sequelize.define("Departamento", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
}, { tableName: "departamentos", timestamps: false });

const Usuario = sequelize.define("Usuario", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  email: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  contrasenia: { type: DataTypes.STRING(200), allowNull: false },
  rol: {
    type: DataTypes.ENUM(
      "estudiante", "investigador_contratado", "docente_investigador",
      "tecnico_laboratorio", "conserje"
    ),
    allowNull: true,
  },
  esGerente: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  departamentoId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "departamentos", key: "id" } },
}, { tableName: "usuarios", timestamps: false });

const Espacio = sequelize.define("Espacio", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idEspacio: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: true },
  tipoFisico: { type: DataTypes.STRING(80), allowNull: false },
  planta: { type: DataTypes.INTEGER, allowNull: true },
  aforoMaximo: { type: DataTypes.INTEGER, allowNull: true },
  porcentajeOcupacion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
  reservable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  categoria: { type: DataTypes.STRING(100), allowNull: true },
  asignadoAEina: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  departamentoId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "departamentos", key: "id" } },
}, { tableName: "espacios", timestamps: false });

// Definimos la tabla intermedia para la asignacion de personas a espacios
const EspacioUsuario = sequelize.define("EspacioUsuario", {
  espacioId: { type: DataTypes.INTEGER, allowNull: false },
  usuarioId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "espacios_usuarios", timestamps: false });

const Reserva = sequelize.define("Reserva", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuarioId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "usuarios", key: "id" } },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  horaInicio: { type: DataTypes.STRING(5), allowNull: false },
  duracion: { type: DataTypes.INTEGER, allowNull: false },
  tipoUso: {
    type: DataTypes.ENUM("docencia", "investigacion", "gestion", "otros"),
    allowNull: true,
  },
  numPersonas: { type: DataTypes.INTEGER, allowNull: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  estado: {
    type: DataTypes.ENUM("aceptada", "cancelada", "finalizada"),
    allowNull: false,
    defaultValue: "aceptada",
  },
}, { tableName: "reservas", timestamps: false });

// Definimos la tabla intermedia para los espacios de cada reserva
const ReservaEspacio = sequelize.define("ReservaEspacio", {
  reservaId: { type: DataTypes.INTEGER, allowNull: false },
  espacioId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "reservas_espacios", timestamps: false });

// Establecemos las asociaciones entre modelos
Usuario.belongsTo(Departamento, { foreignKey: "departamentoId", as: "departamento" });
Departamento.hasMany(Usuario, { foreignKey: "departamentoId" });

Espacio.belongsTo(Departamento, { foreignKey: "departamentoId", as: "departamento" });
Espacio.belongsToMany(Usuario, { through: EspacioUsuario, foreignKey: "espacioId", as: "usuariosAsignados" });
Usuario.belongsToMany(Espacio, { through: EspacioUsuario, foreignKey: "usuarioId", as: "espaciosAsignados" });

Reserva.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
Reserva.belongsToMany(Espacio, { through: ReservaEspacio, foreignKey: "reservaId", as: "espacios" });
Espacio.belongsToMany(Reserva, { through: ReservaEspacio, foreignKey: "espacioId", as: "reservas" });

async function conectar() {
  await sequelize.authenticate();
  console.log("[DB] Conexión establecida con PostgreSQL");

  await sequelize.sync({ alter: true });
  console.log("[DB] Esquema sincronizado");

  await seed();
}

const bcrypt = require("bcryptjs");

async function seed() {
  const count = await Departamento.count();
  if (count > 0) {
    console.log("[DB] Datos iniciales ya existen, omitiendo seed");
    return;
  }

  console.log("[DB] Ejecutando seed inicial...");

  const [dInf, dElec] = await Promise.all([
    Departamento.create({ nombre: "Informática e Ingeniería de Sistemas" }),
    Departamento.create({ nombre: "Ingeniería Electrónica y Comunicaciones" }),
  ]);
  const cargarUsuarios = require("./seeders/cargar-usuarios");
  await cargarUsuarios({ Usuario, Departamento });

  const cargarEspacios = require("./seeders/cargar-espacios");
  await cargarEspacios({ Espacio, Departamento, Usuario, EspacioUsuario });

  const cargarReservasDemostracion = require("./seeders/cargar-reservas-pasadas");
  await cargarReservasDemostracion({ Usuario, Reserva, ReservaEspacio, Espacio });

  console.log("[DB] Seed completado");
}

module.exports = {
  sequelize,
  conectar,
  Departamento,
  Usuario,
  Espacio,
  EspacioUsuario,
  Reserva,
  ReservaEspacio,
};
