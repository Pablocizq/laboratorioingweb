if (!process.env.JWT_SECRET) {
  throw new Error("[Gateway] JWT_SECRET no está definido.");
}

module.exports = {
  secreto: process.env.JWT_SECRET,
  expiracion: process.env.JWT_EXPIRES_IN || "6h",
};
