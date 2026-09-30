import os

from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker, declarative_base


# Define la ubicacion de la base de datos
DB_PATH = os.getenv("DATABASE_PATH", "/data/database.db")

# Crea la URL de conexion utilizando SQLite
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"


# Crea el motor encargado de conectar la aplicacion con la base de datos
engine = create_engine(

    SQLALCHEMY_DATABASE_URL,

    # Permite utilizar la base de datos desde diferentes hilos
    connect_args={"check_same_thread": False},

)


# Configura las sesiones que utilizara la aplicacion para interactuar con la base de datos
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Clase base utilizada para definir los modelos de la base de datos
Base = declarative_base()


# Crea y administra una sesion de base de datos para cada solicitud
def get_db():

    db = SessionLocal()

    try:

        # Proporciona la sesion para realizar operaciones en la base de datos
        yield db

    finally:

        # Cierra la sesion al finalizar la solicitud
        db.close()