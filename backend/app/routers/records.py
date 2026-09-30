# Importaciones necesarias para crear las rutas, manejar archivos,
# dependencias, errores y conexión con la base de datos.
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import config, models, schemas
from ..database import get_db
from ..deps import get_current_user, require_specialist


# Router para la gestión de expedientes y notas de los pacientes.
router = APIRouter(prefix="/api/records", tags=["records"])


# Verifica que el especialista tenga la especialidad requerida
# para registrar o modificar una nota.
def _check_specialty(
    specialist: models.User,
    expected: models.SpecialtyTypeEnum
):
    if not specialist.specialty or specialist.specialty.tipo != expected:
        raise HTTPException(
            403,
            f"Solo especialistas de tipo '{expected.value}' pueden registrar esta nota"
        )


# Busca un paciente por su ID y genera un error si no existe.
def _get_patient_or_404(
    db: Session,
    patient_id: str
) -> models.Patient:
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(404, "Paciente no encontrado")

    return patient


# Verifica que el paciente se encuentre activo antes
# de permitir registrar o modificar una nota.
def _check_patient_active(patient: models.Patient):
    if not patient.is_active:
        raise HTTPException(
            400,
            "No se pueden registrar ni modificar notas de un paciente dado de baja"
        )


# Obtiene un registro y verifica que pertenezca al especialista actual.
def _get_owned_record_or_403(
    db: Session,
    model,
    record_id: str,
    specialist: models.User
):
    record = (
        db.query(model)
        .filter(model.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(404, "Registro no encontrado")

    if record.specialist_id != specialist.id:
        raise HTTPException(
            403,
            "Solo puedes editar las notas que tú mismo registraste"
        )

    return record


# ---------------------------------------------------------
# REGISTROS DE MEDICINA
# ---------------------------------------------------------

# Crea una nueva nota médica para un paciente.
@router.post(
    "/medicina",
    response_model=schemas.MedicalRecordOut
)
def create_medical_record(
    payload: schemas.MedicalRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica que el especialista pertenezca a medicina.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.medicina
    )

    # Obtiene el paciente y verifica que esté activo.
    patient = _get_patient_or_404(
        db,
        payload.patient_id
    )
    _check_patient_active(patient)

    # Crea y guarda el registro médico.
    record = models.MedicalRecord(
        **payload.model_dump(),
        specialist_id=specialist.id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


# Obtiene las notas médicas de un paciente.
@router.get(
    "/medicina/{patient_id}",
    response_model=list[schemas.MedicalRecordOut]
)
def list_medical_records(
    patient_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    # Consulta los registros médicos y los ordena por fecha.
    return (
        db.query(models.MedicalRecord)
        .filter(
            models.MedicalRecord.patient_id == patient_id
        )
        .order_by(
            models.MedicalRecord.fecha.desc()
        )
        .all()
    )


# Actualiza una nota médica registrada por el especialista actual.
@router.put(
    "/medicina/{record_id}",
    response_model=schemas.MedicalRecordOut
)
def update_medical_record(
    record_id: str,
    payload: schemas.MedicalRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica la especialidad y obtiene el registro.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.medicina
    )

    record = _get_owned_record_or_403(
        db,
        models.MedicalRecord,
        record_id,
        specialist
    )

    # Verifica que el paciente continúe activo.
    _check_patient_active(record.patient)

    # Actualiza los datos del registro sin modificar el paciente asociado.
    for k, v in payload.model_dump(
        exclude={"patient_id"}
    ).items():
        setattr(record, k, v)

    db.commit()
    db.refresh(record)

    return record


# ---------------------------------------------------------
# REGISTROS DE ODONTOLOGÍA
# ---------------------------------------------------------

# Crea una nueva nota de odontología.
@router.post(
    "/odontologia",
    response_model=schemas.DentalRecordOut
)
def create_dental_record(
    payload: schemas.DentalRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica que el especialista sea de odontología.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.odontologia
    )

    patient = _get_patient_or_404(
        db,
        payload.patient_id
    )
    _check_patient_active(patient)

    # Crea y guarda el registro odontológico.
    record = models.DentalRecord(
        **payload.model_dump(),
        specialist_id=specialist.id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


# Obtiene las notas de odontología de un paciente.
@router.get(
    "/odontologia/{patient_id}",
    response_model=list[schemas.DentalRecordOut]
)
def list_dental_records(
    patient_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.DentalRecord)
        .filter(
            models.DentalRecord.patient_id == patient_id
        )
        .order_by(
            models.DentalRecord.fecha.desc()
        )
        .all()
    )


# Actualiza una nota de odontología registrada por el especialista actual.
@router.put(
    "/odontologia/{record_id}",
    response_model=schemas.DentalRecordOut
)
def update_dental_record(
    record_id: str,
    payload: schemas.DentalRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica la especialidad y obtiene el registro.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.odontologia
    )

    record = _get_owned_record_or_403(
        db,
        models.DentalRecord,
        record_id,
        specialist
    )

    _check_patient_active(record.patient)

    # Actualiza los datos sin modificar el paciente asociado.
    for k, v in payload.model_dump(
        exclude={"patient_id"}
    ).items():
        setattr(record, k, v)

    db.commit()
    db.refresh(record)

    return record


# ---------------------------------------------------------
# REGISTROS DE PSICOLOGÍA
# ---------------------------------------------------------

# Crea una nueva nota de psicología.
@router.post(
    "/psicologia",
    response_model=schemas.PsychRecordOut
)
def create_psych_record(
    payload: schemas.PsychRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica que el especialista sea de psicología.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.psicologia
    )

    patient = _get_patient_or_404(
        db,
        payload.patient_id
    )
    _check_patient_active(patient)

    # Crea y guarda el registro psicológico.
    record = models.PsychRecord(
        **payload.model_dump(),
        specialist_id=specialist.id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


# Obtiene las notas de psicología de un paciente.
@router.get(
    "/psicologia/{patient_id}",
    response_model=list[schemas.PsychRecordOut]
)
def list_psych_records(
    patient_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.PsychRecord)
        .filter(
            models.PsychRecord.patient_id == patient_id
        )
        .order_by(
            models.PsychRecord.fecha.desc()
        )
        .all()
    )


# Actualiza una nota de psicología registrada por el especialista actual.
@router.put(
    "/psicologia/{record_id}",
    response_model=schemas.PsychRecordOut
)
def update_psych_record(
    record_id: str,
    payload: schemas.PsychRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica la especialidad y obtiene el registro.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.psicologia
    )

    record = _get_owned_record_or_403(
        db,
        models.PsychRecord,
        record_id,
        specialist
    )

    _check_patient_active(record.patient)

    # Actualiza los datos del registro.
    for k, v in payload.model_dump(
        exclude={"patient_id"}
    ).items():
        setattr(record, k, v)

    db.commit()
    db.refresh(record)

    return record


# ---------------------------------------------------------
# REGISTROS DE FISIOTERAPIA
# ---------------------------------------------------------

# Crea una nueva nota de fisioterapia.
@router.post(
    "/fisioterapia",
    response_model=schemas.PhysioRecordOut
)
def create_physio_record(
    payload: schemas.PhysioRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica que el especialista sea de fisioterapia.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.fisioterapia
    )

    patient = _get_patient_or_404(
        db,
        payload.patient_id
    )
    _check_patient_active(patient)

    # Crea y guarda el registro de fisioterapia.
    record = models.PhysioRecord(
        **payload.model_dump(),
        specialist_id=specialist.id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


# Obtiene las notas de fisioterapia de un paciente.
@router.get(
    "/fisioterapia/{patient_id}",
    response_model=list[schemas.PhysioRecordOut]
)
def list_physio_records(
    patient_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.PhysioRecord)
        .filter(
            models.PhysioRecord.patient_id == patient_id
        )
        .order_by(
            models.PhysioRecord.fecha.desc()
        )
        .all()
    )


# Actualiza una nota de fisioterapia registrada por el especialista actual.
@router.put(
    "/fisioterapia/{record_id}",
    response_model=schemas.PhysioRecordOut
)
def update_physio_record(
    record_id: str,
    payload: schemas.PhysioRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica la especialidad y obtiene el registro.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.fisioterapia
    )

    record = _get_owned_record_or_403(
        db,
        models.PhysioRecord,
        record_id,
        specialist
    )

    _check_patient_active(record.patient)

    # Actualiza los datos del registro.
    for k, v in payload.model_dump(
        exclude={"patient_id"}
    ).items():
        setattr(record, k, v)

    db.commit()
    db.refresh(record)

    return record


# ---------------------------------------------------------
# REGISTROS DE NUTRICIÓN
# ---------------------------------------------------------

# Crea una nueva nota de nutrición.
@router.post(
    "/nutricion",
    response_model=schemas.NutritionRecordOut
)
def create_nutrition_record(
    payload: schemas.NutritionRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica que el especialista sea de nutrición.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.nutricion
    )

    patient = _get_patient_or_404(
        db,
        payload.patient_id
    )
    _check_patient_active(patient)

    # Crea y guarda el registro de nutrición.
    record = models.NutritionRecord(
        **payload.model_dump(),
        specialist_id=specialist.id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


# Obtiene las notas de nutrición de un paciente.
@router.get(
    "/nutricion/{patient_id}",
    response_model=list[schemas.NutritionRecordOut]
)
def list_nutrition_records(
    patient_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.NutritionRecord)
        .filter(
            models.NutritionRecord.patient_id == patient_id
        )
        .order_by(
            models.NutritionRecord.fecha.desc()
        )
        .all()
    )


# Actualiza una nota de nutrición registrada por el especialista actual.
@router.put(
    "/nutricion/{record_id}",
    response_model=schemas.NutritionRecordOut
)
def update_nutrition_record(
    record_id: str,
    payload: schemas.NutritionRecordCreate,
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica la especialidad y obtiene el registro.
    _check_specialty(
        specialist,
        models.SpecialtyTypeEnum.nutricion
    )

    record = _get_owned_record_or_403(
        db,
        models.NutritionRecord,
        record_id,
        specialist
    )

    _check_patient_active(record.patient)

    # Actualiza los datos del registro.
    for k, v in payload.model_dump(
        exclude={"patient_id"}
    ).items():
        setattr(record, k, v)

    db.commit()
    db.refresh(record)

    return record


# Extensiones de archivos permitidas para los documentos de nutrición.
ALLOWED_DOC_EXT = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
}


# Permite cargar archivos relacionados con una nota de nutrición.
@router.post(
    "/nutricion/{record_id}/upload/{kind}",
    response_model=schemas.NutritionRecordOut
)
def upload_nutrition_file(
    record_id: str,
    kind: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    specialist: models.User = Depends(require_specialist),
):
    # Verifica que el tipo de archivo corresponda
    # a antropometría o bioimpedancia.
    if kind not in (
        "antropometria",
        "bioimpedancia"
    ):
        raise HTTPException(
            400,
            "Tipo de archivo inválido"
        )

    # Busca el registro de nutrición.
    record = (
        db.query(models.NutritionRecord)
        .filter(
            models.NutritionRecord.id == record_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            404,
            "Registro no encontrado"
        )

    # Verifica que el registro pertenezca al especialista actual.
    if record.specialist_id != specialist.id:
        raise HTTPException(
            403,
            "No tienes acceso a este registro"
        )

    # Verifica que el paciente esté activo.
    _check_patient_active(record.patient)

    # Obtiene y valida la extensión del archivo.
    ext = os.path.splitext(
        file.filename or ""
    )[1].lower()

    if ext not in ALLOWED_DOC_EXT:
        raise HTTPException(
            400,
            "Formato de archivo no permitido"
        )

    # Crea la carpeta de almacenamiento si no existe.
    folder = os.path.join(
        config.UPLOADS_DIR,
        "nutricion"
    )

    os.makedirs(
        folder,
        exist_ok=True
    )

    # Genera un nombre único para evitar conflictos entre archivos.
    filename = f"{uuid.uuid4()}{ext}"

    path = os.path.join(
        folder,
        filename
    )

    # Guarda el archivo en el servidor.
    with open(path, "wb") as f:
        f.write(file.file.read())

    # Genera la ruta pública del archivo.
    url = f"/uploads/nutricion/{filename}"

    # Guarda la ruta en el campo correspondiente del registro.
    if kind == "antropometria":
        record.antropometria_file = url
    else:
        record.bioimpedancia_file = url

    db.commit()
    db.refresh(record)

    return record


# Construye un expediente unificado con la información
# del paciente y sus registros de todas las especialidades.
def build_unified_record(
    db: Session,
    patient_id: str
) -> dict:

    # Verifica que el paciente exista.
    patient = _get_patient_or_404(
        db,
        patient_id
    )

    # Obtiene los registros de cada especialidad
    # y los ordena del más reciente al más antiguo.
    return {
        "patient": patient,

        "medicina": (
            db.query(models.MedicalRecord)
            .filter(
                models.MedicalRecord.patient_id == patient_id
            )
            .order_by(
                models.MedicalRecord.fecha.desc()
            )
            .all()
        ),

        "odontologia": (
            db.query(models.DentalRecord)
            .filter(
                models.DentalRecord.patient_id == patient_id
            )
            .order_by(
                models.DentalRecord.fecha.desc()
            )
            .all()
        ),

        "psicologia": (
            db.query(models.PsychRecord)
            .filter(
                models.PsychRecord.patient_id == patient_id
            )
            .order_by(
                models.PsychRecord.fecha.desc()
            )
            .all()
        ),

        "fisioterapia": (
            db.query(models.PhysioRecord)
            .filter(
                models.PhysioRecord.patient_id == patient_id
            )
            .order_by(
                models.PhysioRecord.fecha.desc()
            )
            .all()
        ),

        "nutricion": (
            db.query(models.NutritionRecord)
            .filter(
                models.NutritionRecord.patient_id == patient_id
            )
            .order_by(
                models.NutritionRecord.fecha.desc()
            )
            .all()
        ),
    }


# Obtiene el expediente unificado de un paciente.
# Permite consultar en una sola respuesta los registros
# de todas las especialidades.
@router.get(
    "/unified/{patient_id}",
    response_model=schemas.UnifiedRecord
)
def unified_record(
    patient_id: str,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    # Construye y devuelve el expediente completo del paciente.
    return build_unified_record(
        db,
        patient_id
    )