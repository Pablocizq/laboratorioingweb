const express = require("express");
const validarPayload = require("../middlewares/validar-payload");
const { validarCrearReserva } = require("../dtos/validar-crear-reserva");
const { crearReserva, misReservas } = require("../controllers/reservas.controller");

const router = express.Router();

// GET /api/reservas/mis-reservas — Obtiene las reservas del usuario 
router.get("/mis-reservas", misReservas);

// POST /api/reservas — crear una nueva reserva
router.post(
  "/",
  validarPayload(validarCrearReserva),
  crearReserva
);

module.exports = router;
