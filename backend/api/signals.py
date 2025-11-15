# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from django.contrib.auth.models import User
# from django.core.mail import send_mail
# from django.conf import settings
# from django.contrib.auth.tokens import default_token_generator
# from django.utils.http import urlsafe_base64_encode
# from django.utils.encoding import force_bytes
# from decouple import config # Importar decouple para leer variables de entorno

# # Signal para enviar email de verificación al crear un nuevo usuario
# @receiver(post_save, sender=User)
# def send_verification_email(sender, instance, created, **kwargs):
#     # Solo enviar email si el usuario es nuevo y no está activo
#     if created and not instance.is_active:
#         # Generar token y uid
#         token = default_token_generator.make_token(instance)
#         uid = urlsafe_base64_encode(force_bytes(instance.pk))
        
#         # Leer la URL del frontend desde las variables de entorno
#         frontend_url = config('FRONTEND_URL')

#         # Construir URL de verificación (apuntando al frontend)
#         # El frontend tomará el uid y token y hará una petición a la API
#         verification_url = f"{frontend_url}/activate/{uid}/{token}/"

#         # Enviar email
#         subject = 'Activa tu cuenta'
#         message = f'Hola {instance.username},\n\n' \
#                   f'Por favor, haz clic en el siguiente enlace para activar tu cuenta:\n' \
#                   f'{verification_url}\n\n' \
#                   f'Gracias.'
#         send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.email])