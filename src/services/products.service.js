import productsRepository from "../repositories/products.repository.js";
import { PRODUCT_STATUS } from "../constants/index.js";
import { createHttpError } from "../utils/httpError.js";
import { isFilledString, isValidId, toNumber } from "../utils/validators.js";

// El Service tiene la lógica de negocio: validaciones y reglas.
// No conoce Express (req/res) ni Mongoose: habla con el Repository.

// Campos que se pueden enviar al crear o editar. El estado NO está: lo calcula el service.
const EDITABLE_FIELDS = ["name", "description", "price", "stock"];

// Regla de negocio: el estado depende del stock
const getStatusFromStock = (stock) =>
  stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;

// Valida los campos enviados y devuelve solo los permitidos, ya convertidos.
// isCreation = true exige los obligatorios; en una edición solo se validan los enviados.
const validateProductFields = (body, isCreation) => {
  const data = {};

  if (body.name !== undefined || isCreation) {
    if (!isFilledString(body.name)) {
      throw createHttpError(400, "El nombre es obligatorio");
    }
    data.name = body.name.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      throw createHttpError(400, "La descripción debe ser un texto");
    }
    data.description = body.description.trim();
  }

  if (body.price !== undefined || isCreation) {
    const price = toNumber(body.price);
    if (!Number.isFinite(price) || price < 0) {
      throw createHttpError(400, "El precio debe ser un número mayor o igual a 0");
    }
    data.price = price;
  }

  if (body.stock !== undefined || isCreation) {
    const stock = toNumber(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw createHttpError(400, "El stock debe ser un número entero mayor o igual a 0");
    }
    data.stock = stock;
    data.status = getStatusFromStock(stock);
  }

  return data;
};

const checkValidId = (id) => {
  if (!isValidId(id)) {
    throw createHttpError(400, "El id del producto no es válido");
  }
};

export const getProducts = async () => {
  // Regla de negocio: el listado solo muestra productos con stock disponible.
  // El service decide QUÉ mostrar; el repository sabe CÓMO buscarlo.
  return await productsRepository.getAll({ status: PRODUCT_STATUS.AVAILABLE });
};

export const getProductById = async (id) => {
  checkValidId(id);

  const product = await productsRepository.getById(id);
  if (!product) {
    throw createHttpError(404, "Producto no encontrado");
  }
  return product;
};

export const createProduct = async (body) => {
  const data = validateProductFields(body, true);
  return await productsRepository.create(data);
};

export const updateProduct = async (id, body) => {
  // Verifica el id y que el producto exista antes de modificarlo
  await getProductById(id);

  const data = validateProductFields(body, false);
  if (Object.keys(data).length === 0) {
    throw createHttpError(400, `No se enviaron campos para actualizar (${EDITABLE_FIELDS.join(", ")})`);
  }

  return await productsRepository.update(id, data);
};

export const deleteProduct = async (id) => {
  await getProductById(id);
  return await productsRepository.delete(id);
};
