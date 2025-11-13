from rest_framework import serializers, validators
from django.contrib.auth.models import User
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
                # Validador para asegurar que el email es único, requerido y no puede estar en blanco
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
            is_active=True,  # El usuario se crea como activo inmediatamente
            is_staff=validated_data.get("is_staff", False) # Para determinar si es admin (True) o user normal (False)
        )
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añade claims personalizados al payload del token
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['id'] = user.id
        return token

class PersonajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Personaje
        fields = '__all__'
        read_only_fields = ['user']

class ObjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Objeto
        fields = '__all__'

class IngredientesSerializer(serializers.ModelSerializer):
    # Muestra el nombre del ingrediente en lugar de solo la ID
    nombre_ingrediente = serializers.CharField(source='objeto.Name', read_only=True)

    class Meta:
        model = Ingredientes
        fields = ['id', 'receta', 'objeto', 'nombre_ingrediente', 'cantidad']
        # 'objeto' sigue enviando la ID para POST/PUT

class RecetaSerializer(serializers.ModelSerializer):
    # Muestra el nombre del objeto final
    nombre_objeto_final = serializers.CharField(source='objeto_final.Name', read_only=True)
    # Incluye los ingredientes anidados
    ingredientes = IngredientesSerializer(many=True, read_only=True)

    class Meta:
        model = Receta
        fields = [
            'id',
            'objeto_final',
            'nombre_objeto_final',
            'ingredientes',
            'cantidad_final',
            'es_magico',
            'oro_necesario',
            'dificultad'
        ]

class InventarioSerializer(serializers.ModelSerializer):
    objeto_nombre = serializers.CharField(source='objeto.Name', read_only=True)

    class Meta:
        model = Inventario
        fields = ['id', 'objeto', 'objeto_nombre', 'cantidad']



class ProficienciaSerializer(serializers.ModelSerializer):
    personaje_nombre = serializers.CharField(source='personaje.nombre_personaje', read_only=True)
    habilidad_nombre = serializers.CharField(source='habilidad.nombre', read_only=True)

    class Meta:
        model = Proficiencia
        fields = ['id', 'personaje', 'personaje_nombre', 'habilidad', 'habilidad_nombre', 'es_proficiente']


class TrabajoSerializer(serializers.ModelSerializer):
    requisito_habilidad_nombre = serializers.CharField(source='requisito_habilidad.nombre', read_only=True)
    
    # --- AÑADE ESTA LÍNEA ---
    requisito_habilidad_estadistica = serializers.CharField(source='requisito_habilidad.estadistica_asociada', read_only=True)
    
    pagos = serializers.SerializerMethodField() 

    class Meta:
        model = Trabajo
        fields = [
            'id', 
            'nombre', 
            'requisito_habilidad', 
            'requisito_habilidad_nombre', 
            
            # --- Y AÑÁDELA AQUÍ TAMBIÉN ---
            'requisito_habilidad_estadistica', 
            
            'rango_maximo', 
            'descripcion', 
            'beneficio', 
            'pagos'
        ]

    def get_pagos(self, obj):
        """Obtener los pagos relacionados con este trabajo"""
        pagos = obj.pagos.all().order_by('rango')
        return PagoRangoSerializer(pagos, many=True).data


class HabilidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habilidad
        fields = '__all__'


class BonusProficienciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = BonusProficiencia
        fields = '__all__'


class PagoRangoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoRango
        fields = '__all__'

class TrabajoRealizadoSerializer(serializers.ModelSerializer):
    pago_total = serializers.FloatField(read_only=True)

    class Meta:
        model = TrabajoRealizado
        fields = '__all__'
        
class ObjetoTiendaSerializer(serializers.ModelSerializer):
    nombre_objeto = serializers.CharField(source='objeto.Name', read_only=True)

    class Meta:
        model = ObjetoTienda
        fields = ['id', 'objeto', 'nombre_objeto', 'stock', 'precio_personalizado']


class TiendaSerializer(serializers.ModelSerializer):
    inventario = ObjetoTiendaSerializer(many=True, read_only=True)

    class Meta:
        model = Tienda
        fields = ['id', 'nombre', 'descripcion', 'npc_asociado', 'inventario']
