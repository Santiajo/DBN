from rest_framework import serializers, validators
from django.contrib.auth.models import User

# Serializer para registro de usuarios
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        # Definimos el modelo y los campos que se van a utilizar
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name')
        # Configuramos los atributos adicionales para los campos
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {
                # Añadimos un validador para asegurar que el email es único, requerido y no puede estar en blanco
                "required": True,
                "allow_blank": False,
                "validators": [
                    validators.UniqueValidator(
                        User.objects.all(), "Ya hay una cuenta asociada a ese email." 
                    )
                ]
            }
        }

    # Método para crear un nuevo usuario con los datos validados
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=False  # El usuario se crea como inactivo hasta que verifique su email
        )
        return user

