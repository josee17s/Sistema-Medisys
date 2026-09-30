# Importaciones necesarias para generar códigos, manejar fechas,
# rutas, autenticación y conexión con la base de datos.
import random
from datetime import timedelta
from ..models import now_mexico

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..audit import log_action
from .. import models, schemas
from ..auth import create_access_token, hash_password, verify_password
from ..database import get_db
from ..deps import get_current_user
from ..mailer import send_otp_email


# Router para las funciones de autenticación del sistema.
router = APIRouter(prefix="/api/auth", tags=["auth"])


# Registra una acción realizada por un usuario en el sistema.
def _log(db, user_id, correo, accion, request):
    user = db.query(models.User).filter(models.User.id == user_id).first() if user_id else None
    log_action(db, request, accion, user=user, correo=correo)


# Registra un nuevo especialista en el sistema.
# Verifica que el correo y matrícula no estén registrados
# y que la especialidad seleccionada sea válida.
@router.post("/register", response_model=schemas.UserOut)
def register_specialist(
    payload: schemas.SpecialistRegister, db: Session = Depends(get_db)
):
    # Verifica que no exista otro usuario con el mismo correo o matrícula.
    existing = (
        db.query(models.User)
        .filter(
            (models.User.correo == payload.correo)
            | (models.User.matricula == payload.matricula)
        )
        .first()
    )

    if existing:
        raise HTTPException(400, "Ya existe un usuario con ese correo o matrícula")

    # Verifica que la especialidad exista y esté activa.
    specialty = (
        db.query(models.Specialty)
        .filter(
            models.Specialty.id == payload.specialty_id,
            models.Specialty.is_active == True,  # noqa: E712
        )
        .first()
    )

    if not specialty:
        raise HTTPException(400, "Especialidad inválida")

    # Crea el usuario especialista con la contraseña cifrada.
    user = models.User(
        nombre=payload.nombre,
        apellido_paterno=payload.apellido_paterno,
        apellido_materno=payload.apellido_materno,
        correo=payload.correo,
        matricula=payload.matricula,
        password_hash=hash_password(payload.password),
        role=models.RoleEnum.specialist,
        specialty_id=specialty.id,
        is_active=True,
        is_approved=False,
    )

    # Guarda el nuevo usuario en la base de datos.
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# Autentica a un usuario mediante su correo o matrícula y contraseña.
# Genera un token de acceso si las credenciales son correctas.
@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):

    # Busca al usuario mediante su correo o matrícula.
    user = (
        db.query(models.User)
        .filter(
            (models.User.correo == payload.identificador)
            | (models.User.matricula == payload.identificador)
        )
        .first()
    )

    # Verifica que el usuario exista y que la contraseña sea correcta.
    if not user or not verify_password(payload.password, user.password_hash):
        _log(db, user.id if user else None, payload.identificador, "LOGIN_FAIL", request)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")

    # Verifica que la cuenta se encuentre activa.
    if not user.is_active:
        _log(db, user.id, payload.identificador, "LOGIN_FAIL_INACTIVE", request)
        raise HTTPException(403, "Tu cuenta ha sido desactivada. Contacta al administrador.")

    # Los especialistas deben ser aprobados por un administrador
    # antes de poder iniciar sesión.
    if user.role == models.RoleEnum.specialist and not user.is_approved:
        _log(db, user.id, payload.identificador, "LOGIN_FAILD_PENDING", request)
        raise HTTPException(
            403, "Tu registro está pendiente de aprobación por el administrador."
        )

    # Genera el token de acceso para el usuario autenticado.
    token = create_access_token({"sub": user.id, "role": user.role.value})

    # Registra el inicio de sesión en la auditoría.
    _log(db, user.id, payload.identificador, "LOGIN", request)

    return {"access_token": token, "user": user}


# Cierra la sesión del usuario actual y registra la acción en la auditoría.
@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    _log(db, user.id, user.correo, "LOGOUT", request)
    return {"detail": "sesión cerrada"}


# Obtiene la información del usuario actualmente autenticado.
@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


# Actualiza los datos del perfil del usuario autenticado.
# También verifica que el correo y matrícula no estén registrados
# por otro usuario.
@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.SpecialistProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):

    # Verifica que la matrícula no pertenezca a otro usuario.
    existing_matricula = (
        db.query(models.User)
        .filter(
            models.User.matricula == payload.matricula,
            models.User.id != user.id,
        )
        .first()
    )

    if existing_matricula:
        raise HTTPException(
            status_code=409,
            detail="Ya existe otro usuario con esa matrícula.",
        )

    # Verifica que el correo no pertenezca a otro usuario.
    existing_correo = (
        db.query(models.User)
        .filter(
            models.User.correo == payload.correo,
            models.User.id != user.id,
        )
        .first()
    )

    if existing_correo:
        raise HTTPException(
            status_code=409,
            detail="Ya existe otro usuario con ese correo.",
        )

    # Actualiza los datos personales del usuario.
    user.nombre = payload.nombre
    user.apellido_paterno = payload.apellido_paterno
    user.apellido_materno = payload.apellido_materno
    user.matricula = payload.matricula
    user.correo = payload.correo

    # Actualiza la contraseña únicamente si se proporciona una nueva.
    if payload.password:
        user.password_hash = hash_password(payload.password)

    # Guarda los cambios realizados.
    db.commit()
    db.refresh(user)

    # Registra la actualización del perfil en la auditoría.
    log_action(
        db,
        request,
        "UPDATE_PROFILE",
        user=user,
        correo=user.correo,
    )

    return user


# Inicia el proceso de recuperación de contraseña.
# Genera un código OTP y lo envía al correo registrado.
@router.post("/forgot-password")
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    # Busca al usuario mediante su correo.
    user = db.query(models.User).filter(
        models.User.correo == payload.correo
    ).first()

    # Mensaje genérico para no revelar si el correo está registrado.
    generic = {
        "detail": "Si el correo existe, se ha enviado un código de verificación."
    }

    if not user:
        return generic

    # Invalida códigos OTP anteriores que aún no hayan sido utilizados.
    db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.user_id == user.id,
        models.PasswordResetOTP.used == False,  # noqa: E712
    ).update(
        {"used": True},
        synchronize_session=False,
    )

    # Genera un código OTP de seis dígitos.
    code = f"{random.randint(0, 999999):06d}"

    # Crea un nuevo código con una duración de 15 minutos.
    otp = models.PasswordResetOTP(
        user_id=user.id,
        code=code,
        expires_at=now_mexico() + timedelta(minutes=15),
        used=False,
    )

    # Guarda el código y lo envía al correo del usuario.
    db.add(otp)
    db.commit()
    send_otp_email(user.correo, code)

    return generic


# Restablece la contraseña utilizando un código OTP válido.
@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):

    # Busca al usuario mediante su correo.
    user = db.query(models.User).filter(
        models.User.correo == payload.correo
    ).first()

    if not user:
        raise HTTPException(400, "Código inválido o expirado")

    # Busca el código OTP más reciente que coincida
    # y que todavía no haya sido utilizado.
    otp = (
        db.query(models.PasswordResetOTP)
        .filter(
            models.PasswordResetOTP.user_id == user.id,
            models.PasswordResetOTP.code == payload.code,
            models.PasswordResetOTP.used == False,  # noqa: E712
        )
        .order_by(models.PasswordResetOTP.created_at.desc())
        .first()
    )

    # Verifica que el código exista y que no haya expirado.
    if not otp or otp.expires_at < now_mexico():
        raise HTTPException(400, "Código inválido o expirado")

    # Actualiza la contraseña y marca el código OTP como utilizado.
    user.password_hash = hash_password(payload.new_password)
    otp.used = True

    # Guarda los cambios en la base de datos.
    db.commit()

    return {"detail": "Contraseña actualizada correctamente"}