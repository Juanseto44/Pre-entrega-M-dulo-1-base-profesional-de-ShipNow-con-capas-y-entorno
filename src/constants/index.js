// Valores fijos del dominio de ShipNow.
// Object.freeze evita que alguien los modifique por error mientras corre la app.
// Se usan en lugar de escribir strings sueltos ("admin", "available") por todo el código.

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user"
});

export const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: "available",
  OUT_OF_STOCK: "out_of_stock"
});

// Listas de valores permitidos (las usan los modelos para el enum y los services para validar)
export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));
export const PRODUCT_STATUS_VALUES = Object.freeze(Object.values(PRODUCT_STATUS));
