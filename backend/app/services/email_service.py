from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from app.config.settings import (
    MAIL_USERNAME,
    MAIL_PASSWORD,
    MAIL_FROM,
)


print("MAIL_USERNAME:", MAIL_USERNAME)
print("MAIL_FROM:", MAIL_FROM)
print("MAIL_PASSWORD loaded:", bool(MAIL_PASSWORD))

mail_config = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)


async def send_email(
    recipient: str,
    subject: str,
    body: str,
):
    print("========== EMAIL START ==========")
    print("Recipient:", recipient)
    print("Subject:", subject)

    message = MessageSchema(
        subject=subject,
        recipients=[recipient],
        body=body,
        subtype="html",
    )

    mail = FastMail(mail_config)

    await mail.send_message(message)

    print("EMAIL SENT SUCCESSFULLY")
    print("=================================")