from django.urls import path, include
from api.views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter
from .views import *
from . import views



router = DefaultRouter()
router.register(r'personajes', PersonajeViewSet)
router.register(r'objetos', ObjetoViewSet)
router.register(r'recetas', RecetaViewSet)
router.register(r'ingredientes', IngredienteViewSet)

urlpatterns = [
    # Rutas para los tokens JWT
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Rutas para autenticación y registro
    path('register/', register_view, name='register'),
    path('activate/<str:uidb64>/<str:token>/', activate_account_view, name='activate'),
    path('', include(router.urls)),  # Solo una vez
    path('inventario/<int:personaje_id>/', views.inventario_personaje, name='inventario_personaje'),

]
