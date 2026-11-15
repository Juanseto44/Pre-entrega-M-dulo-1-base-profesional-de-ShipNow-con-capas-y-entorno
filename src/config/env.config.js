import dotenv from "dotenv";

// Carga las variables del archivo .env dentro de process.env.
// Este es el UNICO archivo del proyecto que lee process.env: el resto de la
// aplicación importa el objeto `config` que se exporta al final.
dotenv.config();

const REQUIRED_VARS = ["PORT", "MONGODB_URI", "NODE_ENV"];
const VALID_ENVIRONMENTS = ["development", "production", "test"];

const isEmpty = (value) => value === undefined || value.trim() === "";

// Revisa que todas las variables críticas existan y tengan un valor razonable.
// Si algo falla, lanza un error que explica exactamente qué hay que corregir.
const loadConfig = () => {
  const missing = REQUIRED_VARS.filter((name) => isEmpty(process.env[name]));
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(", ")}. ` +
        "Revisá tu archivo .env (podés copiar .env.example como punto de partida)."
    );
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `La variable PORT debe ser un número de puerto válido (1-65535). Valor recibido: "${process.env.PORT}"`
    );
  }

  const nodeEnv = process.env.NODE_ENV.trim();
  if (!VALID_ENVIRONMENTS.includes(nodeEnv)) {
    throw new Error(
      `La variable NODE_ENV debe ser una de: ${VALID_ENVIRONMENTS.join(", ")}. Valor recibido: "${nodeEnv}"`
    );
  }

  // Object.freeze: nadie puede modificar la configuración mientras corre la app
  return Object.freeze({
    port,
    nodeEnv,
    mongodbUri: process.env.MONGODB_URI.trim()
  });
};

// Se valida una sola vez, al importar este archivo (o sea, al arrancar la app)
export const config = loadConfig();

export default config;
