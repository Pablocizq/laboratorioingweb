const express = require("express");

const app  = express();
const PORT = process.env.GATEWAY_PORT || 3000;

app.use(express.json());

const { conectarRabbit } = require("./messaging/broker-connection");
const espaciosRoutes = require("./routes/espacios.routes");

// Rutas del Gateway
app.use("/api/espacios", espaciosRoutes);

// Verificamos el estado del servicio
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

// Arrancamos dependencias y luego el servidor HTTP
async function arrancarGateway() {
  try {
    await conectarRabbit();
    app.listen(PORT, () => {
      console.log(`[Gateway] Escuchando en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("[Gateway] Error de inicio:", error);
    process.exit(1);
  }
}

arrancarGateway();
