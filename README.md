# ShipNow API

API REST de ShipNow para gestionar **productos** y **usuarios**.

**Pre-entrega Módulo 1 — Estructura profesional.** La API está organizada en una arquitectura de 3 capas (Controller → Service → Repository) y tiene una configuración de entorno que se valida al arrancar.

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Cómo correr el proyecto localmente](#cómo-correr-el-proyecto-localmente)
3. [Variables de entorno](#variables-de-entorno)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Arquitectura por capas](#arquitectura-por-capas)
6. [Por qué separé la lógica entre Service y Repository](#por-qué-separé-la-lógica-entre-service-y-repository)
7. [Constantes del dominio](#constantes-del-dominio)
8. [Endpoints](#endpoints)
9. [Ejemplos de uso](#ejemplos-de-uso)
10. [Checklist de la consigna](#checklist-de-la-consigna)

---

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| **Node.js** (ESM) | Entorno de ejecución. Todo el proyecto usa `import` / `export` |
| **Express** | Servidor HTTP y rutas |
| **MongoDB + Mongoose** | Base de datos y modelado de los datos |
| **dotenv** | Carga las variables de entorno desde el archivo `.env` |

---

## Cómo correr el proyecto localmente

Requisitos: Node.js 18 o superior y una base MongoDB (local o MongoDB Atlas).

```bash
# 1. Clonar el repositorio e instalar dependencias
git clone <url-del-repositorio>
cd shipnow
npm install

# 2. Crear el archivo .env a partir del ejemplo
cp .env.example .env
# (en Windows: copy .env.example .env)

# 3. Completar los valores en .env (ver sección siguiente)

# 4. Levantar el servidor
npm start          # modo normal
npm run dev        # se reinicia solo al guardar cambios
```

Si todo salió bien, la consola muestra:

```
Conexión a MongoDB establecida
ShipNow (development) escuchando en http://localhost:8080
```

---

## Variables de entorno

El archivo `.env` **no está en el repositorio** (está en `.gitignore`). El archivo `.env.example` muestra qué claves hay que completar:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `8080` |
| `MONGODB_URI` | URL de conexión a MongoDB | `mongodb://localhost:27017/shipnow` |
| `NODE_ENV` | Entorno: `development`, `production` o `test` | `development` |

Las tres se validan **al arrancar** (`src/config/env.config.js`). Si falta alguna, o tiene un valor inválido, la app no arranca y muestra un error que explica qué corregir:

```
Error: Faltan variables de entorno obligatorias: MONGODB_URI. Revisá tu archivo .env (podés copiar .env.example como punto de partida).
```

`process.env` se lee **únicamente** en ese archivo. El resto del proyecto importa el objeto `config`.

---

## Estructura del proyecto

```
shipnow/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── server.js                 # Valida config, conecta a la DB y levanta el servidor
    ├── app.js                    # Configura Express y registra las rutas
    ├── config/
    │   ├── env.config.js         # Carga y valida las variables de entorno
    │   ├── index.js              # Re-exporta env.config.js
    │   └── db.js                 # Conexión a MongoDB
    ├── constants/
    │   └── index.js              # Roles y estados (Object.freeze)
    ├── routes/                   # Solo conectan path → método del Controller
    │   ├── products.router.js
    │   └── users.router.js
    ├── controllers/              # Manejan req y res
    │   ├── products.controller.js
    │   └── users.controller.js
    ├── services/                 # Lógica de negocio
    │   ├── products.service.js
    │   └── users.service.js
    ├── repositories/             # Único lugar que conoce Mongoose
    │   ├── products.repository.js
    │   └── users.repository.js
    ├── models/                   # Solo los esquemas
    │   ├── Product.js
    │   └── User.js
    ├── middlewares/
    │   └── error.middleware.js   # Respuestas de error y ruta inexistente
    └── utils/
        ├── constants.js          # Re-exporta constants/index.js
        ├── httpError.js
        └── validators.js
```

---

## Arquitectura por capas

Cada petición atraviesa las capas siempre en el mismo sentido:

```
Cliente → Router → Controller → Service → Repository → MongoDB
```

| Capa | Qué hace | Qué NO hace |
|---|---|---|
| **Router** | Conecta un path y un método HTTP con una función del Controller | No tiene lógica |
| **Controller** | Lee `req`, llama al Service y responde con el status code correcto | No valida reglas, no importa Mongoose |
| **Service** | Valida datos y aplica las reglas de negocio | No conoce `req`/`res` ni Mongoose |
| **Repository** | Busca y guarda datos en MongoDB (filtros, orden y campos por defecto) | No decide reglas de negocio |
| **Model** | Define el esquema de la colección | No tiene lógica |

---

## Por qué separé la lógica entre Service y Repository

La regla que usé es: **el Service decide *qué* se necesita y el Repository sabe *cómo* conseguirlo.**

- **Productos con stock.** El listado público solo muestra productos disponibles. Esa es una *regla de negocio*, así que la decide el Service (`getProducts` pide `status: AVAILABLE`). El Repository solo traduce ese pedido a una consulta de MongoDB, y además aplica por defecto el orden (más nuevos primero) y oculta el campo interno `__v`.
- **Estado según stock.** Si el stock es 0, el producto pasa a `OUT_OF_STOCK`. Ese cálculo está en el Service; el Repository simplemente guarda lo que le llega.
- **Email único.** Que no se repitan los emails es una regla de negocio: el Service consulta `getByEmail` y responde 409 si ya existe. El Repository solo hace la búsqueda.

**Beneficio:** si mañana se cambia MongoDB por otra base, solo se reescribe el Repository. Y si cambia una regla de negocio, solo se toca el Service. El Controller no se entera de ninguno de los dos cambios.

---

## Constantes del dominio

Están en `src/constants/index.js`, congeladas con `Object.freeze` para que nadie las modifique:

```js
USER_ROLES      = { ADMIN: "admin", USER: "user" }
PRODUCT_STATUS  = { AVAILABLE: "available", OUT_OF_STOCK: "out_of_stock" }
```

Se usan en los modelos (`enum`) y en los services, en lugar de escribir strings sueltos.

---

## Endpoints

### Productos — `/api/products`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista los productos **con stock** (disponibles) |
| GET | `/api/products/:id` | Devuelve un producto (tenga o no stock) |
| POST | `/api/products` | Crea un producto |
| PUT | `/api/products/:id` | Edita los campos enviados |
| DELETE | `/api/products/:id` | Elimina un producto |

Body para crear: `name` (obligatorio), `price` (obligatorio, ≥ 0), `stock` (obligatorio, entero ≥ 0), `description` (opcional). El `status` no se envía: se calcula según el stock.

### Usuarios — `/api/users`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Lista los usuarios |
| GET | `/api/users/:id` | Devuelve un usuario |
| POST | `/api/users` | Crea un usuario |
| PUT | `/api/users/:id` | Edita los campos enviados |
| DELETE | `/api/users/:id` | Elimina un usuario |

Body para crear: `first_name`, `last_name`, `email` (obligatorios) y `role` (opcional: `admin` o `user`, por defecto `user`).

### Respuestas

Éxito: `{ "status": "success", "payload": ... }`
Error: `{ "status": "error", "message": "..." }` con el código HTTP correspondiente (400, 404, 409, 500).

---

## Ejemplos de uso

```bash
# Crear un producto
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Caja chica","description":"Caja de cartón 20x20","price":1500,"stock":10}'

# Listar productos con stock
curl http://localhost:8080/api/products

# Dejar un producto sin stock (pasa a out_of_stock y desaparece del listado)
curl -X PUT http://localhost:8080/api/products/<id> \
  -H "Content-Type: application/json" \
  -d '{"stock":0}'

# Crear un usuario administrador
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Pérez","email":"ana@mail.com","role":"admin"}'
```

---

## Checklist de la consigna

- [x] Carpetas `controllers/`, `services/`, `repositories/`, `models/` y `config/`
- [x] Flujo Controller → Service → Repository; el Controller no importa Mongoose
- [x] Repository con acceso encapsulado (filtros, orden y proyección por defecto), sin lógica de negocio
- [x] Entidades refactorizadas: Products y Users
- [x] Routers mínimos: solo conectan path con método del Controller
- [x] `.env` fuera del repositorio y `.env.example` incluido
- [x] `src/config/env.config.js` valida `PORT`, `MONGODB_URI` y `NODE_ENV`; si falta una, la app no arranca y explica por qué
- [x] `process.env` solo se usa en el archivo de configuración
- [x] `src/constants/index.js` con `Object.freeze`: roles y estados de producto
- [x] Sin strings mágicos para roles y estados
- [x] Modelos que solo definen el esquema
