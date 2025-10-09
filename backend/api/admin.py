from django.contrib import admin
from .models import (
    BonusProficiencia,
    Habilidad,
    Objeto,
    Personaje,
    Proficiencia,
    Receta,
    Ingredientes,
    Trabajo
)

# Registro simple de modelos
admin.site.register(BonusProficiencia)
admin.site.register(Habilidad)
admin.site.register(Objeto)
admin.site.register(Personaje)
admin.site.register(Proficiencia)
admin.site.register(Receta)
admin.site.register(Ingredientes)
admin.site.register(Trabajo)
