const express = require("express");
const validarPayload = require("../middlewares/validar-payload");
const { validarCrearReserva } = require("../dtos/validar-crear-reserva");
const { crearReserva } = require("../controllers/reservas.controller");

const router = express.Router();

router.post(
  "/",
  validarPayload(validarCrearReserva),
  crearReserva
);

module.exports = router;
