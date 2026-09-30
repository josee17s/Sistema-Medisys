from fastapi import Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.orm import Session

from . import models

from .auth import decode_access_token

from .database import get_db


# Configura el esquema de autenticacion mediante tokens Bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# Obtiene y valida al usuario autenticado actualmente
def get_current_user(

    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)

) -> models.User:

    # Define la respuesta para credenciales invalidas
    credentials_exception = HTTPException(

        status_code=status.HTTP_401_UNAUTHORIZED,

        detail="No se pudo validar la credencial",

        headers={"WWW-Authenticate": "Bearer"},

    )

    # Decodifica y valida el token de acceso
    payload = decode_access_token(token)

    if payload is None:

        raise credentials_exception

    # Obtiene el identificador del usuario almacenado en el token
    user_id = payload.get("sub")

    if user_id is None:

        raise credentials_exception

    # Busca al usuario correspondiente en la base de datos
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:

        raise credentials_exception

    # Verifica que la cuenta del usuario se encuentre activa
    if not user.is_active:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Tu cuenta ha sido desactivada. Contacta al administrador.",

        )

    # Verifica que los especialistas hayan sido aprobados por un administrador
    if user.role == models.RoleEnum.specialist and not user.is_approved:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Tu cuenta aún no ha sido aprobada por el administrador.",

        )

    # Devuelve el usuario autenticado
    return user


# Verifica que el usuario tenga permisos de administrador
def require_admin(user: models.User = Depends(get_current_user)) -> models.User:

    if user.role != models.RoleEnum.admin:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Se requieren privilegios de administrador",

        )

    return user


# Verifica que el usuario tenga permisos de especialista
def require_specialist(user: models.User = Depends(get_current_user)) -> models.User:

    if user.role != models.RoleEnum.specialist:

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Se requiere una cuenta de especialista",

        )

    return user