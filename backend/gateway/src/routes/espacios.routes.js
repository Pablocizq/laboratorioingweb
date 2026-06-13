const express = require("express");
const { buscarEspacios } = require("../controllers/espacios.controller");

const router = express.Router();

// Ruta: GET /api/espacios
// Acepta query params: ?identificador=...&categoria=...&ocupantesMinimos=...&planta=...
router.get("/", buscarEspacios);

module.exports = router;
