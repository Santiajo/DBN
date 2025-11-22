from django.shortcuts import get_object_or_404, render
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
import rest_framework.filters as filters

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

# DESACTIVADO: Activación por email deshabilitada temporalmente
# @api_view(['POST']) # Solo permite solicitudes POST
# @permission_classes([AllowAny]) # Permite que cualquiera pueda acceder a esta vista
# # Vista para activar la cuenta de un usuario mediante un enlace con token
# def activate_account_view(request, uidb64, token):
#     try:
#         # Decodifica el uid y obtiene el usuario correspondiente
#         uid = force_str(urlsafe_base64_decode(uidb64))
#         user = User.objects.get(pk=uid)
#     except (TypeError, ValueError, OverflowError, User.DoesNotExist):
#         user = None
        
#     # Verifica el token y activa la cuenta si es válido
#     if user is not None and default_token_generator.check_token(user, token):
#         user.is_active = True # Activa el usuario
#         user.save() # Guarda los cambios
#         return Response({"message": "Cuenta activada exitosamente."}, status=200)
#     else:
#         return Response({"error": "El enlace de activación es inválido."}, status=400)

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
    queryset = Ingredientes.objects.all()
    serializer_class = IngredientesSerializer
    permission_classes = [IsAuthenticated]  # 
    
    def get_queryset(self):
        """Filtrar ingredientes por receta si se proporciona el parámetro"""
        queryset = Ingredientes.objects.all()
        receta_id = self.request.query_params.get('receta', None)
        
        if receta_id is not None:
            queryset = queryset.filter(receta_id=receta_id)
        
        return queryset

# Mixin para lookup híbrido por PK o slug
class HybridLookupMixin:
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        # Si el valor es un número entero, buscamos por PK
        if lookup_value.isdigit():
            filter_kwargs = {'pk': lookup_value}
        else:
            # Si no, buscamos por el campo slug definido en lookup_field
            filter_kwargs = {self.lookup_field: lookup_value}

        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj

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
        1. Validar propiedad y tiempo libre.
        2. Ejecutar todo en una transacción atómica.
        3. Actualizar oro y tiempo libre.
        4. (NUEVO) Actualizar el progreso del rango del trabajo.
        """

        personaje_obj = serializer.validated_data.get('personaje')
        trabajo_obj = serializer.validated_data.get('trabajo') # 
        dias_gastados = serializer.validated_data.get('dias_trabajados', 1)
        rango_trabajado = serializer.validated_data.get('rango') #

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

                progreso, created = ProgresoTrabajo.objects.get_or_create(
                    personaje=personaje,
                    trabajo=trabajo_obj
                )

                if rango_trabajado == progreso.rango_actual and progreso.rango_actual < 5:

                    progreso.dias_acumulados_rango = F('dias_acumulados_rango') + dias_gastados
                    progreso.save()
                    progreso.refresh_from_db()

                    try:
                        rango_info = PagoRango.objects.get(
                            trabajo=trabajo_obj, 
                            rango=progreso.rango_actual
                        )
                        dias_necesarios = rango_info.dias_para_siguiente_rango

                        if progreso.dias_acumulados_rango >= dias_necesarios:
                            progreso.rango_actual = F('rango_actual') + 1
                            progreso.dias_acumulados_rango = 0 
                            progreso.save()
                    
                    except PagoRango.DoesNotExist:
                        raise serializers.ValidationError(
                            f"Error de configuración: No se encontró 'PagoRango' para {trabajo_obj.nombre} Rango {progreso.rango_actual}"
                        )

        except Exception as e:
            raise serializers.ValidationError(f"Error en la transacción: {str(e)}")

class ProgresoTrabajoViewSet(viewsets.ModelViewSet):
    """
    Permite a los usuarios ver su propio progreso en los trabajos.
    """
    serializer_class = ProgresoTrabajoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtra para devolver solo el progreso del usuario logueado
        return ProgresoTrabajo.objects.filter(personaje__user=self.request.user)

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
    print(f" Debug: trabajo_pk = {trabajo_pk}")
    print(f" Debug: kwargs = {request.resolver_match.kwargs if hasattr(request, 'resolver_match') else 'No resolver_match'}")
    return Response({
        'trabajo_pk': trabajo_pk,
        'message': 'Endpoint de debug funcionando'
    })


# views.py - AÑADIR ESTE VIEWSET

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
import random

from .models import (
    Personaje, Receta, Inventario, ProgresoReceta, 
    CompetenciaHerramienta, HistorialTirada, Ingredientes
)
from .serializers import (
    RecetaDisponibleSerializer, ProgresoRecetaSerializer,
    IniciarCraftingSerializer, TiradaCraftingSerializer,
    CompetenciaHerramientaSerializer
)


class CraftingViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def recetas_disponibles(self, request):
        """Lista todas las recetas y marca cuáles puede craftear el personaje"""
        personaje_id = request.query_params.get('personaje_id')
        
        if not personaje_id:
            return Response(
                {'error': 'personaje_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
        except Personaje.DoesNotExist:
            return Response(
                {'error': 'Personaje no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        recetas = Receta.objects.all()
        serializer = RecetaDisponibleSerializer(
            recetas,
            many=True,
            context={'personaje': personaje}
        )
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def iniciar_crafting(self, request):
        """Inicia el proceso de crafting de una receta"""
        serializer = IniciarCraftingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        receta_id = serializer.validated_data['receta_id']
        personaje_id = serializer.validated_data['personaje_id']
        
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
            receta = Receta.objects.get(id=receta_id)
        except (Personaje.DoesNotExist, Receta.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        with transaction.atomic():
            # 1. Verificar ingredientes normales
            for ing in receta.ingredientes.all():
                inventario_item = Inventario.objects.filter(
                    personaje=personaje,
                    objeto=ing.objeto
                ).first()
                
                if not inventario_item or inventario_item.cantidad < ing.cantidad:
                    return Response(
                        {'error': f'No tienes suficiente {ing.objeto.Name}. Necesitas {ing.cantidad}, tienes {inventario_item.cantidad if inventario_item else 0}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # 2. Verificar material raro si es mágico
            if receta.es_magico and receta.material_raro:
                material_inv = Inventario.objects.filter(
                    personaje=personaje,
                    objeto=receta.material_raro
                ).first()
                
                if not material_inv or material_inv.cantidad < 1:
                    return Response(
                        {'error': f'No tienes el material raro necesario: {receta.material_raro.Name}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # 3. Verificar herramienta en inventario
            if receta.herramienta:
                tiene_herramienta = Inventario.objects.filter(
                    personaje=personaje,
                    objeto__Name__icontains=receta.herramienta
                ).exists()
                
                if not tiene_herramienta:
                    return Response(
                        {'error': f'Necesitas la herramienta: {receta.herramienta}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # 4. Obtener o crear competencia con la herramienta
            competencia, created = CompetenciaHerramienta.objects.get_or_create(
                personaje=personaje,
                nombre_herramienta=receta.herramienta,
                defaults={'grado': 'Novato', 'exitos_acumulados': 0}
            )
            
            # 5. Verificar grado mínimo requerido
            grados_orden = ['Novato', 'Aprendiz', 'Experto', 'Maestro Artesano', 'Gran Maestro']
            grado_actual_idx = grados_orden.index(competencia.grado)
            grado_requerido_idx = grados_orden.index(receta.grado_minimo_requerido)
            
            if grado_actual_idx < grado_requerido_idx:
                return Response(
                    {'error': f'Necesitas ser al menos {receta.grado_minimo_requerido} con {receta.herramienta}. Actualmente eres {competencia.grado}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 6. CONSUMIR INGREDIENTES Y MATERIALES AL INICIO
            for ing in receta.ingredientes.all():
                inventario_item = Inventario.objects.get(
                    personaje=personaje,
                    objeto=ing.objeto
                )
                inventario_item.cantidad -= ing.cantidad
                if inventario_item.cantidad <= 0:
                    inventario_item.delete()
                else:
                    inventario_item.save()
            
            # Consumir material raro si es mágico
            if receta.es_magico and receta.material_raro:
                material_inv = Inventario.objects.get(
                    personaje=personaje,
                    objeto=receta.material_raro
                )
                material_inv.cantidad -= 1
                if material_inv.cantidad <= 0:
                    material_inv.delete()
                else:
                    material_inv.save()
            
            # 7. Crear progreso
            progreso = ProgresoReceta.objects.create(
                personaje=personaje,
                receta=receta,
                competencia_utilizada=competencia,
                exitos_requeridos=receta.obtener_exitos_requeridos() if receta.es_magico else 0
            )
            
            mensaje = f"Crafting iniciado. Ingredientes consumidos."
            if created:
                mensaje += f" Has comenzado a usar {receta.herramienta} como Novato."
            
            response_serializer = ProgresoRecetaSerializer(progreso)
            return Response({
                'progreso': response_serializer.data,
                'mensaje': mensaje,
                'competencia_creada': created
            }, status=status.HTTP_201_CREATED)
    
    # views.py - CORREGIR en CraftingViewSet

    @action(detail=False, methods=['post'])
    def realizar_tirada(self, request):
        """Realiza una tirada de crafting"""
        serializer = TiradaCraftingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        progreso_id = serializer.validated_data['progreso_id']
        
        try:
            progreso = ProgresoReceta.objects.select_related(
                'personaje', 'receta', 'competencia_utilizada'
            ).get(
                id=progreso_id,
                personaje__user=request.user
            )
        except ProgresoReceta.DoesNotExist:
            return Response(
                {'error': 'Progreso no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if progreso.estado == 'completado':
            return Response(
                {'error': 'Este crafting ya está completado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        personaje = progreso.personaje
        competencia = progreso.competencia_utilizada
        receta = progreso.receta
        
        # DIFERENTE LÓGICA PARA MÁGICOS Y NO MÁGICOS
        if receta.es_magico:
            # OBJETOS MÁGICOS: No se cobra por tirada, solo al completar
            # Solo verificamos que tenga los recursos finales disponibles
            coste_magico = receta.obtener_coste_magico()
            
            if personaje.tiempo_libre < coste_magico['dias']:
                return Response(
                    {'error': f"Necesitas {coste_magico['dias']} días libres para completar este objeto"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if personaje.oro < coste_magico['oro']:
                return Response(
                    {'error': f"Necesitas {coste_magico['oro']} gp para completar este objeto"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # OBJETOS NO MÁGICOS: Cobro por día trabajado
            info_grado = competencia.obtener_info_grado()
            gasto_oro = info_grado['gasto_oro']
            
            if personaje.tiempo_libre < 1:
                return Response(
                    {'error': 'No tienes suficiente tiempo libre (Downtime)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if personaje.oro < gasto_oro:
                return Response(
                    {'error': f'No tienes suficiente oro. Necesitas {gasto_oro} gp'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        with transaction.atomic():
            # Calcular DC
            dc = receta.obtener_dc()
            
            # Tirada d20
            resultado_dado = random.randint(1, 20)
            modificador = competencia.obtener_modificador()
            resultado_total = resultado_dado + modificador
            
            exito = resultado_total >= dc
            
            oro_sumado = 0
            oro_gastado = 0
            dias_gastados = 0
            mensaje_resultado = ""
            subio_grado = False
            nuevo_grado = None
            
            if receta.es_magico:
                # ✅ OBJETOS MÁGICOS: Sistema de éxitos SIN COSTE POR TIRADA
                if exito:
                    progreso.exitos_conseguidos += 1
                    mensaje_resultado = f"¡Éxito! Progreso: {progreso.exitos_conseguidos}/{progreso.exitos_requeridos} éxitos"
                    
                    # Verificar si completó
                    if progreso.exitos_conseguidos >= progreso.exitos_requeridos:
                        progreso.estado = 'completado'
                        progreso.fecha_completado = timezone.now()
                        
                        # ✅ COBRAR EL COSTE TOTAL AL FINALIZAR
                        coste_magico = receta.obtener_coste_magico()
                        personaje.tiempo_libre -= coste_magico['dias']
                        personaje.oro -= coste_magico['oro']
                        personaje.save()
                        
                        dias_gastados = coste_magico['dias']
                        oro_gastado = coste_magico['oro']
                        
                        # Añadir objeto al inventario
                        inventario_item, created = Inventario.objects.get_or_create(
                            personaje=personaje,
                            objeto=receta.objeto_final,
                            defaults={'cantidad': receta.cantidad_final}
                        )
                        if not created:
                            inventario_item.cantidad += receta.cantidad_final
                            inventario_item.save()
                        
                        # Sumar éxito a competencia
                        competencia.exitos_acumulados += 1
                        competencia.save()
                        
                        # Verificar subida de grado
                        nuevo_grado = competencia.verificar_subida_grado()
                        if nuevo_grado:
                            subio_grado = True
                            competencia.refresh_from_db()
                        
                        mensaje_resultado = f"¡Objeto mágico completado! {receta.objeto_final.Name} añadido a tu inventario. Coste: {coste_magico['dias']} días, {coste_magico['oro']} gp"
                else:
                    mensaje_resultado = f"Fallo. Progreso: {progreso.exitos_conseguidos}/{progreso.exitos_requeridos} éxitos (sin coste)"
            
            else:
                # OBJETOS NO MÁGICOS: Sistema existente (cobro por día)
                info_grado = competencia.obtener_info_grado()
                oro_gastado = info_grado['gasto_oro']
                dias_gastados = 1
                
                if exito:
                    oro_sumado = info_grado['suma_oro']
                    progreso.oro_acumulado += oro_sumado
                    mensaje_resultado = f"¡Éxito! Sumaste {oro_sumado} gp. Progreso: {progreso.oro_acumulado}/{receta.oro_necesario} gp"
                    
                    if progreso.oro_acumulado >= receta.oro_necesario:
                        progreso.estado = 'completado'
                        progreso.fecha_completado = timezone.now()
                        
                        inventario_item, created = Inventario.objects.get_or_create(
                            personaje=personaje,
                            objeto=receta.objeto_final,
                            defaults={'cantidad': receta.cantidad_final}
                        )
                        if not created:
                            inventario_item.cantidad += receta.cantidad_final
                            inventario_item.save()
                        
                        competencia.exitos_acumulados += 1
                        competencia.save()
                        
                        nuevo_grado = competencia.verificar_subida_grado()
                        if nuevo_grado:
                            subio_grado = True
                            competencia.refresh_from_db()
                        
                        mensaje_resultado = f"¡Objeto completado! {receta.objeto_final.Name} añadido a tu inventario."
                else:
                    mensaje_resultado = f"Fallo. Progreso: {progreso.oro_acumulado}/{receta.oro_necesario} gp"
                
                # Gastar recursos por día (solo no mágicos)
                personaje.tiempo_libre -= dias_gastados
                personaje.oro -= oro_gastado
                personaje.save()
            
            # Actualizar días trabajados
            progreso.dias_trabajados += 1
            progreso.save()
            
            # Registrar tirada
            tirada = HistorialTirada.objects.create(
                progreso=progreso,
                resultado_dado=resultado_dado,
                modificador=modificador,
                resultado_total=resultado_total,
                exito=exito,
                oro_sumado=oro_sumado,
                oro_gastado=oro_gastado
            )
            
            # Preparar respuesta
            response_data = {
                'tirada': {
                    'resultado_dado': resultado_dado,
                    'modificador': modificador,
                    'resultado_total': resultado_total,
                    'dc': dc,
                    'exito': exito,
                    'oro_sumado': oro_sumado,
                    'oro_gastado': oro_gastado,
                    'dias_gastados': dias_gastados,
                    'mensaje': mensaje_resultado
                },
                'progreso': ProgresoRecetaSerializer(progreso).data,
                'personaje': {
                    'oro': personaje.oro,
                    'tiempo_libre': personaje.tiempo_libre
                }
            }
            
            if subio_grado:
                response_data['subida_grado'] = {
                    'mensaje': f'¡Has ascendido a {nuevo_grado} con {competencia.nombre_herramienta}!',
                    'nuevo_grado': nuevo_grado,
                    'competencia': CompetenciaHerramientaSerializer(competencia).data
                }
            
            return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def mis_progresos(self, request):
        """Lista los progresos de crafting del personaje"""
        personaje_id = request.query_params.get('personaje_id')
        
        if not personaje_id:
            return Response(
                {'error': 'personaje_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
        except Personaje.DoesNotExist:
            return Response(
                {'error': 'Personaje no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Separar por estado
        en_progreso = ProgresoReceta.objects.filter(
            personaje=personaje,
            estado='en_progreso'
        ).order_by('-fecha_inicio')
        
        completados = ProgresoReceta.objects.filter(
            personaje=personaje,
            estado='completado'
        ).order_by('-fecha_completado')
        
        return Response({
            'en_progreso': ProgresoRecetaSerializer(en_progreso, many=True).data,
            'completados': ProgresoRecetaSerializer(completados, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def mis_competencias(self, request):
        """Lista todas las competencias con herramientas del personaje"""
        personaje_id = request.query_params.get('personaje_id')
        
        if not personaje_id:
            return Response(
                {'error': 'personaje_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
        except Personaje.DoesNotExist:
            return Response(
                {'error': 'Personaje no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        competencias = CompetenciaHerramienta.objects.filter(
            personaje=personaje
        ).order_by('-grado', '-exitos_acumulados')
        
        serializer = CompetenciaHerramientaSerializer(competencias, many=True)
        return Response(serializer.data) 

    @action(detail=False, methods=['get'])
    def habilidades_investigacion(self, request):
        """
        Retorna las habilidades disponibles para investigación organizadas por fuente
        """
        habilidades_data = {
            'libros': [
                {'id': None, 'nombre': 'Investigation', 'estadistica': 'inteligencia'}
            ],
            'entrevistas': [
                {'id': None, 'nombre': 'Persuasion', 'estadistica': 'carisma'},
                {'id': None, 'nombre': 'Deception', 'estadistica': 'carisma'}
            ],
            'experimentos': [
                {'id': None, 'nombre': 'Survival', 'estadistica': 'sabiduria'},
                {'id': None, 'nombre': 'Perception', 'estadistica': 'sabiduria'}
            ],
            'campo': []  # Para herramientas
        }
        
        # Obtener IDs reales de las habilidades
        try:
            # Libros
            investigation = Habilidad.objects.get(nombre__iexact='investigacion')
            habilidades_data['libros'][0]['id'] = investigation.id
            
            # Entrevistas
            persuasion = Habilidad.objects.get(nombre__iexact='persuasion')
            deception = Habilidad.objects.get(nombre__iexact='engano')
            habilidades_data['entrevistas'][0]['id'] = persuasion.id
            habilidades_data['entrevistas'][1]['id'] = deception.id
            
            # Experimentos
            survival = Habilidad.objects.get(nombre__iexact='supervivencia')
            perception = Habilidad.objects.get(nombre__iexact='percepcion')
            habilidades_data['experimentos'][0]['id'] = survival.id
            habilidades_data['experimentos'][1]['id'] = perception.id
            
        except Habilidad.DoesNotExist:
            pass
        
        return Response(habilidades_data)
    
    @action(detail=False, methods=['post'])
    def iniciar_investigacion(self, request):
        """Inicia el proceso de investigación de un objeto para desbloquear una receta"""
        serializer = IniciarInvestigacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        receta_id = serializer.validated_data['receta_id']
        personaje_id = serializer.validated_data['personaje_id']
        objeto_investigado_id = serializer.validated_data['objeto_investigado_id']
        fuente_informacion = serializer.validated_data['fuente_informacion']
        habilidad_id = serializer.validated_data.get('habilidad_id')
        competencia_herramienta_id = serializer.validated_data.get('competencia_herramienta_id')
        
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
            receta = Receta.objects.get(id=receta_id)
            objeto_investigado = Objeto.objects.get(id=objeto_investigado_id)
        except (Personaje.DoesNotExist, Receta.DoesNotExist, Objeto.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validaciones
        with transaction.atomic():
            # 1. Verificar que la receta requiere investigación
            if not receta.requiere_investigacion:
                return Response(
                    {'error': 'Esta receta no requiere investigación'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 2. Verificar que no esté ya desbloqueada
            if RecetaDesbloqueada.objects.filter(personaje=personaje, receta=receta).exists():
                return Response(
                    {'error': 'Ya has desbloqueado esta receta'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 3. Verificar que el objeto investigado es investigable
            if not objeto_investigado.es_investigable:
                return Response(
                    {'error': 'Este objeto no es investigable'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 4. Verificar que el objeto está en la receta
            objeto_en_receta = False
            
            if receta.objeto_final and receta.objeto_final.id == objeto_investigado.id:
                objeto_en_receta = True
            
            for ing in receta.ingredientes.all():
                if ing.objeto.id == objeto_investigado.id:
                    objeto_en_receta = True
                    break
            
            if not objeto_en_receta:
                return Response(
                    {'error': 'Este objeto no está relacionado con esta receta'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 5. Verificar que tiene el objeto en inventario
            if not Inventario.objects.filter(personaje=personaje, objeto=objeto_investigado).exists():
                return Response(
                    {'error': f'No tienes {objeto_investigado.Name} en tu inventario'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 6. Verificar que no tenga una investigación activa de esta receta
            if ProgresoInvestigacion.objects.filter(
                personaje=personaje,
                receta=receta,
                estado='en_progreso'
            ).exists():
                return Response(
                    {'error': 'Ya tienes una investigación activa para esta receta'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 7. Obtener DC y éxitos necesarios según rareza del objeto
            dc = obtener_dc_investigacion(objeto_investigado.Rarity)
            exitos_requeridos = obtener_exitos_investigacion(objeto_investigado.Rarity)
            
            # 8. Validar fuente y habilidad/competencia
            habilidad = None
            competencia = None
            
            if fuente_informacion == 'campo':
                # Trabajo de campo: usar herramienta
                if not competencia_herramienta_id:
                    return Response(
                        {'error': 'Debes seleccionar una herramienta para trabajo de campo'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    competencia = CompetenciaHerramienta.objects.get(
                        id=competencia_herramienta_id,
                        personaje=personaje
                    )
                except CompetenciaHerramienta.DoesNotExist:
                    return Response(
                        {'error': 'Competencia con herramienta no encontrada'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Otras fuentes: usar habilidad
                if not habilidad_id:
                    return Response(
                        {'error': 'Debes seleccionar una habilidad'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                try:
                    habilidad = Habilidad.objects.get(id=habilidad_id)
                except Habilidad.DoesNotExist:
                    return Response(
                        {'error': 'Habilidad no encontrada'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # 9. Crear progreso de investigación
            progreso = ProgresoInvestigacion.objects.create(
                personaje=personaje,
                receta=receta,
                objeto_investigado=objeto_investigado,
                fuente_informacion=fuente_informacion,
                habilidad_utilizada=habilidad,
                competencia_utilizada=competencia,
                exitos_requeridos=exitos_requeridos,
                dc=dc
            )
            
            response_serializer = ProgresoInvestigacionSerializer(progreso)
            return Response({
                'progreso': response_serializer.data,
                'mensaje': f'Investigación iniciada. DC: {dc}, Éxitos necesarios: {exitos_requeridos}'
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def realizar_tirada_investigacion(self, request):
        """Realiza una tirada de investigación"""
        serializer = TiradaInvestigacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        progreso_id = serializer.validated_data['progreso_id']
        
        try:
            progreso = ProgresoInvestigacion.objects.select_related(
                'personaje', 'receta', 'objeto_investigado', 
                'habilidad_utilizada', 'competencia_utilizada'
            ).get(
                id=progreso_id,
                personaje__user=request.user
            )
        except ProgresoInvestigacion.DoesNotExist:
            return Response(
                {'error': 'Progreso de investigación no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if progreso.estado == 'completado':
            return Response(
                {'error': 'Esta investigación ya está completada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        personaje = progreso.personaje
        COSTE_DIA = 25  # Coste fijo por día
        
        # Verificar recursos
        if personaje.tiempo_libre < 1:
            return Response(
                {'error': 'No tienes suficiente tiempo libre (Downtime)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if personaje.oro < COSTE_DIA:
            return Response(
                {'error': f'No tienes suficiente oro. Necesitas {COSTE_DIA} gp'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Calcular modificador
            if progreso.fuente_informacion == 'campo':
                # Usar competencia con herramienta
                modificador = calcular_modificador_investigacion_herramienta(progreso.competencia_utilizada)
            else:
                # Usar habilidad
                modificador = calcular_modificador_investigacion_habilidad(
                    personaje, 
                    progreso.habilidad_utilizada
                )
            
            # Tirada d20
            resultado_dado = random.randint(1, 20)
            resultado_total = resultado_dado + modificador
            
            exito = resultado_total >= progreso.dc
            
            # Consumir recursos
            personaje.tiempo_libre -= 1
            personaje.oro -= COSTE_DIA
            personaje.save()
            
            # Actualizar progreso
            progreso.dias_trabajados += 1
            progreso.oro_gastado_total += COSTE_DIA
            
            mensaje_resultado = ""
            receta_desbloqueada = False
            
            if exito:
                progreso.exitos_conseguidos += 1
                mensaje_resultado = f"¡Éxito! Progreso: {progreso.exitos_conseguidos}/{progreso.exitos_requeridos} éxitos"
                
                # Verificar si completó la investigación
                if progreso.exitos_conseguidos >= progreso.exitos_requeridos:
                    progreso.estado = 'completado'
                    progreso.fecha_completado = timezone.now()
                    
                    # Desbloquear receta
                    RecetaDesbloqueada.objects.create(
                        personaje=personaje,
                        receta=progreso.receta
                    )
                    
                    receta_desbloqueada = True
                    mensaje_resultado = f"¡Investigación completada! Has desbloqueado la receta: {progreso.receta.nombre}"
            else:
                mensaje_resultado = f"Fallo. Progreso: {progreso.exitos_conseguidos}/{progreso.exitos_requeridos} éxitos"
            
            progreso.save()
            
            # Registrar tirada
            tirada = HistorialTiradaInvestigacion.objects.create(
                progreso=progreso,
                resultado_dado=resultado_dado,
                modificador=modificador,
                resultado_total=resultado_total,
                dc=progreso.dc,
                exito=exito,
                oro_gastado=COSTE_DIA
            )
            
            # Preparar respuesta
            response_data = {
                'tirada': {
                    'resultado_dado': resultado_dado,
                    'modificador': modificador,
                    'resultado_total': resultado_total,
                    'dc': progreso.dc,
                    'exito': exito,
                    'oro_gastado': COSTE_DIA,
                    'mensaje': mensaje_resultado
                },
                'progreso': ProgresoInvestigacionSerializer(progreso).data,
                'personaje': {
                    'oro': personaje.oro,
                    'tiempo_libre': personaje.tiempo_libre
                },
                'receta_desbloqueada': receta_desbloqueada
            }
            
            return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def mis_investigaciones(self, request):
        """Lista las investigaciones activas y completadas del personaje"""
        personaje_id = request.query_params.get('personaje_id')
        
        if not personaje_id:
            return Response(
                {'error': 'personaje_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
        except Personaje.DoesNotExist:
            return Response(
                {'error': 'Personaje no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Separar por estado
        en_progreso = ProgresoInvestigacion.objects.filter(
            personaje=personaje,
            estado='en_progreso'
        ).order_by('-fecha_inicio')
        
        completadas = ProgresoInvestigacion.objects.filter(
            personaje=personaje,
            estado='completado'
        ).order_by('-fecha_completado')
        
        return Response({
            'en_progreso': ProgresoInvestigacionSerializer(en_progreso, many=True).data,
            'completadas': ProgresoInvestigacionSerializer(completadas, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def recetas_desbloqueadas(self, request):
        """Lista todas las recetas desbloqueadas por el personaje"""
        personaje_id = request.query_params.get('personaje_id')
        
        if not personaje_id:
            return Response(
                {'error': 'personaje_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
        except Personaje.DoesNotExist:
            return Response(
                {'error': 'Personaje no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        recetas_desbloqueadas = RecetaDesbloqueada.objects.filter(
            personaje=personaje
        ).order_by('-fecha_desbloqueo')
        
        serializer = RecetaDesbloqueadaSerializer(recetas_desbloqueadas, many=True)
        return Response(serializer.data)
    
# Views para especies
class SpeciesViewSet(HybridLookupMixin, viewsets.ModelViewSet):
    queryset = Species.objects.all().prefetch_related('traits', 'traits__options')
    serializer_class = SpeciesSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = (filters.SearchFilter,)
    search_fields = ['name']

class TraitViewSet(viewsets.ModelViewSet):
    queryset = Trait.objects.all().select_related('species', 'parent_choice')
    serializer_class = TraitSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = (filters.SearchFilter,)
    search_fields = ['name', 'species__name']

# Views para clases
class DnDClassViewSet(HybridLookupMixin, viewsets.ModelViewSet):
    queryset = DnDClass.objects.all().prefetch_related('features', 'resources', 'skill_choices')
    serializer_class = DnDClassSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class ClassFeatureViewSet(viewsets.ModelViewSet):
    queryset = ClassFeature.objects.all()
    serializer_class = ClassFeatureSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ClassResourceViewSet(viewsets.ModelViewSet):
    queryset = ClassResource.objects.all()
    serializer_class = ClassResourceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# Views para subclases
class DnDSubclassViewSet(HybridLookupMixin, viewsets.ModelViewSet):
    queryset = DnDSubclass.objects.all().prefetch_related(
        'resources', 'skill_choices', 'features', 'features__options'
    ).select_related('dnd_class')
    serializer_class = DnDSubclassSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'dnd_class__name']

class SubclassFeatureViewSet(viewsets.ModelViewSet):
    queryset = SubclassFeature.objects.all()
    serializer_class = SubclassFeatureSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'dnd_subclass__name']

class SubclassResourceViewSet(viewsets.ModelViewSet):
    queryset = SubclassResource.objects.all()
    serializer_class = SubclassResourceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# Views para dotes
class DnDFeatViewSet(HybridLookupMixin, viewsets.ModelViewSet):
    queryset = DnDFeat.objects.all().prefetch_related('features', 'features__options').select_related('prerequisite_species', 'prerequisite_feat')
    serializer_class = DnDFeatSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'feat_type']

class FeatFeatureViewSet(viewsets.ModelViewSet):
    queryset = FeatFeature.objects.all()
    serializer_class = FeatFeatureSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# PARA GRUPOS

class PartyViewSet(viewsets.ModelViewSet):
    queryset = Party.objects.all()
    serializer_class = PartySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user)

    @action(detail=True, methods=['post'])
    def unirse(self, request, pk=None):
        """
        POST /api/grupos/{id}/unirse/
        Body: { "personaje_id": 12 }
        """
        party = self.get_object()
        personaje_id = request.data.get('personaje_id')

        # 1. Validar que el personaje existe y pertenece al usuario
        try:
            personaje = Personaje.objects.get(id=personaje_id, user=request.user)
        except Personaje.DoesNotExist:
            return Response({"error": "Personaje inválido o no te pertenece."}, status=400)

        # 2. Verificar si ya está unido
        if party.miembros.filter(id=personaje.id).exists():
             return Response({"message": "Ya eres miembro de esta party."}, status=200)

        # 3. Unir
        party.miembros.add(personaje)
        return Response({"success": f"{personaje.nombre_personaje} se ha unido a {party.nombre}"})


class InventarioPartyViewSet(viewsets.ModelViewSet):
    serializer_class = InventarioPartySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Permite filtrar por party: /api/inventario-party/?party=1
        party_id = self.request.query_params.get('party')
        if party_id:
            return InventarioParty.objects.filter(party_id=party_id)
        return InventarioParty.objects.all()

    @action(detail=False, methods=['post'])
    def donar_objeto(self, request):
        """
        Mueve un objeto del personaje a la party.
        POST /api/inventario-party/donar_objeto/
        Body: { "party_id": 1, "personaje_id": 5, "objeto_id": 10, "cantidad": 1 }
        """
        party_id = request.data.get('party_id')
        personaje_id = request.data.get('personaje_id')
        objeto_id = request.data.get('objeto_id')
        cantidad = int(request.data.get('cantidad', 1))

        if cantidad <= 0:
            return Response({"error": "La cantidad debe ser mayor a 0."}, status=400)

        try:
            with transaction.atomic():
                # 1. Validaciones de seguridad
                personaje = Personaje.objects.get(id=personaje_id, user=request.user)
                party = Party.objects.get(id=party_id)
                
                # (Opcional) Verificar que el personaje esté en la party
                if not party.miembros.filter(id=personaje.id).exists() and not request.user.is_staff:
                     return Response({"error": "Debes ser miembro de la party para donar."}, status=403)

                # 2. Obtener el ítem del inventario PERSONAL (y bloquear fila para evitar race conditions)
                item_personaje = Inventario.objects.select_for_update().get(personaje=personaje, objeto_id=objeto_id)
                
                if item_personaje.cantidad < cantidad:
                    return Response({"error": f"No tienes suficientes items. Tienes {item_personaje.cantidad}."}, status=400)

                # 3. RESTAR del personaje
                item_personaje.cantidad -= cantidad
                if item_personaje.cantidad == 0:
                    item_personaje.delete() # Se quedó sin el objeto
                else:
                    item_personaje.save()

                # 4. SUMAR a la Party
                item_party, created = InventarioParty.objects.get_or_create(
                    party=party,
                    objeto_id=objeto_id,
                    defaults={'cantidad': 0, 'donado_por': personaje}
                )
                # Usamos F() para evitar condiciones de carrera al sumar
                item_party.cantidad = F('cantidad') + cantidad
                item_party.save()

                return Response({"success": "Objeto transferido correctamente."})

        except Personaje.DoesNotExist:
            return Response({"error": "Personaje no encontrado."}, status=404)
        except Inventario.DoesNotExist:
            return Response({"error": "No tienes este objeto en tu inventario."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

# Views para NPCs
class NPCViewSet(HybridLookupMixin, viewsets.ModelViewSet):
    queryset = NPC.objects.all().select_related('species')
    serializer_class = NPCSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'title', 'location']

class RelacionNPCViewSet(viewsets.ModelViewSet):
    queryset = RelacionNPC.objects.all().select_related('npc', 'personaje')
    serializer_class = RelacionNPCSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return RelacionNPC.objects.all()
        return RelacionNPC.objects.filter(personaje__user=user)

