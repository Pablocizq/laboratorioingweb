const express = require("express");
const validarPayload = require("../middlewares/validar-payload");
const { validarCrearReserva } = require("../dtos/validar-crear-reserva");
const { crearReserva, misReservas, cancelarReserva, reservasVivas } = require("../controllers/reservas.controller");

const router = express.Router();

// GET /api/reservas/mis-reservas — Obtiene las reservas del usuario 
router.get("/mis-reservas", misReservas);

// POST /api/reservas — Crear una nueva reserva
router.post(
  "/",
  validarPayload(validarCrearReserva),
  crearReserva
);

// DELETE /api/reservas/:id — Cancelar una reserva propia
router.delete("/:id", cancelarReserva);

// GET /api/reservas/vivas — Obtiene todas las reservas (solo gerentes)
router.get("/vivas", reservasVivas);

module.exports = router;
