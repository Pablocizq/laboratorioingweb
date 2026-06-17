const express = require("express");

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

app.use(express.json());

const { conectarRabbit } = require("./messaging/broker-connection");
const autenticar = require("./middlewares/autenticar");

// Rutas del Gateway
const authRoutes = require("./routes/auth.routes");
const espaciosRoutes = require("./routes/espacios.routes");
const reservasRoutes = require("./routes/reservas.routes");

app.use("/api/auth", authRoutes);
app.use("/api/espacios", espaciosRoutes);
app.use("/api/reservas", autenticar, reservasRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

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
