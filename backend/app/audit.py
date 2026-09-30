# Importaciones necesarias para manejar tipos opcionales,
# solicitudes HTTP y conexión con la base de datos.
from typing import Optional
from fastapi import Request
from sqlalchemy.orm import Session
from . import models


# Obtiene la dirección IP del cliente que realizó la solicitud.
# Primero revisa los encabezados usados cuando existe un proxy
# y, si no están disponibles, utiliza la IP directa del cliente.
def get_client_ip(request: Request) -> Optional[str]:
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.client.host if request.client else None


# Registra una acción realizada en el sistema dentro de la
# tabla de auditoría, incluyendo usuario, correo, acción e IP.
def log_action(
    db: Session,
    request: Request,
    accion: str,
    user: Optional["models.User"] = None,
    correo: Optional[str] = None,
) -> None:
    # Crea el registro de auditoría con los datos disponibles.
    log = models.AuditLog(
        user_id=user.id if user else None,
        correo_usado=correo or (user.correo if user else None),
        accion=accion,
        ip_address=get_client_ip(request),
    )

    # Guarda y confirma el registro en la base de datos.
    db.add(log)
    db.commit()