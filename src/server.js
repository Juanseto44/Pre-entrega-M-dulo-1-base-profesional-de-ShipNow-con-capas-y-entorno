// Al importar config se validan las variables de entorno:
// si falta alguna, se lanza un error descriptivo y la app NO arranca.
import config from "./config/env.config.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const startServer = async () => {
  try {
    // Primero la base de datos: si falla, el servidor no arranca
    await connectDB();

    app.listen(config.port, () => {
      console.log(`ShipNow (${config.nodeEnv}) escuchando en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
};

startServer();
