import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import config, models
from .database import Base, SessionLocal, engine
from .routers import admin, auth, catalogs, patients, records


# Crea las tablas de la base de datos si todavía no existen
Base.metadata.create_all(bind=engine)

# Crea el directorio para almacenar los archivos subidos
os.makedirs(config.UPLOADS_DIR, exist_ok=True)


# Crea las especialidades predeterminadas cuando el catalogo esta vacio
def seed_default_specialties():
    """Crea las 5 especialidades base si el catalogo esta vacio."""

    db = SessionLocal()

    try:

        # Verifica si el catalogo de especialidades esta vacio
        if db.query(models.Specialty).count() == 0:

            # Define las especialidades iniciales del sistema
            defaults = [
                ("Medicina General", models.SpecialtyTypeEnum.medicina),
                ("Odontología", models.SpecialtyTypeEnum.odontologia),
                ("Psicología", models.SpecialtyTypeEnum.psicologia),
                ("Fisioterapia", models.SpecialtyTypeEnum.fisioterapia),
                ("Nutrición", models.SpecialtyTypeEnum.nutricion),
            ]

            # Agrega las especialidades a la base de datos
            for nombre, tipo in defaults:
                db.add(models.Specialty(nombre=nombre, tipo=tipo))

            # Guarda los cambios en la base de datos
            db.commit()

    finally:

        # Cierra la sesion de la base de datos
        db.close()


# Ejecuta la carga inicial de especialidades
seed_default_specialties()


# Crea la aplicacion FastAPI
app = FastAPI(title="Sistema de Gestión Médica para Especialistas")


# Configura CORS para permitir solicitudes desde otros origenes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Permite acceder a los archivos subidos mediante la ruta /uploads
app.mount(
    "/uploads",
    StaticFiles(directory=config.UPLOADS_DIR),
    name="uploads"
)


# Registra las rutas de autenticacion
app.include_router(auth.router)

# Registra las rutas de catalogos
app.include_router(catalogs.router)

# Registra las rutas administrativas
app.include_router(admin.router)

# Registra las rutas relacionadas con pacientes
app.include_router(patients.router)

# Registra las rutas relacionadas con expedientes y registros
app.include_router(records.router)


# Endpoint utilizado para comprobar que la API esta funcionando
@app.get("/api/health")
def health():
    return {"status": "ok"}