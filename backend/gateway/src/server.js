const express = require("express");

const app  = express();
const PORT = process.env.GATEWAY_PORT || 3000;

app.use(express.json());

// Verificamos el estado del servicio
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

// Iniciamos el servidor HTTP
app.listen(PORT, () => {
  console.log(`[Gateway] Escuchando en puerto ${PORT}`);
});
