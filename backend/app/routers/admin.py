# Importaciones necesarias para crear las rutas, manejar dependencias,
# errores HTTP, sesiones de base de datos y fechas.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..deps import require_admin
from datetime import datetime


# Router para las funciones administrativas del sistema.
router = APIRouter(prefix="/api/admin", tags=["admin"])


# Obtiene la lista de especialistas registrados.
# Permite filtrar únicamente los que están pendientes de aprobación.
# Solo puede ser utilizado por un administrador.
@router.get("/specialists", response_model=list[schemas.UserOut])
def list_specialists(
    pending_only: bool = False,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Consulta los usuarios que tienen el rol de especialista.
    q = db.query(models.User).filter(models.User.role == models.RoleEnum.specialist)

    # Si se solicita, muestra únicamente especialistas no aprobados.
    if pending_only:
        q = q.filter(models.User.is_approved == False)  # noqa: E712

    # Devuelve los especialistas ordenados del más reciente al más antiguo.
    return q.order_by(models.User.created_at.desc()).all()


# Aprueba o rechaza el registro de un especialista.
# Solo puede ser utilizado por un administrador.
@router.patch("/specialists/{user_id}/approve", response_model=schemas.UserOut)
def approve_specialist(
    user_id: str,
    payload: schemas.UserApprove,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Busca al especialista mediante su ID.
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id, models.User.role == models.RoleEnum.specialist)
        .first()
    )

    # Verifica que el especialista exista.
    if not user:
        raise HTTPException(404, "Especialista no encontrado")

    # Actualiza el estado de aprobación.
    user.is_approved = payload.is_approved

    # Guarda los cambios en la base de datos.
    db.commit()
    db.refresh(user)

    return user


# Activa o desactiva un especialista dentro del sistema.
# Solo puede ser utilizado por un administrador.
@router.patch("/specialists/{user_id}/active", response_model=schemas.UserOut)
def set_specialist_active(
    user_id: str,
    payload: schemas.UserSetActive,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Busca al especialista mediante su ID.
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id, models.User.role == models.RoleEnum.specialist)
        .first()
    )

    # Verifica que el especialista exista.
    if not user:
        raise HTTPException(404, "Especialista no encontrado")

    # Actualiza el estado activo del especialista.
    user.is_active = payload.is_active

    # Guarda los cambios realizados.
    db.commit()
    db.refresh(user)

    return user


# Obtiene todos los pacientes registrados en el sistema.
# Solo puede ser utilizado por un administrador.
@router.get("/patients", response_model=list[schemas.PatientOut])
def list_all_patients(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin)
):
    # Consulta los pacientes y los ordena del más reciente al más antiguo.
    return db.query(models.Patient).order_by(models.Patient.created_at.desc()).all()


# Obtiene los registros de auditoría del sistema.
# El parámetro limit establece la cantidad máxima de registros a mostrar.
@router.get("/audit-logs", response_model=list[schemas.AuditLogOut])
def list_audit_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Consulta los registros y los ordena del más reciente al más antiguo.
    return (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )


# Obtiene los códigos OTP de recuperación que aún están vigentes
# y que no han sido utilizados.
@router.get("/otp-codes", response_model=list[schemas.OTPCodeOut])
def list_otp_codes(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin)
):
    # Obtiene la fecha y hora actual para comprobar la expiración.
    now = datetime.utcnow()

    # Consulta los códigos OTP no utilizados y que aún no han expirado.
    rows = (
        db.query(models.PasswordResetOTP, models.User.correo)
        .join(models.User, models.User.id == models.PasswordResetOTP.user_id)
        .filter(
            models.PasswordResetOTP.used == False,  # noqa: E712
            models.PasswordResetOTP.expires_at > now,
        )
        .order_by(models.PasswordResetOTP.created_at.desc())
        .all()
    )

    # Devuelve los códigos junto con el correo del usuario y su fecha de expiración.
    return [
        schemas.OTPCodeOut(correo=correo, code=otp.code, expires_at=otp.expires_at)
        for otp, correo in rows
    ]