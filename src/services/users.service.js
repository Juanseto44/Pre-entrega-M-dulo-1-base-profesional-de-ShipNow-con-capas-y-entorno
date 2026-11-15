import usersRepository from "../repositories/users.repository.js";
import { USER_ROLES, USER_ROLE_VALUES } from "../constants/index.js";
import { createHttpError } from "../utils/httpError.js";
import { isFilledString, isValidEmail, isValidId } from "../utils/validators.js";

// El Service tiene la lógica de negocio: validaciones y reglas.
// No conoce Express (req/res) ni Mongoose: habla con el Repository.

const EDITABLE_FIELDS = ["first_name", "last_name", "email", "role"];

// Valida los campos enviados y devuelve solo los permitidos, ya normalizados.
// isCreation = true exige los obligatorios; en una edición solo se validan los enviados.
const validateUserFields = (body, isCreation) => {
  const data = {};

  for (const field of ["first_name", "last_name"]) {
    if (body[field] !== undefined || isCreation) {
      if (!isFilledString(body[field])) {
        throw createHttpError(400, `El campo ${field} es obligatorio`);
      }
      data[field] = body[field].trim();
    }
  }

  if (body.email !== undefined || isCreation) {
    if (!isValidEmail(body.email)) {
      throw createHttpError(400, "El email no es válido");
    }
    data.email = body.email.trim().toLowerCase();
  }

  if (body.role !== undefined) {
    if (!USER_ROLE_VALUES.includes(body.role)) {
      throw createHttpError(400, `El rol debe ser uno de: ${USER_ROLE_VALUES.join(", ")}`);
    }
    data.role = body.role;
  } else if (isCreation) {
    data.role = USER_ROLES.USER; // rol por defecto
  }

  return data;
};

// Regla de negocio: no puede haber dos usuarios con el mismo email.
// `currentUserId` permite que un usuario conserve su propio email al editarse.
const checkEmailAvailable = async (email, currentUserId = null) => {
  const existingUser = await usersRepository.getByEmail(email);
  if (existingUser && existingUser._id.toString() !== currentUserId) {
    throw createHttpError(409, "El email ya está registrado");
  }
};

export const getUsers = async () => {
  return await usersRepository.getAll();
};

export const getUserById = async (id) => {
  if (!isValidId(id)) {
    throw createHttpError(400, "El id del usuario no es válido");
  }

  const user = await usersRepository.getById(id);
  if (!user) {
    throw createHttpError(404, "Usuario no encontrado");
  }
  return user;
};

export const createUser = async (body) => {
  const data = validateUserFields(body, true);
  await checkEmailAvailable(data.email);
  return await usersRepository.create(data);
};

export const updateUser = async (id, body) => {
  // Verifica el id y que el usuario exista antes de modificarlo
  await getUserById(id);

  const data = validateUserFields(body, false);
  if (Object.keys(data).length === 0) {
    throw createHttpError(400, `No se enviaron campos para actualizar (${EDITABLE_FIELDS.join(", ")})`);
  }

  if (data.email) {
    await checkEmailAvailable(data.email, id);
  }

  return await usersRepository.update(id, data);
};

export const deleteUser = async (id) => {
  await getUserById(id);
  return await usersRepository.delete(id);
};
