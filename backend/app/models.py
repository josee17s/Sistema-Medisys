import enum
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


# Define la zona horaria utilizada por el sistema
MEXICO_TZ = ZoneInfo("America/Mexico_City")


# Obtiene la fecha y hora actual de Mexico
def now_mexico():
    return datetime.now(MEXICO_TZ).replace(tzinfo=None)

# Genera un identificador unico para los registros
def gen_uuid():
    return str(uuid.uuid4())


# Roles disponibles para los usuarios del sistema
class RoleEnum(str, enum.Enum):
    admin = "admin"
    specialist = "specialist"


# Tipos de especialidad que determinan el formulario clinico utilizado
class SpecialtyTypeEnum(str, enum.Enum):
    medicina = "medicina"
    odontologia = "odontologia"
    psicologia = "psicologia"
    fisioterapia = "fisioterapia"
    nutricion = "nutricion"


# Ramas deportivas disponibles para los pacientes
class RamaEnum(str, enum.Enum):
    varonil = "varonil"
    femenil = "femenil"
    mixta = "mixta"


# Modelo que representa las especialidades medicas
class Specialty(Base):
    __tablename__ = "specialties"

    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False, unique=True)
    tipo = Column(Enum(SpecialtyTypeEnum), nullable=False)
    is_active = Column(Boolean, default=True)

    # Relaciona una especialidad con sus especialistas
    users = relationship("User", back_populates="specialty")


# Modelo que representa las disciplinas deportivas
class Discipline(Base):
    __tablename__ = "disciplines"

    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)


# Modelo que representa a los entrenadores
class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)


# Modelo que representa a los usuarios del sistema
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False)
    apellido_paterno = Column(String, nullable=False)
    apellido_materno = Column(String, nullable=True)
    matricula = Column(String, unique=True, nullable=False, index=True)
    correo = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.specialist)
    specialty_id = Column(String, ForeignKey("specialties.id"), nullable=True)
    is_active = Column(Boolean, default=True)  # Indica si la cuenta esta activa
    is_approved = Column(Boolean, default=False)  # Indica si fue aprobada por el administrador
    created_at = Column(DateTime, default=now_mexico)

    # Relaciona al usuario con su especialidad
    specialty = relationship("Specialty", back_populates="users")


# Modelo que registra las acciones realizadas por los usuarios
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    correo_usado = Column(String, nullable=True)
    accion = Column(String, nullable=False)  # login_ok, login_fail, logout
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=now_mexico)

    # Relaciona el registro de auditoria con el usuario
    user = relationship("User")


# Modelo utilizado para almacenar codigos OTP de recuperacion de contrasena
class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_mexico)


# Modelo que representa a los pacientes
class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=gen_uuid)

    nombres = Column(String, nullable=False)
    apellido_paterno = Column(String, nullable=False)
    apellido_materno = Column(String, nullable=True)
    matricula = Column(String, nullable=False, unique=True, index=True)
    correo = Column(String, nullable=False, unique=True, index=True)

    edad = Column(Integer, nullable=True)
    peso = Column(Float, nullable=True)

    # Relaciones con disciplina y entrenador
    discipline_id = Column(String, ForeignKey("disciplines.id"), nullable=True)
    trainer_id = Column(String, ForeignKey("trainers.id"), nullable=True)

    posicion = Column(String, nullable=True)
    rama = Column(Enum(RamaEnum), nullable=True)

    # Especialista responsable del paciente
    specialist_id = Column(String, ForeignKey("users.id"), nullable=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_mexico)

    discipline = relationship("Discipline")
    trainer = relationship("Trainer")
    specialist = relationship("User")


# Modelo para los expedientes de medicina general
class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    specialist_id = Column(String, ForeignKey("users.id"), nullable=False)
    fecha = Column(DateTime, default=now_mexico)
    ubicacion = Column(String, nullable=True)

    # Signos vitales del paciente
    ta = Column(String, nullable=True)  # Tension arterial
    fc = Column(String, nullable=True)  # Frecuencia cardiaca
    fr = Column(String, nullable=True)  # Frecuencia respiratoria
    temperatura = Column(String, nullable=True)
    spo2 = Column(String, nullable=True)

    motivo = Column(Text, nullable=True)
    servicio = Column(String, nullable=True)
    diagnostico = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)

    patient = relationship("Patient")
    specialist = relationship("User")


# Modelo para los expedientes de odontologia
class DentalRecord(Base):
    __tablename__ = "dental_records"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    specialist_id = Column(String, ForeignKey("users.id"), nullable=False)
    fecha = Column(DateTime, default=now_mexico)
    observaciones = Column(Text, nullable=True)

    patient = relationship("Patient")
    specialist = relationship("User")


# Modelo para los expedientes de psicologia
class PsychRecord(Base):
    __tablename__ = "psych_records"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    specialist_id = Column(String, ForeignKey("users.id"), nullable=False)
    fecha = Column(DateTime, default=now_mexico)
    motivo_consulta = Column(Text, nullable=True)

    patient = relationship("Patient")
    specialist = relationship("User")


# Modelo para los expedientes de fisioterapia
class PhysioRecord(Base):
    __tablename__ = "physio_records"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    specialist_id = Column(String, ForeignKey("users.id"), nullable=False)
    fecha = Column(DateTime, default=now_mexico)
    diagnostico = Column(Text, nullable=True)
    tratamiento = Column(Text, nullable=True)

    patient = relationship("Patient")
    specialist = relationship("User")


# Modelo para los expedientes de nutricion
class NutritionRecord(Base):
    __tablename__ = "nutrition_records"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    specialist_id = Column(String, ForeignKey("users.id"), nullable=False)
    fecha = Column(DateTime, default=now_mexico)
    tipo_dieta = Column(String, nullable=True)
    hidratacion = Column(String, nullable=True)
    descanso = Column(String, nullable=True)
    composicion_corporal = Column(Text, nullable=True)
    comida = Column(Text, nullable=True)
    suplementacion = Column(Text, nullable=True)
    recomendaciones = Column(Text, nullable=True)

    # Archivos relacionados con la evaluacion nutricional
    antropometria_file = Column(String, nullable=True)
    bioimpedancia_file = Column(String, nullable=True)

    patient = relationship("Patient")
    specialist = relationship("User")