const IRepositorioUsuarios = require("../../domain/repositories/IRepositorioUsuarios");
const UsuarioEntity = require("../../domain/entities/Usuario");

class RepositorioUsuariosSQL extends IRepositorioUsuarios {
  constructor(modeloSequelize) {
    super();
    this.modeloDB = modeloSequelize;
  }

  _aEntidad(fila) {
    if (!fila) return null;
    const datos = fila.toJSON ? fila.toJSON() : fila;
    return new UsuarioEntity(datos);
  }

  async buscarPorId(id) {
    const fila = await this.modeloDB.findByPk(id);
    return this._aEntidad(fila);
  }

  async buscarPorNombre(nombre) {
    const fila = await this.modeloDB.findOne({
      where: { nombre: String(nombre).trim() },
    });
    return this._aEntidad(fila);
  }

  async buscarPorEmail(correo) {
    const fila = await this.modeloDB.findOne({
      where: { email: String(correo).trim().toLowerCase() },
    });
    return this._aEntidad(fila);
  }
}

module.exports = RepositorioUsuariosSQL;
