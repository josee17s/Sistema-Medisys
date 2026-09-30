# MediSys

Sistema web para la gestión de información clínica, diseñado para centralizar la administración de especialistas, pacientes y expedientes clínicos en un entorno de red local.

MediSys utiliza una arquitectura cliente-servidor compuesta por un frontend desarrollado con React y un backend basado en FastAPI. La aplicación utiliza SQLite para el almacenamiento de información y Docker Compose para facilitar su instalación y ejecución.

## Descripción

El sistema permite administrar diferentes áreas relacionadas con la atención clínica mediante usuarios con distintos niveles de acceso.

Entre sus principales funciones se encuentran:

* Autenticación y control de acceso de usuarios.
* Registro y administración de especialistas.
* Gestión de solicitudes de registro de especialistas.
* Administración de pacientes.
* Registro y consulta de información clínica.
* Expedientes clínicos organizados por especialidad.
* Gestión de información para Medicina, Odontología, Psicología, Fisioterapia y Nutrición.
* Búsqueda de pacientes.
* Generación de expedientes unificados para consulta e impresión.
* Recuperación de contraseña mediante código OTP.
* Registro de actividades del sistema.
* Persistencia de información mediante SQLite.
* Almacenamiento de archivos clínicos.
* Ejecución mediante contenedores Docker.

## Tecnologías utilizadas

### Frontend

* React 18
* Vite
* React Router
* Tailwind CSS
* Lucide React

### Backend

* Python 3.11
* FastAPI
* Uvicorn
* SQLAlchemy
* Pydantic
* Python-Jose
* Passlib
* Bcrypt
* Python-Multipart

### Base de datos

* SQLite
* SQLAlchemy ORM

### Infraestructura

* Docker
* Docker Compose
* Nginx
* Red Docker interna

## Arquitectura

El proyecto está dividido en dos componentes principales:

```text
MediSys
│
├── frontend/
│   └── Aplicación web React
│
├── backend/
│   └── API REST con FastAPI
│
├── data/
│   ├── database.db
│   └── uploads/
│
├── docker-compose.yml
├── .env.example
└── .gitignore
```

El frontend se ejecuta mediante un servidor Nginx y se comunica con la API REST proporcionada por el backend. El backend utiliza SQLAlchemy para interactuar con SQLite y mantiene los datos persistentes en el directorio `data`.

## Roles del sistema

MediSys utiliza diferentes niveles de acceso para controlar las operaciones disponibles dentro de la aplicación.

### Administrador

El administrador tiene funciones de gestión general del sistema, entre ellas:

* Administrar especialistas.
* Revisar solicitudes de registro.
* Aprobar o rechazar especialistas.
* Dar de baja especialistas.
* Gestionar el acceso al sistema.

### Especialista

Los especialistas pueden acceder al sistema una vez que su registro ha sido aprobado.

Dependiendo de su especialidad, pueden gestionar la información correspondiente a:

* Medicina
* Odontología
* Psicología
* Fisioterapia
* Nutrición

Entre sus funciones se encuentra el registro de pacientes y la gestión de sus notas e información clínica.

## Autenticación

El backend implementa autenticación mediante tokens JWT.

La configuración permite establecer el tiempo de expiración de los tokens mediante la variable:

```env
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

La clave utilizada para firmar los tokens se configura mediante:

```env
JWT_SECRET_KEY=tu_clave_secreta
```

Para una instalación real se recomienda utilizar una clave aleatoria y mantenerla fuera del código fuente.

## Recuperación de contraseña

El sistema incluye un mecanismo de recuperación de contraseña mediante códigos OTP.

El código puede enviarse mediante un servidor SMTP configurado en las variables de entorno:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=no-reply@clinica.local
SMTP_USE_TLS=true
```

Durante pruebas, el sistema puede funcionar sin un servidor SMTP configurado, registrando el código generado en los logs del backend.

## Persistencia de datos

La aplicación utiliza SQLite como sistema de base de datos.

Docker Compose monta el directorio:

```text
./data:/data
```

Dentro de este directorio se almacenan:

```text
data/
├── database.db
└── uploads/
```

Esto permite conservar la información y los archivos aunque los contenedores sean detenidos o reconstruidos.

## Ejecución con Docker

### Requisitos

Antes de ejecutar el proyecto es necesario contar con:

* Windows 10/11, Linux o macOS.
* Docker Desktop o Docker Engine.
* Docker Compose.

### 1. Crear el archivo de configuración

En Windows:

```powershell
copy .env.example .env
```

En Linux o macOS:

```bash
cp .env.example .env
```

Editar el archivo `.env` y configurar las variables necesarias.

### 2. Construir y ejecutar el sistema

```bash
docker compose up -d --build
```

Este comando construye las imágenes del frontend y backend y ejecuta los servicios en segundo plano.

### 3. Verificar los contenedores

```bash
docker compose ps
```

Para consultar los registros:

```bash
docker compose logs -f
```

## Creación del administrador

El proyecto incluye un script para crear la cuenta inicial de administrador.

Ejecutar:

```bash
docker compose exec backend python create_admin.py
```

El script solicita los datos necesarios para crear la cuenta administrativa.

## Acceso a la aplicación

Una vez iniciados los contenedores, la aplicación web estará disponible en:

```text
http://localhost/
```

Si el sistema se encuentra instalado en un equipo dentro de una red local, otros dispositivos pueden acceder mediante la dirección IP del equipo servidor:

```text
http://IP_DEL_SERVIDOR/
```

El frontend utiliza el puerto `80`, mientras que el backend expone el puerto `8000`.

## API

El backend está desarrollado con FastAPI y proporciona una API REST para la comunicación con el frontend.

La documentación interactiva de FastAPI está disponible en:

```text
http://localhost:8000/docs
```

También puede consultarse la documentación alternativa en:

```text
http://localhost:8000/redoc
```

## Comandos Docker útiles

Detener los contenedores:

```bash
docker compose down
```

Iniciar nuevamente el sistema:

```bash
docker compose up -d
```

Reconstruir las imágenes después de realizar cambios:

```bash
docker compose up -d --build
```

Consultar los logs del backend:

```bash
docker compose logs -f backend
```

Consultar los logs del frontend:

```bash
docker compose logs -f frontend
```

Revisar el estado de los servicios:

```bash
docker compose ps
```

## Estructura general

```text
medisys/
│
├── backend/
│   ├── Código de la API
│   ├── Modelos de datos
│   ├── Esquemas
│   ├── Rutas
│   ├── Autenticación
│   ├── Servicios
│   ├── Registro de actividades
│   ├── create_admin.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── componentes
│   ├── vistas
│   ├── rutas
│   ├── estilos
│   ├── package.json
│   └── Dockerfile
│
├── data/
│   ├── database.db
│   └── uploads/
│
├── .env.example
├── .gitignore
└── docker-compose.yml
```

## Despliegue en red local

MediSys puede utilizarse dentro de una red local. El equipo donde se ejecutan los contenedores funciona como servidor y los demás equipos pueden acceder mediante la dirección IP de dicho equipo.

El flujo de comunicación es:

```text
Usuario
   |
   v
Navegador web
   |
   v
Frontend React + Nginx
   |
   v
API REST FastAPI
   |
   v
SQLAlchemy
   |
   v
SQLite
```

Docker Compose crea una red interna para permitir la comunicación entre los servicios del sistema.

## Seguridad

Para una instalación de desarrollo o académica se incluyen mecanismos como:

* Autenticación mediante JWT.
* Contraseñas protegidas mediante hashing.
* Control de acceso según el tipo de usuario.
* Variables de entorno para información sensible.
* Separación entre frontend y backend.
* Persistencia controlada de la base de datos y archivos.

Para utilizar el sistema con información real se deben configurar claves secretas seguras, controlar el acceso a la red y establecer una estrategia de respaldos.

## Estado del proyecto

Proyecto académico de desarrollo de software orientado a la gestión de información clínica mediante una aplicación web full stack.
