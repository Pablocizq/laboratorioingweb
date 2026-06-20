const express = require("express");
const { buscarEspacios, modificarEspacio } = require("../controllers/espacios.controller");
const autenticar = require("../middlewares/autenticar");

const router = express.Router();

// Ruta: GET /api/espacios
// Acepta query params: ?identificador=...&categoria=...&ocupantesMinimos=...&planta=...
router.get("/", buscarEspacios);

// Ruta: PATCH /api/espacios/:id
// Sólo gerentes
router.patch("/:id", autenticar, modificarEspacio);

module.exports = router;
