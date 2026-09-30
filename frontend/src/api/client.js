// Define la URL base de la API
// Al estar vacia, las solicitudes utilizan la misma direccion del frontend
const BASE_URL = "";

// Obtiene el token de autenticacion almacenado en el navegador
function getToken() {
  return localStorage.getItem("medisys_token");
}

// Guarda o elimina el token de autenticacion
export function setToken(token) {
  // Si existe un token, lo guarda en el almacenamiento local
  if (token) localStorage.setItem("medisys_token", token);

  // Si no existe un token, elimina el token almacenado
  else localStorage.removeItem("medisys_token");
}

// Funcion general para realizar solicitudes HTTP a la API
async function request(path, { method = "GET", body, isForm = false } = {}) {
  // Crea los encabezados que se enviaran en la solicitud
  const headers = {};

  // Obtiene el token de autenticacion
  const token = getToken();

  // Si existe un token, lo envia mediante el encabezado Authorization
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Agrega el encabezado JSON cuando el cuerpo no es un FormData
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  // Realiza la solicitud al servidor
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,

    // Convierte los datos a JSON cuando corresponde
    // Si es FormData, lo envia directamente
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Variable donde se almacenara la respuesta procesada
  let data = null;

  // Obtiene el contenido de la respuesta como texto
  const text = await res.text();

  // Intenta convertir la respuesta de texto a un objeto JSON
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Si la respuesta no es JSON, conserva el contenido como texto
    data = text;
  }

  // Verifica si la solicitud termino con un error HTTP
  if (!res.ok) {
    // Obtiene el mensaje de error enviado por la API
    // Si no existe, utiliza el codigo de estado HTTP
    const message =
      (data && (data.detail || data.message)) || `Error ${res.status}`;

    // Lanza el error para que pueda ser manejado por el codigo que realizo la solicitud
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  // Devuelve los datos obtenidos de la API
  return data;
}

// Objeto que proporciona funciones para realizar las operaciones HTTP principales
export const api = {
  // Realiza una solicitud GET
  get: (path) => request(path),

  // Realiza una solicitud POST enviando datos
  post: (path, body) => request(path, { method: "POST", body }),

  // Realiza una solicitud PUT para actualizar datos
  put: (path, body) => request(path, { method: "PUT", body }),

  // Realiza una solicitud PATCH para actualizar parcialmente datos
  patch: (path, body) => request(path, { method: "PATCH", body }),

  // Realiza una solicitud DELETE
  delete: (path) => request(path, { method: "DELETE" }),

  // Realiza una solicitud POST utilizando FormData
  // Se utiliza principalmente para enviar archivos
  postForm: (path, formData) =>
    request(path, { method: "POST", body: formData, isForm: true }),
};