import logging
import smtplib
from email.mime.text import MIMEText

from . import config


# Configura el registro de eventos relacionados con el envio de correos
logger = logging.getLogger("medisys.mailer")


# Envia por correo el codigo OTP para recuperar la contrasena
def send_otp_email(to_email: str, code: str) -> None:

    # Si no hay servidor SMTP configurado, registra el codigo en el log
    if not config.SMTP_HOST:
        logger.info(f"OTP para {to_email}: {code}")
        return

    # Crea el contenido del correo con el codigo de verificacion
    msg = MIMEText(
        f"Tu código de verificación para restablecer tu contraseña es: {code}\n"
        f"Este código expira en 15 minutos."
    )

    # Configura los datos principales del correo
    msg["Subject"] = "Código de recuperación de contraseña - Sistema Médico"
    msg["From"] = config.SMTP_FROM
    msg["To"] = to_email

    try:

        # Establece la conexion con el servidor SMTP
        with smtplib.SMTP(
            config.SMTP_HOST,
            config.SMTP_PORT,
            timeout=10
        ) as server:

            # Activa TLS para proteger la comunicacion con el servidor
            if config.SMTP_USE_TLS:
                server.starttls()

            # Inicia sesion en el servidor SMTP si se configuraron credenciales
            if config.SMTP_USER:
                server.login(
                    config.SMTP_USER,
                    config.SMTP_PASSWORD
                )

            # Envia el correo al destinatario
            server.sendmail(
                config.SMTP_FROM,
                [to_email],
                msg.as_string()
            )

    except Exception:

        # Registra el error si el correo no pudo ser enviado
        logger.exception(
            "Fallo al enviar OTP por correo a %s",
            to_email
        )