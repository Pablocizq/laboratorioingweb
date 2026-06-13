/**
 * Error de dominio con código HTTP asociado para propagar al gateway.
 */
class ErrorDominio extends Error {
  constructor(mensaje, codigoEstado = 400) {
    super(mensaje);
    this.name = "ErrorDominio";
    this.statusCode = codigoEstado;
  }
}

module.exports = ErrorDominio;
