from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from rest_framework import viewsets, status
from .models import *
from .serializers import *
from rest_framework.permissions import IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from django.db import transaction
from django.db.models import F

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

@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminUser])  # Solo admin puede eliminar
def delete_user_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response({"success": True, "message": "Usuario eliminado correctamente"}, status=200)
    except User.DoesNotExist:
        return Response({"success": False, "message": "Usuario no encontrado"}, status=404)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
class PersonajeViewSet(viewsets.ModelViewSet):
    serializer_class = PersonajeSerializer

    def get_queryset(self):
        return Personaje.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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

class InventarioPersonajeViewSet(viewsets.ModelViewSet):
    serializer_class = InventarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        personaje_pk = self.kwargs['personaje_pk']
        return Inventario.objects.filter(
            personaje__user=self.request.user, 
            personaje_id=personaje_pk
        )

    def perform_create(self, serializer):
        personaje_pk = self.kwargs['personaje_pk']
        personaje = Personaje.objects.get(pk=personaje_pk, user=self.request.user)
        serializer.save(personaje=personaje)


class ProficienciaViewSet(viewsets.ModelViewSet):
    serializer_class = ProficienciaSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        """
        Esta vista solo debe mostrar las proficiencias
        de los personajes del usuario autenticado.
        """
        return Proficiencia.objects.filter(personaje__user=self.request.user)


class HabilidadViewSet(viewsets.ModelViewSet):
    queryset = Habilidad.objects.all()
    serializer_class = HabilidadSerializer
    permission_classes = [IsAuthenticated]

class BonusProficienciaViewSet(viewsets.ModelViewSet):
    queryset = BonusProficiencia.objects.all()
    serializer_class = BonusProficienciaSerializer
    permission_classes = [IsAuthenticated]


class TrabajoViewSet(viewsets.ModelViewSet):
    queryset = Trabajo.objects.all()
    serializer_class = TrabajoSerializer
    permission_classes = [IsAuthenticated]  # o IsAdminUser si se restringir más


class PagoRangoViewSet(viewsets.ModelViewSet):
    serializer_class = PagoRangoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Si viene de ruta nested (/trabajos/1/pagos/), filtrar por trabajo
        trabajo_pk = self.kwargs.get('trabajo_pk')
        if trabajo_pk is not None:
            return PagoRango.objects.filter(trabajo_id=trabajo_pk)
        # Si es ruta normal (/pagos-rango/), devolver todos
        return PagoRango.objects.all()

    def perform_create(self, serializer):
        # Si viene de ruta nested, asignar automáticamente el trabajo
        trabajo_pk = self.kwargs.get('trabajo_pk')
        if trabajo_pk is not None:
            trabajo = Trabajo.objects.get(id=trabajo_pk)
            serializer.save(trabajo=trabajo)
        else:
            # Para ruta normal, el trabajo debe venir en los datos
            serializer.save()

class TrabajoRealizadoViewSet(viewsets.ModelViewSet):
    queryset = TrabajoRealizado.objects.all()
    serializer_class = TrabajoRealizadoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Esta vista solo debe mostrar los trabajos realizados
        por los personajes del usuario autenticado.
        """
        return TrabajoRealizado.objects.filter(personaje__user=self.request.user)

    def perform_create(self, serializer):
        """
        Sobrescribe la creación para:
        1. Validar que el personaje pertenece al usuario.
        2. Validar que el personaje tiene suficiente tiempo libre.
        3. Ejecutar todo en una transacción atómica.
        4. Actualizar el oro y tiempo libre del personaje.
        """

        personaje_obj = serializer.validated_data.get('personaje')
        dias_gastados = serializer.validated_data.get('dias_trabajados', 1)

        try:

            personaje = Personaje.objects.get(id=personaje_obj.id, user=self.request.user)
        except Personaje.DoesNotExist:
            raise serializers.ValidationError("Este personaje no te pertenece.")

        if personaje.tiempo_libre < dias_gastados:
            raise serializers.ValidationError(
                f"No tienes suficientes días de tiempo libre. Tienes {personaje.tiempo_libre}, necesitas {dias_gastados}."
            )

        try:
            with transaction.atomic():
                trabajo_realizado = serializer.save(personaje=personaje) 

                pago_ganado = trabajo_realizado.pago_total
                
                personaje.oro = F('oro') + pago_ganado
                personaje.tiempo_libre = F('tiempo_libre') - dias_gastados
                personaje.save(update_fields=['oro', 'tiempo_libre'])

                personaje.refresh_from_db() 

        except Exception as e:
            raise serializers.ValidationError(f"Error en la transacción: {str(e)}")

# ViewSet para el CRUD de Tienda
class TiendaViewSet(viewsets.ModelViewSet):
    queryset = Tienda.objects.all()
    serializer_class = TiendaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAdminUser]
    search_fields = ['nombre', 'npc_asociado']

# ViewSet para gestionar el inventario DE UNA TIENDA ESPECÍFICA
class ObjetoTiendaViewSet(viewsets.ModelViewSet):
    serializer_class = ObjetoTiendaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAdminUser]

    def get_queryset(self):
        return ObjetoTienda.objects.filter(tienda_id=self.kwargs['tienda_pk'])

    def perform_create(self, serializer):
        serializer.save(tienda_id=self.kwargs['tienda_pk'])
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comprar_objeto(request, personaje_pk):
    try:
        personaje = Personaje.objects.get(pk=personaje_pk, user=request.user)
        objeto_tienda_id = request.data.get('objeto_tienda_id')
        cantidad = int(request.data.get('cantidad', 1))
        
        if not objeto_tienda_id:
            return Response({"error": "Falta el ID del objeto de la tienda."}, status=status.HTTP_400_BAD_REQUEST)

        objeto_tienda = ObjetoTienda.objects.select_related('objeto').get(pk=objeto_tienda_id)
        costo_total = (objeto_tienda.precio_personalizado or int(objeto_tienda.objeto.Value)) * cantidad

        if personaje.oro < costo_total:
            return Response({"error": "No tienes suficiente oro."}, status=status.HTTP_400_BAD_REQUEST)
        
        if objeto_tienda.stock < cantidad:
            return Response({"error": "La tienda no tiene suficiente stock."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            personaje.oro -= costo_total
            personaje.save()

            objeto_tienda.stock -= cantidad
            objeto_tienda.save()

            item_inventario, created = Inventario.objects.get_or_create(
                personaje=personaje,
                objeto=objeto_tienda.objeto,
                defaults={'cantidad': 0}
            )
            item_inventario.cantidad += cantidad
            item_inventario.save()

        return Response({"success": f"¡Compra exitosa! Has comprado {cantidad}x {objeto_tienda.objeto.Name}."}, status=status.HTTP_200_OK)

    except Personaje.DoesNotExist:
        return Response({"error": "Personaje no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except ObjetoTienda.DoesNotExist:
        return Response({"error": "El objeto no está disponible en esta tienda."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@api_view(['GET'])
def debug_trabajo_pagos(request, trabajo_pk):
    """Endpoint para debug de rutas nested"""
    from django.urls import resolve, get_resolver
    print(f"🔍 Debug: trabajo_pk = {trabajo_pk}")
    print(f"🔍 Debug: kwargs = {request.resolver_match.kwargs if hasattr(request, 'resolver_match') else 'No resolver_match'}")
    return Response({
        'trabajo_pk': trabajo_pk,
        'message': 'Endpoint de debug funcionando'
    })

