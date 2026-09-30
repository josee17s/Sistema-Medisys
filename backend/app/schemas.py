from datetime import datetime

import re

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from .models import RamaEnum, RoleEnum, SpecialtyTypeEnum


# Expresion utilizada para validar el formato de los correos electronicos
EMAIL_REGEX = re.compile(
    r"^[A-Za-z0-9]+(?:[._%+-][A-Za-z0-9]+)*@"
    r"[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*\.[A-Za-z]{2,}$"
)

# Dominios de correo permitidos para los usuarios del sistema
ALLOWED_EMAIL_DOMAINS = {

    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "alumno.buap.mx",
    "correo.buap.mx",
    "icloud.com",

}


# Expresion utilizada para validar matriculas de 9 digitos
MATRICULA_REGEX = re.compile(r"^\d{9}$")


# Valida los nombres y apellidos
def validate_name(value: str, field_name: str) -> str:

    # Elimina espacios al inicio y al final
    value = value.strip()

    if not value:
        raise ValueError(f"{field_name} es obligatorio")

    if len(value) < 2:
        raise ValueError(f"{field_name} debe tener al menos 2 caracteres")

    if len(value) > 50:
        raise ValueError(f"{field_name} no puede superar 50 caracteres")

    # Permite letras, acentos y espacios
    # No permite numeros ni caracteres especiales
    if not all(char.isalpha() or char.isspace() for char in value):

        raise ValueError(
            f"{field_name} solo puede contener letras y espacios"
        )

    return value


# Valida el formato y dominio permitido de un correo electronico
def validate_email(value):

    # Elimina espacios y convierte el correo a minusculas
    value = value.strip().lower()

    if len(value) > 254:
        raise ValueError("El correo es demasiado largo")

    # Comprueba que el correo tenga un formato valido
    if not EMAIL_REGEX.fullmatch(value):
        raise ValueError("Ingresa un correo electrónico válido")

    # Obtiene el dominio del correo
    domain = value.split("@", 1)[1]

    # Verifica que el dominio este permitido
    if domain not in ALLOWED_EMAIL_DOMAINS:

        raise ValueError(
            "Solo se permiten correos de dominios autorizados."
        )

    return value


# Valida que la matricula tenga exactamente 9 numeros
def validate_matricula(value: str) -> str:

    value = value.strip()

    if not MATRICULA_REGEX.fullmatch(value):

        raise ValueError(
            "La matrícula debe contener exactamente 9 números"
        )

    return value


# Valida los requisitos de seguridad de una contrasena
def validate_password(value: str) -> str:

    if not value:
        raise ValueError("La contraseña es obligatoria")

    if len(value) < 8:
        raise ValueError(
            "La contraseña debe tener al menos 8 caracteres"
        )

    if len(value) > 128:
        raise ValueError(
            "La contraseña no puede superar 128 caracteres"
        )

    # Verifica que contenga al menos una mayuscula
    if not re.search(r"[A-Z]", value):

        raise ValueError(
            "La contraseña debe contener al menos una letra mayúscula"
        )

    # Verifica que contenga al menos una minuscula
    if not re.search(r"[a-z]", value):

        raise ValueError(
            "La contraseña debe contener al menos una letra minúscula"
        )

    # Verifica que contenga al menos un numero
    if not re.search(r"\d", value):

        raise ValueError(
            "La contraseña debe contener al menos un número"
        )

    # Verifica que contenga al menos un caracter especial
    if not re.search(r"[^A-Za-z0-9]", value):

        raise ValueError(
            "La contraseña debe contener al menos un carácter especial"
        )

    return value


# Datos necesarios para iniciar sesion
class LoginRequest(BaseModel):

    identificador: str = Field(
        ...,
        min_length=1,
        max_length=254,
    )

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
    )

    # Normaliza el correo o matricula antes de procesarlos
    @field_validator("identificador", mode="before")
    @classmethod
    def normalize_identificador(cls, value):

        if not isinstance(value, str):
            raise ValueError("El correo o matrícula es obligatorio")

        value = value.strip()

        if not value:
            raise ValueError("El correo o matrícula es obligatorio")

        return value.lower()


# Datos devueltos despues de una autenticacion exitosa
class TokenResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# Datos necesarios para solicitar la recuperacion de contrasena
class ForgotPasswordRequest(BaseModel):

    correo: EmailStr

    @field_validator("correo", mode="before")
    @classmethod
    def validate_forgot_email(cls, value):

        return validate_email(value)


# Datos necesarios para restablecer la contrasena
class ResetPasswordRequest(BaseModel):

    correo: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str
    confirm_password: str

    @field_validator("correo", mode="before")
    @classmethod
    def validate_reset_email(cls, value):

        return validate_email(value)

    # Valida que el codigo OTP tenga exactamente 6 numeros
    @field_validator("code")
    @classmethod
    def validate_code(cls, value):

        if not value.isdigit() or len(value) != 6:
            raise ValueError("El código debe contener exactamente 6 números")

        return value

    # Valida los requisitos de la nueva contrasena
    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value):

        return validate_password(value)

    # Comprueba que las dos contrasenas coincidan
    @model_validator(mode="after")
    def passwords_match(self):

        if self.new_password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden")

        return self


# Datos base de una especialidad
class SpecialtyBase(BaseModel):

    nombre: str
    tipo: SpecialtyTypeEnum


# Datos utilizados para crear una especialidad
class SpecialtyCreate(SpecialtyBase):

    pass


# Datos de una especialidad que se devuelven al cliente
class SpecialtyOut(SpecialtyBase):

    id: str
    is_active: bool

    class Config:
        from_attributes = True


# Datos base de una disciplina
class DisciplineBase(BaseModel):

    nombre: str


# Datos de una disciplina que se devuelven al cliente
class DisciplineOut(DisciplineBase):

    id: str
    is_active: bool

    class Config:
        from_attributes = True


# Datos base de un entrenador
class TrainerBase(BaseModel):

    nombre: str


# Datos de un entrenador que se devuelven al cliente
class TrainerOut(TrainerBase):

    id: str
    is_active: bool

    class Config:
        from_attributes = True


# Datos necesarios para registrar un nuevo especialista
class SpecialistRegister(BaseModel):

    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    correo: EmailStr
    matricula: str
    password: str
    confirm_password: str
    specialty_id: str

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value):

        return validate_name(value, "El nombre")

    @field_validator("apellido_paterno")
    @classmethod
    def validate_apellido_paterno(cls, value):

        return validate_name(value, "El apellido paterno")

    @field_validator("apellido_materno")
    @classmethod
    def validate_apellido_materno(cls, value):

        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return validate_name(value, "El apellido materno")

    # Valida el correo utilizado durante el registro
    @field_validator("correo", mode="before")
    @classmethod
    def validate_register_email(cls, value):

        return validate_email(value)

    # Valida la matricula utilizada durante el registro
    @field_validator("matricula")
    @classmethod
    def validate_register_matricula(cls, value):

        return validate_matricula(value)

    # Valida la contrasena utilizada durante el registro
    @field_validator("password")
    @classmethod
    def validate_register_password(cls, value):

        return validate_password(value)

    # Comprueba que la contrasena y su confirmacion coincidan
    @model_validator(mode="after")
    def passwords_match(self):

        if self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden")

        return self


# Datos utilizados para actualizar el perfil de un especialista
class SpecialistProfileUpdate(BaseModel):

    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    matricula: str
    correo: EmailStr
    password: Optional[str] = None
    confirm_password: Optional[str] = None

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value):

        return validate_name(value, "El nombre")

    @field_validator("apellido_paterno")
    @classmethod
    def validate_apellido_paterno(cls, value):

        return validate_name(value, "El apellido paterno")

    @field_validator("apellido_materno")
    @classmethod
    def validate_apellido_materno(cls, value):

        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return validate_name(value, "El apellido materno")

    @field_validator("matricula")
    @classmethod
    def validate_profile_matricula(cls, value):

        return validate_matricula(value)

    @field_validator("correo", mode="before")
    @classmethod
    def validate_profile_email(cls, value):

        return validate_email(value)

    @field_validator("password")
    @classmethod
    def validate_profile_password(cls, value):

        if value is None or value == "":
            return None

        return validate_password(value)

    # Verifica que la nueva contrasena y su confirmacion coincidan
    @model_validator(mode="after")
    def validate_password_confirmation(self):

        if self.password or self.confirm_password:

            if not self.password or not self.confirm_password:

                raise ValueError(
                    "Debes ingresar y repetir la nueva contraseña."
                )

            if self.password != self.confirm_password:

                raise ValueError("Las contraseñas no coinciden.")

        return self


# Datos publicos de un usuario
class UserOut(BaseModel):

    id: str
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    correo: str
    matricula: str
    role: RoleEnum
    specialty: Optional[SpecialtyOut] = None
    is_active: bool
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Datos basicos del especialista asociado a un expediente
class RecordSpecialistOut(BaseModel):

    id: str
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None

    class Config:
        from_attributes = True


# Datos utilizados para aprobar o rechazar un usuario
class UserApprove(BaseModel):

    is_approved: bool


# Datos utilizados para activar o desactivar un usuario
class UserSetActive(BaseModel):

    is_active: bool


# Datos necesarios para registrar un paciente
class PatientCreate(BaseModel):

    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    matricula: str
    correo: EmailStr
    edad: Optional[int] = None
    peso: Optional[float] = None
    discipline_id: Optional[str] = None
    trainer_id: Optional[str] = None
    posicion: Optional[str] = None
    rama: Optional[RamaEnum] = None

    @field_validator("nombres")
    @classmethod
    def validate_nombres(cls, value):

        return validate_name(value, "El nombre")

    @field_validator("apellido_paterno")
    @classmethod
    def validate_apellido_paterno(cls, value):

        return validate_name(value, "El apellido paterno")

    @field_validator("apellido_materno")
    @classmethod
    def validate_apellido_materno(cls, value):

        if value is None:
            return value

        value = value.strip()

        if not value:
            return None

        return validate_name(value, "El apellido materno")

    # Valida la matricula del paciente
    @field_validator("matricula")
    @classmethod
    def validate_patient_matricula(cls, value):

        return validate_matricula(value)

    # Valida el correo del paciente
    @field_validator("correo", mode="before")
    @classmethod
    def validate_patient_email(cls, value):

        return validate_email(value)

    # Valida que la edad este dentro del rango permitido
    @field_validator("edad")
    @classmethod
    def validate_edad(cls, value):

        if value is None:
            return value

        if value < 1 or value > 120:

            raise ValueError(
                "La edad debe estar entre 1 y 120 años"
            )

        return value

    # Valida que el peso este dentro del rango permitido
    @field_validator("peso")
    @classmethod
    def validate_peso(cls, value):

        if value is None:
            return value

        if value < 0.1 or value > 500:

            raise ValueError(
                "El peso debe estar entre 0.1 y 500 kg"
            )

        return value

    # Limpia y valida la posicion del paciente
    @field_validator("posicion", mode="before")
    @classmethod
    def validate_posicion(cls, value):

        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        if len(value) > 50:

            raise ValueError(
                "La posición no puede superar 50 caracteres"
            )

        return value


# Datos utilizados para actualizar un paciente
class PatientUpdate(PatientCreate):

    pass


# Datos de un paciente que se devuelven al cliente
class PatientOut(BaseModel):

    id: str
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    matricula: str
    correo: EmailStr
    edad: Optional[int] = None
    peso: Optional[float] = None
    discipline: Optional[DisciplineOut] = None
    trainer: Optional[TrainerOut] = None
    posicion: Optional[str] = None
    rama: Optional[RamaEnum] = None
    specialist_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Datos necesarios para crear un expediente de medicina general
class MedicalRecordCreate(BaseModel):

    patient_id: str
    ubicacion: Optional[str] = None
    ta: Optional[str] = None
    fc: Optional[str] = None
    fr: Optional[str] = None
    temperatura: Optional[str] = None
    spo2: Optional[str] = None
    motivo: Optional[str] = None
    servicio: Optional[str] = None
    diagnostico: Optional[str] = None
    plan: Optional[str] = None


# Datos de salida de un expediente de medicina general
class MedicalRecordOut(MedicalRecordCreate):

    id: str
    fecha: datetime
    specialist_id: str
    specialist: RecordSpecialistOut

    class Config:
        from_attributes = True


# Datos necesarios para crear un expediente odontologico
class DentalRecordCreate(BaseModel):

    patient_id: str
    observaciones: Optional[str] = None


# Datos de salida de un expediente odontologico
class DentalRecordOut(DentalRecordCreate):

    id: str
    fecha: datetime
    specialist_id: str
    specialist: RecordSpecialistOut

    class Config:
        from_attributes = True


# Datos necesarios para crear un expediente psicologico
class PsychRecordCreate(BaseModel):

    patient_id: str
    motivo_consulta: Optional[str] = None


# Datos de salida de un expediente psicologico
class PsychRecordOut(PsychRecordCreate):

    id: str
    fecha: datetime
    specialist_id: str
    specialist: RecordSpecialistOut

    class Config:
        from_attributes = True


# Datos necesarios para crear un expediente de fisioterapia
class PhysioRecordCreate(BaseModel):

    patient_id: str
    diagnostico: Optional[str] = None
    tratamiento: Optional[str] = None


# Datos de salida de un expediente de fisioterapia
class PhysioRecordOut(PhysioRecordCreate):

    id: str
    fecha: datetime
    specialist_id: str
    specialist: RecordSpecialistOut

    class Config:
        from_attributes = True


# Datos necesarios para crear un expediente de nutricion
class NutritionRecordCreate(BaseModel):

    patient_id: str
    tipo_dieta: Optional[str] = None
    hidratacion: Optional[str] = None
    descanso: Optional[str] = None
    composicion_corporal: Optional[str] = None
    comida: Optional[str] = None
    suplementacion: Optional[str] = None
    recomendaciones: Optional[str] = None


# Datos de salida de un expediente de nutricion
class NutritionRecordOut(NutritionRecordCreate):

    id: str
    fecha: datetime
    specialist_id: str
    specialist: RecordSpecialistOut
    antropometria_file: Optional[str] = None
    bioimpedancia_file: Optional[str] = None

    class Config:
        from_attributes = True


# Unifica la informacion del paciente y sus expedientes clinicos
class UnifiedRecord(BaseModel):

    patient: PatientOut
    medicina: list[MedicalRecordOut]
    odontologia: list[DentalRecordOut]
    psicologia: list[PsychRecordOut]
    fisioterapia: list[PhysioRecordOut]
    nutricion: list[NutritionRecordOut]


# Datos de salida de los registros de auditoria
class AuditLogOut(BaseModel):

    id: str
    user_id: Optional[str] = None
    correo_usado: Optional[str] = None
    accion: str
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# Datos de salida del codigo OTP de recuperacion
class OTPCodeOut(BaseModel):

    correo: str
    code: str
    expires_at: datetime

    class Config:
        from_attributes = True


# Actualiza las referencias entre modelos de Pydantic
TokenResponse.model_rebuild()