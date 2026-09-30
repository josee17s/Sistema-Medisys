# Importaciones necesarias para crear las rutas, manejar dependencias,
# errores HTTP y trabajar con la base de datos.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_admin


# Router para la gestión de catálogos del sistema.
router = APIRouter(prefix="/api/catalogs", tags=["catalogs"])


# Obtiene la lista de especialidades disponibles.
# Permite incluir también las especialidades inactivas.
@router.get("/specialties", response_model=list[schemas.SpecialtyOut])
def list_specialties(
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    # Consulta las especialidades registradas.
    q = db.query(models.Specialty)

    # Por defecto, solo muestra las especialidades activas.
    if not include_inactive:
        q = q.filter(models.Specialty.is_active == True)  # noqa: E712

    # Ordena las especialidades alfabéticamente.
    return q.order_by(models.Specialty.nombre).all()


# Crea una nueva especialidad.
# Esta operación requiere permisos de administrador.
@router.post("/specialties", response_model=schemas.SpecialtyOut)
def create_specialty(
    payload: schemas.SpecialtyCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Verifica que no exista otra especialidad con el mismo nombre.
    if db.query(models.Specialty).filter(
        models.Specialty.nombre == payload.nombre
    ).first():
        raise HTTPException(400, "Ya existe una especialidad con ese nombre")

    # Crea y guarda la nueva especialidad.
    obj = models.Specialty(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


# Activa o desactiva una especialidad.
# Esta operación requiere permisos de administrador.
@router.patch("/specialties/{specialty_id}/toggle", response_model=schemas.SpecialtyOut)
def toggle_specialty(
    specialty_id: str,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Busca la especialidad mediante su identificador.
    obj = db.query(models.Specialty).filter(
        models.Specialty.id == specialty_id
    ).first()

    if not obj:
        raise HTTPException(404, "No encontrado")

    # Cambia el estado de la especialidad.
    obj.is_active = not obj.is_active

    db.commit()
    db.refresh(obj)

    return obj


# Obtiene la lista de disciplinas registradas.
# Un usuario autenticado puede consultar el catálogo.
@router.get("/disciplines", response_model=list[schemas.DisciplineOut])
def list_disciplines(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    # Consulta las disciplinas registradas.
    q = db.query(models.Discipline)

    # Por defecto, solo muestra las disciplinas activas.
    if not include_inactive:
        q = q.filter(models.Discipline.is_active == True)  # noqa: E712

    # Ordena las disciplinas alfabéticamente.
    return q.order_by(models.Discipline.nombre).all()


# Crea una nueva disciplina.
# Esta operación requiere permisos de administrador.
@router.post("/disciplines", response_model=schemas.DisciplineOut)
def create_discipline(
    payload: schemas.DisciplineBase,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Crea y guarda la nueva disciplina.
    obj = models.Discipline(nombre=payload.nombre)
    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


# Activa o desactiva una disciplina.
# Esta operación requiere permisos de administrador.
@router.patch("/disciplines/{discipline_id}/toggle", response_model=schemas.DisciplineOut)
def toggle_discipline(
    discipline_id: str,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Busca la disciplina mediante su identificador.
    obj = db.query(models.Discipline).filter(
        models.Discipline.id == discipline_id
    ).first()

    if not obj:
        raise HTTPException(404, "No encontrado")

    # Cambia el estado de la disciplina.
    obj.is_active = not obj.is_active

    db.commit()
    db.refresh(obj)

    return obj


# Obtiene la lista de entrenadores registrados.
# Un usuario autenticado puede consultar el catálogo.
@router.get("/trainers", response_model=list[schemas.TrainerOut])
def list_trainers(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _user: models.User = Depends(get_current_user),
):
    # Consulta los entrenadores registrados.
    q = db.query(models.Trainer)

    # Por defecto, solo muestra los entrenadores activos.
    if not include_inactive:
        q = q.filter(models.Trainer.is_active == True)  # noqa: E712

    # Ordena los entrenadores alfabéticamente.
    return q.order_by(models.Trainer.nombre).all()


# Crea un nuevo entrenador.
# Esta operación requiere permisos de administrador.
@router.post("/trainers", response_model=schemas.TrainerOut)
def create_trainer(
    payload: schemas.TrainerBase,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Crea y guarda el nuevo entrenador.
    obj = models.Trainer(nombre=payload.nombre)
    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


# Activa o desactiva un entrenador.
# Esta operación requiere permisos de administrador.
@router.patch("/trainers/{trainer_id}/toggle", response_model=schemas.TrainerOut)
def toggle_trainer(
    trainer_id: str,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    # Busca el entrenador mediante su identificador.
    obj = db.query(models.Trainer).filter(
        models.Trainer.id == trainer_id
    ).first()

    if not obj:
        raise HTTPException(404, "No encontrado")

    # Cambia el estado del entrenador.
    obj.is_active = not obj.is_active

    db.commit()
    db.refresh(obj)

    return obj