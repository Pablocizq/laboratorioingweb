const express    = require("express");
const { login }  = require("../controllers/auth.controller");

const router = express.Router();

// POST /api/auth/login — ruta pública, no requiere token
router.post("/login", login);

module.exports = router;
