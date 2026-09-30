import os


# Clave secreta utilizada para firmar y validar los tokens JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cambia-esta-clave-en-produccion")

# Algoritmo utilizado para generar y validar los tokens JWT
ALGORITHM = "HS256"

# Tiempo de expiracion de los tokens de acceso en minutos
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480")
)


# Configuracion del servidor SMTP para el envio de correos
SMTP_HOST = os.getenv("SMTP_HOST", "")

# Puerto utilizado por el servidor SMTP
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

# Usuario utilizado para autenticarse en el servidor SMTP
SMTP_USER = os.getenv("SMTP_USER", "")

# Contrasena utilizada para autenticarse en el servidor SMTP
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

# Direccion de correo utilizada como remitente
SMTP_FROM = os.getenv("SMTP_FROM", "no-reply@clinica.local")

# Indica si se utilizara TLS para proteger la conexion SMTP
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


# Directorio donde se almacenan los archivos subidos al sistema
UPLOADS_DIR = os.getenv("UPLOADS_DIR", "/data/uploads")