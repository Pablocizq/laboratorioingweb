/**
 * Seeder: cargar-reservas-pasadas.js
 * Inserta reservas de días pasados y futuros directamente en BD
 */

async function cargarReservasDemostracion({ Usuario, Reserva, ReservaEspacio, Espacio }) {

  const usuario = await Usuario.findOne({ where: { esGerente: false } });
  const espacio = await Espacio.findOne({ where: { reservable: true } });

  if (!usuario || !espacio) {
    console.warn("[Seed Reservas] No se encontró usuario o espacio válidos. Omitiendo seed.");
    return;
  }

  const uid = usuario.id;
  const eid = espacio.id;

  const reservas = [
    {
      usuarioId: uid,
      fecha: "2025-01-15",
      horaInicio: "09:00",
      duracion: 90,
      tipoUso: "docencia",
      numPersonas: 20,
      descripcion: "Clase magistral pasada",
      estado: "aceptada",
    },
    {
      usuarioId: uid,
      fecha: "2025-03-20",
      horaInicio: "11:00",
      duracion: 60,
      tipoUso: "investigacion",
      numPersonas: 5,
      descripcion: "Reunión pasada",
      estado: "aceptada",
    },
    {
      usuarioId: uid,
      fecha: "2026-12-10",
      horaInicio: "10:00",
      duracion: 120,
      tipoUso: "docencia",
      numPersonas: 30,
      descripcion: "Práctica de laboratorio",
      estado: "aceptada",
    },
    {
      usuarioId: uid,
      fecha: "2026-12-20",
      horaInicio: "16:00",
      duracion: 90,
      tipoUso: "gestion",
      numPersonas: 10,
      descripcion: "Reunión",
      estado: "aceptada",
    },
  ];

  for (const datos of reservas) {
    const reserva = await Reserva.create(datos);
    await ReservaEspacio.create({ reservaId: reserva.id, espacioId: eid });
  }

  console.log(`[Seed Reservas] reservas cargadas.`);
}

module.exports = cargarReservasDemostracion;
