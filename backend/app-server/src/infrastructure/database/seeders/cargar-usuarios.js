const bcrypt = require("bcryptjs");

async function poblarUsuariosMuestra({ Usuario, Departamento }) {
  console.log("Iniciando la carga de usuarios del sistema...");

  const departamentoInf = await Departamento.findOne({ where: { nombre: "Informática e Ingeniería de Sistemas" } });
  const departamentoElec = await Departamento.findOne({ where: { nombre: "Ingeniería Electrónica y Comunicaciones" } });

  const hashComun = await bcrypt.hash("password", 10);

  // Creamos lista de Usuarios
  const listaUsuarios = [
    { nombre: "Gerente Pablo", email: "gerente@eina.unizar.es", contrasenia: hashComun, rol: null, esGerente: true, departamentoId: null },
    { nombre: "Gerente Departamento", email: "gerentedep@eina.unizar.es", contrasenia: hashComun, rol: null, esGerente: true, departamentoId: departamentoInf ? departamentoInf.id : null },
    { nombre: "Docente Investigador Luis", email: "docenteinf@unizar.es", contrasenia: hashComun, rol: "docente_investigador", esGerente: false, departamentoId: departamentoInf ? departamentoInf.id : null },
    { nombre: "Docente Investigador Ana", email: "docenteelec@unizar.es", contrasenia: hashComun, rol: "docente_investigador", esGerente: false, departamentoId: departamentoElec ? departamentoElec.id : null },
    { nombre: "Investigador Contratado Miguel", email: "investigadorinf@unizar.es", contrasenia: hashComun, rol: "investigador_contratado", esGerente: false, departamentoId: departamentoInf ? departamentoInf.id : null },
    { nombre: "Investigador Contratado Sara", email: "investigadorelec@unizar.es", contrasenia: hashComun, rol: "investigador_contratado", esGerente: false, departamentoId: departamentoElec ? departamentoElec.id : null },
    { nombre: "Tecnico de laboratorio Alonso", email: "tecnicoinf@unizar.es", contrasenia: hashComun, rol: "tecnico_laboratorio", esGerente: false, departamentoId: departamentoInf ? departamentoInf.id : null },
    { nombre: "Tecnico de laboratorio Elena", email: "tecnicoelec@unizar.es", contrasenia: hashComun, rol: "tecnico_laboratorio", esGerente: false, departamentoId: departamentoElec ? departamentoElec.id : null },
    { nombre: "Conserje Daniel", email: "conserje@unizar.es", contrasenia: hashComun, rol: "conserje", esGerente: false, departamentoId: null },
    { nombre: "Estudiante Jose", email: "estudiante@unizar.es", contrasenia: hashComun, rol: "estudiante", esGerente: false, departamentoId: null },
  ];

  await Usuario.bulkCreate(listaUsuarios);

  console.log(`Carga finalizada. Se han insertado ${listaUsuarios.length} usuarios de prueba correctamente.`);
}

module.exports = poblarUsuariosMuestra;
