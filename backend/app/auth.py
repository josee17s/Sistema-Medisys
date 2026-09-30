from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from . import config

# Configura el sistema para encriptar las contrasenas usando bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Genera un hash seguro de la contrasena
def hash_password(password: str) -> str:

    return pwd_context.hash(password)

# Verifica si la contrasena ingresada coincide con el hash almacenado
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Genera un token JWT para autenticar al usuario
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # Crea una copia de los datos que se incluiran en el token
    to_encode = data.copy()
    # Define la fecha de expiracion del token
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # Agrega la fecha de expiracion a los datos del token
    to_encode.update({"exp": expire})

    # Codifica y firma el token usando la clave secreta y el algoritmo configurado
    return jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)

# Decodifica y valida un token JWT
def decode_access_token(token: str) -> Optional[dict]:
    try:
        # Verifica el token y obtiene los datos almacenados en el
        return jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    except JWTError:
        # Retorna None si el token es invalido o no puede ser decodificado
        return None