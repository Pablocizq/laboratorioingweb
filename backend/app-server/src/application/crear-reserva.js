const ErrorDominio = require("../domain/errors/ErrorDominio");
const Reserva = require("../domain/entities/Reserva");
const PoliticaPermisosReserva = require("../domain/policies/PoliticaPermisosReserva");
const DetectorConflictosHorario = require("../domain/services/DetectorConflictosHorario");

const TIPOS_USO_VALIDOS = ["docencia", "investigacion", "gestion", "otros"];

/**
 * Caso de uso: creación de reservas con validación automática.
 */
class CrearReserva {
  constructor(repositorioEspacios, repositorioReservas, repositorioUsuarios) {
    this.repoEspacios = repositorioEspacios;
    this.repoReservas = repositorioReservas;
    this.repoUsuarios = repositorioUsuarios;
  }

  async ejecutar(datos) {
    const {
      nombre,
      espacioIds,
      fecha,
      horaInicio,
      duracionMins,
      tipoUso,
      asistentes,
      detalles,
    } = datos;

    const usuario = await this.repoUsuarios.buscarPorNombre(nombre);
    if (!usuario) {
      throw new ErrorDominio(`No se encontró ningún usuario con el nombre "${nombre}"`, 404);
    }
    if (!usuario.tieneRolOperativo()) {
      throw new ErrorDominio("El usuario no tiene rol asignado", 400);
    }

    if (!espacioIds?.length) {
      throw new ErrorDominio("Debe seleccionar al menos un espacio", 400);
    }

    if (!tipoUso || !TIPOS_USO_VALIDOS.includes(tipoUso)) {
      throw new ErrorDominio(
        `tipoUso debe ser uno de: ${TIPOS_USO_VALIDOS.join(", ")}`,
        400
      );
    }

    const numAsistentes = Number(asistentes);
    if (Number.isNaN(numAsistentes) || numAsistentes <= 0) {
      throw new ErrorDominio("asistentes debe ser un número positivo", 400);
    }

    const espacios = [];
    for (const id of espacioIds) {
      const espacio = await this.repoEspacios.buscarPorId(id);
      if (!espacio) throw new ErrorDominio(`El espacio ${id} no existe`, 404);
      espacios.push(espacio);
    }

    const inicioMinutos = this._aMinutos(horaInicio);
    const finMinutos = inicioMinutos + duracionMins;

    // Reserva siempre entre las 8:00 y las 20:00
    const aperturaMinutos = 8 * 60;
    const cierreMinutos = 20 * 60;
    if (inicioMinutos < aperturaMinutos || finMinutos > cierreMinutos) {
      throw { statusCode: 400, message: "El horario de la reserva debe estar comprendido entre las 08:00 y las 20:00." };
    }

    for (const espacio of espacios) {
      if (espacio.esDespacho()) {
        throw new ErrorDominio(
          `El espacio ${espacio.nombre || espacio.idEspacio} es un despacho y no puede reservarse`,
          400
        );
      }
      if (!espacio.esReservable()) {
        throw new ErrorDominio(
          `El espacio ${espacio.nombre || espacio.idEspacio} no está habilitado para reservas`,
          400
        );
      }
    }

    if (!usuario.esGerente) {
      for (const espacio of espacios) {
        const permitido = PoliticaPermisosReserva.puedeReservar(
          usuario.rol,
          usuario.esGerente,
          espacio.categoria,
          usuario.departamentoId,
          espacio.departamentoId
        );

        if (!permitido) {
          throw new ErrorDominio(
            this._mensajePermisoDenegado(usuario, espacio),
            403
          );
        }
      }
    }

    const capacidadTotal = espacios.reduce(
      (suma, e) => suma + e.calcularCapacidadPermitida(),
      0
    );
    if (numAsistentes > capacidadTotal) {
      throw new ErrorDominio(
        `El número de asistentes (${numAsistentes}) supera la capacidad permitida (${capacidadTotal} plazas)`,
        400
      );
    }

    const reserva = new Reserva({
      espacioIds,
      usuarioId: usuario.id,
      fecha,
      horaInicio,
      duracionMinutos: duracionMins,
      tipoUso,
      asistentes: numAsistentes,
      detalles,
    });

    for (const espacio of espacios) {
      const existentes = await this.repoReservas.buscarActivasPorEspacioYFecha(
        espacio.id,
        fecha
      );
      const conflictos = DetectorConflictosHorario.encontrarSolapadas(reserva, existentes);
      if (conflictos.length > 0) {
        const franjas = conflictos
          .map((r) => `${r.horaInicio}-${r.horaFin}`)
          .join(", ");
        throw new ErrorDominio(
          `El espacio ${espacio.nombre || espacio.idEspacio} ya está reservado. Franjas ocupadas: ${franjas}`,
          400
        );
      }
    }

    const guardada = await this.repoReservas.guardar(reserva);
    return this._serializar(guardada, usuario.nombre);
  }

  _mensajePermisoDenegado(usuario, espacio) {
    const cat = (espacio.categoria || "").toLowerCase();
    if (usuario.rol === "estudiante") {
      return "Los estudiantes solo pueden reservar salas comunes";
    }
    if (cat === "aula" && usuario.rol === "tecnico_laboratorio") {
      return "Los técnicos de laboratorio no pueden reservar aulas";
    }
    if (cat === "laboratorio") {
      return `No tienes permiso para reservar el laboratorio ${espacio.nombre || espacio.idEspacio} (restricción de departamento)`;
    }
    return `Tu rol (${usuario.rol}) no permite reservar espacios de tipo ${espacio.categoria}`;
  }

  _serializar(reserva, nombreUsuario) {
    return {
      id: reserva.id,
      nombre: nombreUsuario,
      espacioIds: reserva.espacioIds,
      usuarioId: reserva.usuarioId,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      duracionMins: reserva.duracionMinutos,
      tipoUso: reserva.tipoUso,
      asistentes: reserva.asistentes,
      detalles: reserva.detalles,
      estado: reserva.estado,
    };
  }

  _aMinutos(horaString) {
    const [h, m] = horaString.split(":").map(Number);
    return h * 60 + m;
  }
}

module.exports = CrearReserva;
