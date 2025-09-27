from django.urls import path, include
from api.views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()
router.register(r'personajes', PersonajeViewSet)
router.register(r'objetos', ObjetoViewSet)
router.register(r'recetas', RecetaViewSet)
router.register(r'ingredientes', IngredienteViewSet)

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register_view, name='register'),
    path('activate/<str:uidb64>/<str:token>/', activate_account_view, name='activate'),
    path('', include(router.urls)),  # Solo una vez
]
