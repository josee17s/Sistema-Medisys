# Importaciones necesarias para crear las rutas, manejar dependencias,
# errores de base de datos, solicitudes HTTP y sesiones.
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..audit import log_action
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_specialist
from .records import build_unified_record


# Router para la gestión de pacientes.
router = APIRouter(prefix="/api/patients", tags=["patients"])


# Busca un paciente mediante su identificador.
# Si no existe, devuelve un error 404.
def _get_patient(
    db: Session,
    patient_id: str,
) -> models.Patient:

    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Paciente no encontrado",
        )

    return patient


# Obtiene la lista de pacientes registrados.
# Por defecto, únicamente muestra pacientes activos.
@router.get("", response_model=list[schemas.PatientOut])
def list_patients(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):

    # Consulta los pacientes registrados.
    query = db.query(models.Patient)

    # Permite incluir pacientes inactivos cuando se solicita.
    if not include_inactive:
        query = query.filter(models.Patient.is_active == True)  # noqa: E712

    # Ordena los pacientes del más reciente al más antiguo.
    return (
        query
        .order_by(models.Patient.created_at.desc())
        .all()
    )


# Registra un nuevo paciente asociado al especialista actual.
@router.post("", response_model=schemas.PatientOut)
def create_patient(
    payload: schemas.PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):

    # Verifica que la matrícula no esté registrada.
    existing_matricula = (
        db.query(models.Patient)
        .filter(models.Patient.matricula == payload.matricula)
        .first()
    )

    if existing_matricula:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un paciente con esa matrícula.",
        )

    # Verifica que el correo no esté registrado, si fue proporcionado.
    if payload.correo:
        existing_correo = (
            db.query(models.Patient)
            .filter(models.Patient.correo == payload.correo)
            .first()
        )

        if existing_correo:
            raise HTTPException(
                status_code=409,
                detail="Ya existe un paciente con ese correo.",
            )

    # Crea el paciente y lo relaciona con el especialista actual.
    patient = models.Patient(
        **payload.model_dump(),
        specialist_id=specialist.id,
    )

    db.add(patient)

    # Guarda el paciente y controla posibles errores de integridad.
    try:
        db.commit()
        db.refresh(patient)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="La matrícula o el correo ya pertenecen a otro paciente.",
        )

    # Registra la creación del paciente en la auditoría.
    log_action(
        db,
        request,
        "CREATE_PATIENT",
        user=specialist,
    )

    return patient


# Busca pacientes activos por nombre, apellidos, matrícula o correo.
@router.get("/search", response_model=list[schemas.PatientOut])
def search_patients(
    q: str = "",
    db: Session = Depends(get_db),
    _specialist: models.User = Depends(require_specialist),
):

    # La búsqueda se realiza únicamente entre pacientes activos.
    query = db.query(models.Patient).filter(
        models.Patient.is_active == True  # noqa: E712
    )

    # Si se proporciona un texto, se utiliza como criterio de búsqueda.
    if q:
        like = f"%{q}%"

        query = query.filter(
            (models.Patient.nombres.ilike(like))
            | (models.Patient.apellido_paterno.ilike(like))
            | (models.Patient.apellido_materno.ilike(like))
            | (models.Patient.matricula.ilike(like))
            | (models.Patient.correo.ilike(like))
        )

    # Ordena los resultados y limita la búsqueda a 30 pacientes.
    return (
        query
        .order_by(models.Patient.nombres)
        .limit(30)
        .all()
    )


# Obtiene el expediente médico completo de un paciente.
@router.get(
    "/{patient_id}/medical-record",
    response_model=schemas.UnifiedRecord,
)
def patient_medical_record(
    patient_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    # Construye y devuelve el expediente médico unificado.
    return build_unified_record(db, patient_id)


# Obtiene la información de un paciente mediante su ID.
@router.get(
    "/{patient_id}",
    response_model=schemas.PatientOut,
)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    # Busca y devuelve el paciente solicitado.
    return _get_patient(db, patient_id)


# Actualiza los datos de un paciente existente.
@router.put(
    "/{patient_id}",
    response_model=schemas.PatientOut,
)
def update_patient(
    patient_id: str,
    payload: schemas.PatientUpdate,
    request: Request,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):

    # Obtiene el paciente que se desea actualizar.
    patient = _get_patient(db, patient_id)

    # Comprueba que la matrícula no pertenezca a otro paciente.
    existing_matricula = (
        db.query(models.Patient)
        .filter(
            models.Patient.matricula == payload.matricula,
            models.Patient.id != patient.id,
        )
        .first()
    )

    if existing_matricula:
        raise HTTPException(
            status_code=409,
            detail="Ya existe otro paciente con esa matrícula.",
        )

    # Comprueba que el correo no pertenezca a otro paciente.
    if payload.correo:
        existing_correo = (
            db.query(models.Patient)
            .filter(
                models.Patient.correo == payload.correo,
                models.Patient.id != patient.id,
            )
            .first()
        )

        if existing_correo:
            raise HTTPException(
                status_code=409,
                detail="Ya existe otro paciente con ese correo.",
            )

    # Actualiza los campos enviados en la solicitud.
    for key, value in payload.model_dump().items():
        setattr(patient, key, value)

    # Guarda los cambios y controla posibles errores de integridad.
    try:
        db.commit()
        db.refresh(patient)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="La matrícula o el correo ya pertenecen a otro paciente.",
        )

    # Registra la actualización en la auditoría.
    log_action(
        db,
        request,
        "UPDATE_PATIENT",
        user=specialist,
    )

    return patient


# Desactiva un paciente sin eliminarlo físicamente de la base de datos.
@router.delete("/{patient_id}")
def delete_patient(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):

    # Obtiene el paciente que se desea desactivar.
    patient = _get_patient(db, patient_id)

    # Cambia su estado a inactivo.
    patient.is_active = False

    db.commit()

    # Registra la desactivación en la auditoría.
    log_action(
        db,
        request,
        "DEACTIVATE_PATIENT",
        user=specialist,
    )

    return {
        "detail": "Paciente desactivado",
        "id": patient_id,
        "is_active": False,
    }


# Reactiva un paciente que se encontraba inactivo.
@router.patch(
    "/{patient_id}/reactivate",
    response_model=schemas.PatientOut,
)
def reactivate_patient(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Obtiene el paciente que se desea reactivar.
    patient = _get_patient(db, patient_id)

    # Cambia su estado a activo.
    patient.is_active = True

    db.commit()
    db.refresh(patient)

    # Registra la activación en la auditoría.
    log_action(
        db,
        request,
        "ACTIVATE_PATIENT",
        user=specialist,
    )

    return patient