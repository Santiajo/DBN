from django.urls import path, include
from api.views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter
from .views import *
from . import views
from rest_framework_nested import routers


router = DefaultRouter()
router.register(r'personajes', PersonajeViewSet, basename='personaje')
router.register(r'recetas', RecetaViewSet)
router.register(r'ingredientes', IngredienteViewSet)
router.register(r'proficiencias', ProficienciaViewSet, basename='proficiencia')
router.register(r'habilidades', HabilidadViewSet)
router.register(r'bonusproficiencias', BonusProficienciaViewSet)
router.register(r'trabajos', TrabajoViewSet)
router.register(r'trabajos-realizados', TrabajoRealizadoViewSet)
router.register(r'objetos', views.ObjetoViewSet, basename='objeto')
router.register(r'tiendas', views.TiendaViewSet, basename='tienda')
router.register(r'pagos-rango', views.PagoRangoViewSet, basename='pagorango')
router.register(r'progreso-trabajos', ProgresoTrabajoViewSet, basename='progresotrabajo')
router.register(r'partys', PartyViewSet)
router.register(r'inventario-party', InventarioPartyViewSet, basename='inventarioparty')

# Routers para especies y rasgos de especies
router.register(r'species', views.SpeciesViewSet, basename='species')
router.register(r'traits', views.TraitViewSet, basename='trait')

# Routers para clases y características de clases
router.register(r'classes', views.DnDClassViewSet, basename='dndclass')
router.register(r'class-features', views.ClassFeatureViewSet, basename='classfeature')
router.register(r'class-resources', views.ClassResourceViewSet, basename='classresource')

# Router de Crafting
router.register(r'crafting', views.CraftingViewSet, basename='crafting')

# Router anidado para el inventario de tiendas
tiendas_router = routers.NestedSimpleRouter(router, r'tiendas', lookup='tienda')
tiendas_router.register(r'inventario', views.ObjetoTiendaViewSet, basename='tienda-inventario')

# Router anidado para el inventario de personajes
personajes_router = routers.NestedSimpleRouter(router, r'personajes', lookup='personaje')
personajes_router.register(r'inventario', views.InventarioPersonajeViewSet, basename='personaje-inventario')

# Router anidado para los trabajos y los pagos de rangos
trabajos_router = routers.NestedSimpleRouter(router, r'trabajos', lookup='trabajo')
trabajos_router.register(r'pagos', views.PagoRangoViewSet, basename='trabajo-pagos')

urlpatterns = [
    # Rutas para los tokens JWT
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Rutas para autenticación y registro
    path('register/', register_view, name='register'),
    # path('activate/<str:uidb64>/<str:token>/', activate_account_view, name='activate'),
    path('', include(router.urls)),
    path('', include(tiendas_router.urls)),
    path('', include(personajes_router.urls)),
    path('personajes/<int:personaje_pk>/comprar/', views.comprar_objeto, name='comprar-objeto'),
    path('', include(trabajos_router.urls)),
    path('trabajos/<int:trabajo_pk>/debug-pagos/', views.debug_trabajo_pagos, name='debug-trabajo-pagos'),
]