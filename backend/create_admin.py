import os
import sys

# Agrega el directorio actual al PATH para poder importar los modulos de la aplicacion
sys.path.insert(0, os.path.dirname(__file__))

from app.auth import hash_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app import models  # noqa: E402


# Solicita un dato al usuario o lo obtiene desde una variable de entorno
def prompt(label, default=None, secret=False):
    # Relaciona cada campo con su variable de entorno correspondiente
    env_map = {
        "Nombre(s)": "ADMIN_NOMBRE",
        "Apellido paterno": "ADMIN_APELLIDO_PATERNO",
        "Apellido materno": "ADMIN_APELLIDO_MATERNO",
        "Correo": "ADMIN_CORREO",
        "Matrícula": "ADMIN_MATRICULA",
        "Contraseña": "ADMIN_PASSWORD",
    }

    # Obtiene el nombre de la variable de entorno asociada al campo
    env_var = env_map.get(label)

    # Si existe la variable de entorno y tiene un valor, utiliza ese valor
    if env_var and os.getenv(env_var):
        return os.getenv(env_var)

    # Verifica si el programa se esta ejecutando sin entrada interactiva
    if not sys.stdin.isatty():
        # Utiliza el valor predeterminado si fue proporcionado
        if default is not None:
            return default

        # Detiene el programa si falta una variable necesaria
        raise SystemExit(
            f"Falta la variable de entorno {env_var} en modo no interactivo."
        )

    # Importa getpass para ocultar la contraseña al escribirla
    import getpass

    # Solicita la contraseña sin mostrar los caracteres en pantalla
    if secret:
        val = getpass.getpass(f"{label}: ")
    else:
        # Solicita el dato mostrando el valor predeterminado cuando existe
        val = input(f"{label}{' [' + default + ']' if default else ''}: ").strip()

    # Devuelve el valor ingresado o el valor predeterminado
    return val or default


# Funcion principal encargada de crear o actualizar el administrador
def main():
    # Crea las tablas de la base de datos si todavia no existen
    Base.metadata.create_all(bind=engine)

    # Crea una sesion para interactuar con la base de datos
    db = SessionLocal()

    try:
        # Muestra el titulo del proceso en la consola
        print("=== Creación del usuario Administrador ===")

        # Solicita los datos del administrador
        nombre = prompt("Nombre(s)")
        apellido_paterno = prompt("Apellido paterno")
        apellido_materno = prompt("Apellido materno", default="")
        correo = prompt("Correo")
        matricula = prompt("Matrícula")
        password = prompt("Contraseña", secret=True)

        # Verifica que todos los campos obligatorios tengan un valor
        if not all([nombre, apellido_paterno, correo, matricula, password]):
            print("Todos los campos obligatorios deben tener valor. Cancelado.")
            return

        # Busca si ya existe un usuario con el mismo correo o matricula
        existing = (
            db.query(models.User)
            .filter(
                (models.User.correo == correo) | (models.User.matricula == matricula)
            )
            .first()
        )

        # Si el usuario ya existe, lo convierte en administrador
        if existing:
            # Actualiza la contraseña utilizando un hash seguro
            existing.password_hash = hash_password(password)

            # Asigna el rol de administrador
            existing.role = models.RoleEnum.admin

            # Activa la cuenta
            existing.is_active = True

            # Marca la cuenta como aprobada
            existing.is_approved = True

            # Guarda los cambios realizados en la base de datos
            db.commit()

            # Informa que el usuario existente fue actualizado
            print(f"Usuario existente actualizado a ADMIN: {existing.correo}")
            return

        # Crea un nuevo usuario con permisos de administrador
        admin_user = models.User(
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno or None,
            correo=correo,
            matricula=matricula,
            password_hash=hash_password(password),
            role=models.RoleEnum.admin,
            is_active=True,
            is_approved=True,
        )

        # Agrega el nuevo administrador a la sesion
        db.add(admin_user)

        # Guarda el nuevo administrador en la base de datos
        db.commit()

        # Confirma en consola que el administrador fue creado correctamente
        print(f"Administrador creado correctamente: {correo} / matrícula {matricula}")

    finally:
        # Cierra la conexion con la base de datos al finalizar el proceso
        db.close()


# Ejecuta la funcion principal solamente cuando el archivo se ejecuta directamente
if __name__ == "__main__":
    main()