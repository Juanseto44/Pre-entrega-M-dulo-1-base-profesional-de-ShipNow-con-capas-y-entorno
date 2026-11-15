import express from "express";
import productsRouter from "./routes/products.router.js";
import usersRouter from "./routes/users.router.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Permite leer el body de las peticiones en formato JSON
app.use(express.json());

// Rutas de la API
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);

// Ruta inexistente y errores: siempre al final
app.use(notFoundHandler);
app.use(errorHandler);

// app.js solo configura Express. El servidor se levanta en server.js
export default app;
