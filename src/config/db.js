import mongoose from "mongoose";
import config from "./env.config.js";

// Conecta la aplicación con MongoDB usando la URI ya validada en config
export const connectDB = async () => {
  await mongoose.connect(config.mongodbUri);
  console.log("Conexión a MongoDB establecida");
};
