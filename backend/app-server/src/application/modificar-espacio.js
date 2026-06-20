/**
 * modificar-espacio.js
 * Caso de uso: el gerente modifica los atributos de un espacio.
 * Incluye validaciones, ajustes automáticos de asignación
 * e invalidación de reservas incompatibles con los nuevos valores.
 */

const CategoriaEspacio = require("../domain/value-objects/CategoriaEspacio");
const PoliticaPermisosReserva = require("../domain/policies/PoliticaPermisosReserva");

class ModificarEspacio {
  constructor(espacioRepository, reservaRepository, usuarioRepository) {
    this.repoEspacios = espacioRepository;
    this.repoReservas = reservaRepository;
    this.repoUsuarios = usuarioRepository;
  }

  async ejecutar({ espacioId, cambios, esGerente }) {
    // Solo gerentes pueden hacer esta operación
    if (!esGerente) {
      const errorAcceso = new Error("Solo los gerentes pueden modificar espacios.");
      errorAcceso.statusCode = 403;
      throw errorAcceso;
    }

    if (!espacioId) {
      const errorId = new Error("El id del espacio es obligatorio.");
      errorId.statusCode = 400;
      throw errorId;
    }

    if (!cambios || Object.keys(cambios).length === 0) {
      const errorCambios = new Error("No se han añadido cambios.");
      errorCambios.statusCode = 400;
      throw errorCambios;
    }

    // Comprobamos la existencia del espacio indicado
    const espacioObj = await this.repoEspacios.buscarPorId(espacioId);
    if (!espacioObj) {
      const error404 = new Error(`Espacio ${espacioId} no encontrado.`);
      error404.statusCode = 404;
      throw error404;
    }

    const {
      reservable,
      categoria,
      departamentoId,
      asignadoAEina,
      usuariosAsignados,
      porcentajeOcupacion,
    } = cambios;

    // Validamos porcentaje de ocupacion
    if (porcentajeOcupacion !== undefined && porcentajeOcupacion !== null) {
      const pctVal = Number(porcentajeOcupacion);
      if (isNaN(pctVal) || pctVal < 0 || pctVal > 100) {
        const errorPct = new Error("El porcentaje de ocupación debe ser un número entre 0 y 100.");
        errorPct.statusCode = 400;
        throw errorPct;
      }
    }

    // Validamos categoria
    const catFinal = categoria !== undefined ? categoria : espacioObj.categoria;
    let categoriaVO;
    try {
      categoriaVO = new CategoriaEspacio(catFinal);
    } catch (errVO) {
      const errorCat = new Error(errVO.message);
      errorCat.statusCode = 400;
      throw errorCat;
    }

    if (categoria !== undefined && categoria !== espacioObj.categoria) {
      const esValido = CategoriaEspacio.esTransicionValida(espacioObj.categoria, categoria, espacioObj.tipoFisico);
      if (!esValido) {
        const errorTransicion = new Error(
          `No se puede cambiar la categoría de ${espacioObj.categoria} a ${categoria} ` +
          `para un espacio de tipo físico ${espacioObj.tipoFisico}.`
        );
        errorTransicion.statusCode = 400;
        throw errorTransicion;
      }
    }

    // Validamos asignacion
    let nuevoAsignadoAEina = espacioObj.asignadoAEina;
    let nuevoDepartamentoId = espacioObj.departamentoId;
    let nuevosUsuariosIds = (espacioObj.usuariosAsignados || []).map(u => u.id ?? u);

    const seModificaAsignacion =
      departamentoId !== undefined ||
      asignadoAEina !== undefined ||
      usuariosAsignados !== undefined;

    if (seModificaAsignacion) {
      nuevoAsignadoAEina =
        asignadoAEina !== undefined ? asignadoAEina
          : (departamentoId || (usuariosAsignados && usuariosAsignados.length > 0)) ? false
            : espacioObj.asignadoAEina;

      nuevoDepartamentoId =
        departamentoId !== undefined ? departamentoId
          : (asignadoAEina || (usuariosAsignados && usuariosAsignados.length > 0)) ? null
            : espacioObj.departamentoId;

      const inputUsuariosIds = usuariosAsignados !== undefined ? usuariosAsignados : null;

      //Actualizamos lista de usuarios asignados
      if (inputUsuariosIds !== null) {
        nuevosUsuariosIds = inputUsuariosIds;
      } else if (departamentoId !== undefined || asignadoAEina !== undefined) {
        nuevosUsuariosIds = [];
      }

      // Comprobamos que no haya más de un tipo de asignación activo
      const tieneEina = !!nuevoAsignadoAEina;
      const tieneDpto = !!nuevoDepartamentoId;
      const tieneUsuarios = nuevosUsuariosIds.length > 0;
      const totalAsignacionesActivas = [tieneEina, tieneDpto, tieneUsuarios].filter(Boolean).length;

      if (totalAsignacionesActivas > 1) {
        const errorMutuo = new Error("Un espacio solo puede estar asignado a una cosa a la vez: EINA, un departamento, o una o más personas.");
        errorMutuo.statusCode = 400;
        throw errorMutuo;
      }

      // Obtener el tipo de asignación
      let modoAsignacion = "eina";
      if (nuevoAsignadoAEina) {
        modoAsignacion = "eina";
      } else if (nuevoDepartamentoId) {
        modoAsignacion = "departamento";
      } else if (nuevosUsuariosIds.length > 0) {
        modoAsignacion = "persona";
      }

      if (!categoriaVO.admiteAsignacion(modoAsignacion)) {
        const errorModo = new Error(
          `La categoría ${categoriaVO.valor} no admite asignación de tipo ${modoAsignacion}. ` +
          `Asignaciones permitidas: ${categoriaVO.asignacionesPermitidas().join(", ")}`
        );
        errorModo.statusCode = 400;
        throw errorModo;
      }

      // Validamos usuarios asignados
      if (inputUsuariosIds && inputUsuariosIds.length > 0) {
        if (categoriaVO.esDespacho() && inputUsuariosIds.length > 1) {
          const errorUnico = new Error("Un despacho solo puede estar asignado a una persona concreta.");
          errorUnico.statusCode = 400;
          throw errorUnico;
        }

        const ROLES_VALIDOS = ["investigador_contratado", "docente_investigador", "investigador_visitante"];
        let contieneProfesorOContratado = false;

        for (const uid of inputUsuariosIds) {
          const usuarioDB = await this.repoUsuarios.buscarPorId(uid);
          if (!usuarioDB) {
            const errorU404 = new Error(`Usuario ${uid} no encontrado.`);
            errorU404.statusCode = 404;
            throw errorU404;
          }
          if (!ROLES_VALIDOS.includes(usuarioDB.rol)) {
            const errorRol = new Error(
              `El usuario ${usuarioDB.nombre} no puede asignarse (rol: ${usuarioDB.rol}). ` +
              `Roles permitidos: ${ROLES_VALIDOS.join(", ")}`
            );
            errorRol.statusCode = 400;
            throw errorRol;
          }
          if (usuarioDB.rol !== "investigador_visitante") {
            contieneProfesorOContratado = true;
          }
        }

        // Restricción de despachos no reservables por estar asignados a docentes o investigador
        const reservableFuturo = reservable !== undefined ? reservable : espacioObj.reservable;
        if (categoriaVO.esDespacho() && contieneProfesorOContratado && reservableFuturo) {
          const errorReservable = new Error("Un despacho asignado a investigador contratado o docente-investigador no puede ser reservable.");
          errorReservable.statusCode = 400;
          throw errorReservable;
        }
      }
    }

    // Cambios automaticos en las asignaciones al cambiar la categoria del espacio
    let mensajeInformativo = null;
    if (categoria !== undefined && categoria !== espacioObj.categoria) {
      const nuevaCatVO = new CategoriaEspacio(categoria);

      if (nuevaCatVO.esAula() || nuevaCatVO.esSalaComun()) {
        nuevoAsignadoAEina = true;
        nuevoDepartamentoId = null;
        nuevosUsuariosIds = [];
        mensajeInformativo = `El espacio ha sido asignado automáticamente a la EINA al cambiar la categoría a ${categoria}.`;
      } else if (nuevaCatVO.esLaboratorio() || nuevaCatVO.esSeminario()) {
        const uActuales = espacioObj.usuariosAsignados || [];
        if (uActuales.length > 0) {
          if (departamentoId) {
            nuevoAsignadoAEina = false;
            nuevoDepartamentoId = departamentoId;
            nuevosUsuariosIds = [];
            mensajeInformativo = "Los seminarios y laboratorios no pueden estar asignados a personas. El espacio ha sido asignado al departamento indicado.";
          } else {
            nuevoAsignadoAEina = true;
            nuevoDepartamentoId = null;
            nuevosUsuariosIds = [];
            mensajeInformativo = "Los seminarios y laboratorios no pueden estar asignados a personas. El espacio ha sido asignado a la EINA por defecto.";
          }
        } else if (!departamentoId && !asignadoAEina) {
          nuevoAsignadoAEina = true;
          nuevoDepartamentoId = null;
          nuevosUsuariosIds = [];
          mensajeInformativo = `No se indicó asignación al cambiar la categoría a ${categoria}, el espacio ha sido asignado a la EINA por defecto.`;
        }
      } else if (nuevaCatVO.esDespacho()) {
        const inputEinaVal = asignadoAEina !== undefined ? asignadoAEina : espacioObj.asignadoAEina;
        const inputDeptVal = departamentoId !== undefined ? departamentoId : espacioObj.departamentoId;
        const inputUsersVal = usuariosAsignados !== undefined ? usuariosAsignados : (espacioObj.usuariosAsignados || []).map(u => u.id ?? u);

        if (inputEinaVal) {
          const errorEinaDespacho = new Error(
            "Un despacho no puede estar asignado a la EINA. Debe asignarse a un departamento o a una persona (docente_investigador, investigador_contratado o investigador_visitante)."
          );
          errorEinaDespacho.statusCode = 400;
          throw errorEinaDespacho;
        }

        if (!inputDeptVal && (!inputUsersVal || inputUsersVal.length === 0)) {
          const errorFaltaAsig = new Error(
            "Al cambiar la categoría a despacho debes indicar también la asignación: un departamento o una persona (docente_investigador, investigador_contratado o investigador_visitante)."
          );
          errorFaltaAsig.statusCode = 400;
          throw errorFaltaAsig;
        }
      }
    }

    // Modificamos espacio en la BD según el caso
    if (reservable !== undefined) {
      await this.repoEspacios.cambiarReservable(espacioId, reservable);
    }
    if (categoria !== undefined) {
      await this.repoEspacios.cambiarCategoria(espacioId, categoria);
    }
    if (porcentajeOcupacion !== undefined) {
      await this.repoEspacios.cambiarPorcentaje(espacioId, porcentajeOcupacion);
    }

    const cambioAsigGenerado =
      seModificaAsignacion || (categoria !== undefined && categoria !== espacioObj.categoria);

    if (cambioAsigGenerado) {
      const cleanIds = nuevosUsuariosIds.map(u => (typeof u === "object" ? u.id : u));
      await this.repoEspacios.actualizarAsignacion(espacioId, {
        departamentoId: nuevoDepartamentoId,
        asignadoAEina: nuevoAsignadoAEina,
        usuariosAsignados: cleanIds,
      });
    }

    // Comprobamos que reservas pasan a ser canceladas tras la modificacion
    const reservableFut = reservable !== undefined ? reservable : espacioObj.reservable;
    const categoriaFut = categoria !== undefined ? categoria : espacioObj.categoria;
    const porcentajeFut = porcentajeOcupacion !== undefined ? porcentajeOcupacion : espacioObj.porcentajeOcupacion;

    const reservasActivas = await this.repoReservas.buscarVivasPorEspacio(espacioId);
    const reservasBajas = [];
    const tiempoAhora = new Date();

    for (const res of reservasActivas) {
      // Regla de antelación: debe faltar más 30 minutos
      const [iniH, iniM] = res.horaInicio.split(":").map(Number);
      const [fechY, fechMo, fechD] = res.fecha.split("-").map(Number);
      const fechaInicioMs = new Date(fechY, fechMo - 1, fechD, iniH, iniM).getTime();
      const ahoraMs = tiempoAhora.getTime();
      const diferenciaMinutos = (fechaInicioMs - ahoraMs) / (1000 * 60);

      if (diferenciaMinutos < 30) {
        continue;
      }

      let requiereCancelacion = false;

      if (!reservableFut) {
        requiereCancelacion = true;
      }

      if (!requiereCancelacion && porcentajeFut !== null && porcentajeFut !== undefined && espacioObj.aforoMaximo) {
        const aforoMaxPermitido = Math.ceil(espacioObj.aforoMaximo * (porcentajeFut / 100));
        if (res.asistentes !== null && res.asistentes > aforoMaxPermitido) {
          requiereCancelacion = true;
        }
      }

      if (!requiereCancelacion) {
        const usuarioPropietario = await this.repoUsuarios.buscarPorId(res.usuarioId);
        if (usuarioPropietario) {
          const tienePermiso = PoliticaPermisosReserva.puedeReservar(
            usuarioPropietario.rol,
            usuarioPropietario.esGerente,
            categoriaFut,
            usuarioPropietario.departamentoId,
            nuevoDepartamentoId
          );
          if (!tienePermiso) {
            requiereCancelacion = true;
          }
        }
      }

      if (requiereCancelacion) {
        res.cancelar();
        await this.repoReservas.guardar(res);
        reservasBajas.push(res.id);
      }
    }

    const espacioActualizado = await this.repoEspacios.buscarPorId(espacioId);

    return {
      gid: espacioActualizado.id,
      idEspacio: espacioActualizado.idEspacio,
      nombre: espacioActualizado.nombre,
      categoria: espacioActualizado.categoria,
      reservable: espacioActualizado.reservable,
      porcentajeOcupacion: espacioActualizado.porcentajeOcupacion,
      departamentoId: espacioActualizado.departamentoId,
      asignadoAEina: espacioActualizado.asignadoAEina,
      usuariosAsignados: espacioActualizado.usuariosAsignados,
      reservasCanceladas: reservasBajas,
      info: mensajeInformativo,
    };
  }
}

module.exports = ModificarEspacio;
