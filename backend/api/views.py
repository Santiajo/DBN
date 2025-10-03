from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

@api_view(['POST']) # Solo permite solicitudes POST
@permission_classes([AllowAny]) # Permite que cualquiera pueda acceder a esta vista
# Vista para registrar un nuevo usuario
def register_view(request):
    # Utiliza el serializer de registro de usuarios para validar y guardar los datos del usuario
    serializer = RegisterSerializer(data=request.data)
    # Si los datos son válidos, guarda el nuevo usuario y devuelve un mensaje de éxito
    if serializer.is_valid():
        serializer.save() # Llama al método create del serializer
        return Response({"message": "Usuario creado con éxito"}, status=201)
    # Si los datos no son válidos, devuelve los errores de validación
    return Response(serializer.errors, status=400)

@api_view(['POST']) # Solo permite solicitudes POST
@permission_classes([AllowAny]) # Permite que cualquiera pueda acceder a esta vista
# Vista para activar la cuenta de un usuario mediante un enlace con token
def activate_account_view(request, uidb64, token):
    try:
        # Decodifica el uid y obtiene el usuario correspondiente
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
        
    # Verifica el token y activa la cuenta si es válido
    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True # Activa el usuario
        user.save() # Guarda los cambios
        return Response({"message": "Cuenta activada exitosamente."}, status=200)
    else:
        return Response({"error": "El enlace de activación es inválido."}, status=400)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
class PersonajeViewSet(viewsets.ModelViewSet):
    queryset = Personaje.objects.all()
    serializer_class = PersonajeSerializer

class ObjetoViewSet(viewsets.ModelViewSet):
    queryset = Objeto.objects.all()
    serializer_class = ObjetoSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ['Name', 'Type']    

class RecetaViewSet(viewsets.ModelViewSet):
    queryset= Receta.objects.all()
    serializer_class = RecetaSerializer

class IngredienteViewSet(viewsets.ModelViewSet):
    queryset= Ingredientes.objects.all()
    serializer_class = IngredientesSerializer