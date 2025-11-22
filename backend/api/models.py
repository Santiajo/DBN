from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import math
from django.utils.text import slugify
from django.core.exceptions import ValidationError

# Modelo para personaje final
class Personaje(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personajes')
    # Datos Básicos
    nombre_personaje = models.CharField(max_length=60, default="")
    nivel = models.IntegerField(default=1)
    faccion = models.CharField(max_length=50, blank=True)
    # Economía y Tiempo
    checkpoints = models.IntegerField(default=0)
    treasure_points = models.IntegerField(default=0)
    treasure_points_gastados = models.IntegerField(default=0, null=True)
    oro = models.IntegerField(default=0)
    tiempo_libre = models.IntegerField(default=0)
    # Clase
    clase = models.ForeignKey(
        'DnDClass',
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='personajes',
        help_text="Clase principal del personaje"
    )
    # Subclase
    subclase = models.ForeignKey(
        'DnDSubclass',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='personajes'
    )
    # Especie
    especie = models.ForeignKey(
        'Species',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='personajes'
    )
    # Dotes
    dotes = models.ManyToManyField(
        'DnDFeat',
        blank=True,
        related_name='personajes',
        help_text="Dotes adquiridos (Origen, Nivel 4, etc.)"
    )
    # Estadísticas
    fuerza = models.IntegerField(default=10)
    inteligencia = models.IntegerField(default=10)
    sabiduria = models.IntegerField(default=10)
    destreza = models.IntegerField(default=10)
    constitucion = models.IntegerField(default=10)
    carisma = models.IntegerField(default=10)

    def __str__(self) :
        clase_str = self.clase.name if self.clase else "Sin Clase"
        return f"{self.nombre_personaje} - {clase_str} (Lvl {self.nivel})"

# Elecciones de un pj
class PersonajeEleccion(models.Model):
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, related_name='elecciones')
    # Rasgo padre
    origen_trait = models.ForeignKey(
        'Trait', 
        on_delete=models.CASCADE, 
        null=True, blank=True, 
        help_text="Si la elección viene de una Especie (ej. Giant Ancestry)"
    )
    origen_class_feature = models.ForeignKey(
        'ClassFeature', 
        on_delete=models.CASCADE, 
        null=True, blank=True, 
        help_text="Si viene de una Clase (ej. Fighting Style)"
    )
    origen_subclass_feature = models.ForeignKey(
        'SubclassFeature', 
        on_delete=models.CASCADE, 
        null=True, blank=True, 
        help_text="Si viene de una Subclase (ej. Maniobras)"
    )
    origen_feat_feature = models.ForeignKey(
        'FeatFeature', 
        on_delete=models.CASCADE, 
        null=True, blank=True, 
        help_text="Si viene de un Dote (ej. Giant Bless)"
    )
    # Rasgo elegido
    trait_elegido = models.ForeignKey(
        'Trait', 
        on_delete=models.CASCADE, 
        related_name='elegido_por', 
        null=True, blank=True
    )
    subclass_feature_elegido = models.ForeignKey(
        'SubclassFeature', 
        on_delete=models.CASCADE, 
        related_name='elegido_por', 
        null=True, blank=True
    )
    feat_feature_elegido = models.ForeignKey(
        'FeatFeature', 
        on_delete=models.CASCADE, 
        related_name='elegido_por', 
        null=True, blank=True
    )
    def __str__(self):
        origen = self.origen_trait or self.origen_feat_feature or self.origen_subclass_feature or "Desconocido"
        eleccion = self.trait_elegido or self.feat_feature_elegido or self.subclass_feature_elegido or "Nada"
        return f"{self.personaje}: {origen} -> {eleccion}"
    

#agregar stock
class Objeto(models.Model):
    Name = models.CharField(max_length=150)  
    Source = models.CharField(max_length=200, blank=True, null=True)  
    Page = models.CharField(max_length=150, blank=True, null=True)  
    Rarity = models.CharField(max_length=150, blank=True, null=True)  
    Type = models.CharField(max_length=150, blank=True, null=True)  
    Attunement = models.CharField(max_length=200, blank=True, null=True)  
    Damage = models.CharField(max_length=150, blank=True, null=True) 
    Properties = models.TextField(blank=True, null=True) 
    Mastery = models.CharField(max_length=200, blank=True, null=True)  
    Weight = models.CharField(max_length=150, blank=True, null=True)  
    Value = models.CharField(max_length=150, blank=True, null=True)  
    Text = models.TextField(blank=True, null=True)
    es_investigable = models.BooleanField(default=False)
    in_tp_store = models.BooleanField(default=False, help_text="Si es True, aparece en la Tienda de Treasure Points")  

    def __str__(self):
        return self.Name

# Inventario del personaje
class Inventario(models.Model):
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, related_name='inventario')
    objeto = models.ForeignKey(Objeto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('personaje', 'objeto')

    def __str__(self):
        return f"{self.cantidad} x {self.objeto.Name} - {self.personaje.nombre_personaje}"

class Receta(models.Model):
    nombre = models.CharField(max_length=100)
    objeto_final = models.ForeignKey("Objeto", on_delete=models.CASCADE, related_name="recetas")
    cantidad_final = models.IntegerField(default=1, null=True)

    # Campos básicos
    es_magico = models.BooleanField(default=False)
    herramienta = models.CharField(max_length=100, blank=True, null=True)
    
    # ✅ oro_necesario: Solo para objetos NO mágicos
    oro_necesario = models.IntegerField(
        default=0,
        help_text="Solo para objetos no mágicos. Los mágicos usan costes fijos según rareza."
    )
    
    # ✅ grado_minimo_requerido: Solo para objetos NO mágicos
    GRADO_MINIMO_CHOICES = [
        ('Novato', 'Novato'),
        ('Aprendiz', 'Aprendiz'),
        ('Experto', 'Experto'),
        ('Maestro Artesano', 'Maestro Artesano'),
        ('Gran Maestro', 'Gran Maestro'),
    ]
    grado_minimo_requerido = models.CharField(
        max_length=20,
        choices=GRADO_MINIMO_CHOICES,
        default='Novato',
        help_text="Solo para objetos no mágicos. Para mágicos se determina automáticamente por rareza."
    )
    
    # ✅ Campos SOLO para objetos mágicos
    RAREZA_CHOICES = [
        ('Common', 'Common'),
        ('Uncommon', 'Uncommon'),
        ('Rare', 'Rare'),
        ('Very Rare', 'Very Rare'),
        ('Legendary', 'Legendary'),
    ]
    rareza = models.CharField(
        max_length=15, 
        choices=RAREZA_CHOICES, 
        blank=True, 
        null=True,
        help_text="Solo para objetos mágicos. Determina DC, éxitos, coste y grado mínimo."
    )
    
    material_raro = models.ForeignKey(
        "Objeto",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recetas_como_material_raro",
        help_text="Material especial necesario para objetos mágicos"
    )
    
    es_consumible = models.BooleanField(
        default=False,
        help_text="Si es un consumible mágico (DC más baja)"
    )
    
    # ✅ ELIMINADO: tipo_artesano (no se usa)
    
    def obtener_grado_minimo_efectivo(self):
        """
        Retorna el grado mínimo requerido:
        - Para NO mágicos: usa el campo grado_minimo_requerido
        - Para mágicos: lo calcula automáticamente según rareza
        """
        if self.es_magico and self.rareza:
            grados_por_rareza = {
                'Common': 'Novato',
                'Uncommon': 'Aprendiz',
                'Rare': 'Experto',
                'Very Rare': 'Maestro Artesano',
                'Legendary': 'Gran Maestro',
            }
            return grados_por_rareza.get(self.rareza, 'Novato')
        else:
            # Para objetos no mágicos
            return self.grado_minimo_requerido
    
    def obtener_dc(self):
        """Calcula la DC según si es mágico o no"""
        if not self.es_magico:
            return 12  # DC fija para objetos no mágicos
        
        dc_por_rareza = {
            'Common': 15,
            'Uncommon': 18,
            'Rare': 21,
            'Very Rare': 24,
            'Legendary': 30,
        }
        
        dc_consumible = {
            'Common': 10,
            'Uncommon': 13,
            'Rare': 16,
            'Very Rare': 19,
            'Legendary': 25,
        }
        
        if self.es_consumible:
            return dc_consumible.get(self.rareza, 12)
        return dc_por_rareza.get(self.rareza, 12)
    
    def obtener_exitos_requeridos(self):
        if not self.es_magico:
            return 0
        
        exitos = {
            'Common': 1,
            'Uncommon': 1,
            'Rare': 2,
            'Very Rare': 5,
            'Legendary': 10,
        }
        return exitos.get(self.rareza, 1)
    
    def obtener_coste_magico(self):
        if not self.es_magico:
            return {'dias': 0, 'oro': 0}
        
        costes = {
            'Common': {'dias': 1, 'oro': 10},
            'Uncommon': {'dias': 2, 'oro': 40},
            'Rare': {'dias': 5, 'oro': 200},
            'Very Rare': {'dias': 5, 'oro': 800},
            'Legendary': {'dias': 5, 'oro': 2000},
        }
        return costes.get(self.rareza, {'dias': 1, 'oro': 10})
    
    def __str__(self):
        return f"Receta: {self.nombre} → {self.objeto_final.Name}"

class Ingredientes(models.Model):
    receta = models.ForeignKey(Receta, on_delete=models.CASCADE, related_name="ingredientes")
    objeto = models.ForeignKey("Objeto", on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.cantidad} x {self.objeto.Name} (para {self.receta.nombre})"


#   PROFICIENCIAS
#     VINCULAR LA ESTADISTICA A LA QUE PERTENECE EJ: FUERZA
#     ESTADO DE SI ES O NO PROFICIENTE
class Proficiencia(models.Model):
    personaje = models.ForeignKey("Personaje", on_delete=models.CASCADE, related_name="proficiencias")
    habilidad = models.ForeignKey("Habilidad", on_delete=models.CASCADE)
    es_proficiente = models.BooleanField(default=False)

    @property
    def estadistica(self):
        return self.habilidad.estadistica_asociada

    def __str__(self):
        estado = "Proficiente" if self.es_proficiente else "No proficiente"
        return f"{self.habilidad.nombre.capitalize()} ({self.estadistica.capitalize()}) - {self.personaje.nombre_personaje} [{estado}]"

# BONUS DE PROFICIENCIA
class BonusProficiencia(models.Model):
    nivel = models.PositiveIntegerField(unique=True)  # nivel de 1 a 20
    bonus = models.IntegerField()  # valor de +2, +3

    def __str__(self):
        return f"Nivel {self.nivel} → Bonus {self.bonus}"

# NOMBRE ESTADISTICAS
class Habilidad(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    estadistica_asociada = models.CharField(max_length=50)  # ejemplo: "fuerza", "destreza", etc.

    def __str__(self):
        return f"{self.nombre.capitalize()} ({self.estadistica_asociada.capitalize()})"


# TRABAJO CON FOREIGN KEY A HABILIDAD

class Trabajo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    requisito_habilidad = models.ForeignKey("Habilidad", on_delete=models.CASCADE)
    rango_maximo = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    descripcion = models.TextField(blank=True, null=True)
    beneficio = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre
    
# RANGOS DE PAGO DE LOS TRABAJOS

class PagoRango(models.Model):
    trabajo = models.ForeignKey(Trabajo, on_delete=models.CASCADE, related_name="pagos")
    rango = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    valor_suma = models.FloatField(help_text="Valor que se suma al bono de economía (ej: 1, 2, 3...)")
    multiplicador = models.FloatField(help_text="Multiplicador base del trabajo (ej: 1.25, 3.75, 7.5...)")

    dias_para_siguiente_rango = models.PositiveIntegerField(default=50)

    class Meta:
        unique_together = ("trabajo", "rango")

    def __str__(self):
        return f"{self.trabajo.nombre} - Rango {self.rango}"

# TRABAJO REALIZADO Y RESULTADO DEL LA FORMULA

class TrabajoRealizado(models.Model):
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE)
    trabajo = models.ForeignKey(Trabajo, on_delete=models.CASCADE)
    rango = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    dias_trabajados = models.PositiveIntegerField(default=1)
    bono_economia = models.IntegerField(default=0)
    desempenio = models.FloatField(default=1.0, help_text="Multiplicador de desempeño (ej: 0.5 a 2.0)")
    pago_total = models.FloatField(default=0, editable=False)
    modificador_estadistica = models.IntegerField(default=0)
    bonus_proficiencia = models.IntegerField(default=0)

    fecha_realizacion = models.DateTimeField(auto_now_add=True)

    def calcular_pago(self):
        try:
            rango_info = self.trabajo.pagos.get(rango=self.rango)
            pago_base = (
                rango_info.valor_suma + 
                self.bono_economia + 
                self.modificador_estadistica + 
                self.bonus_proficiencia
            ) * rango_info.multiplicador
            total = pago_base * self.dias_trabajados * self.desempenio
            return round(total, 2)
        except PagoRango.DoesNotExist:
            return 0

    def save(self, *args, **kwargs):
        self.pago_total = self.calcular_pago()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.personaje.nombre_personaje} - {self.trabajo.nombre} (Rango {self.rango})"

class ProgresoTrabajo(models.Model):
    """
    Almacena el rango actual y el progreso de un personaje en un trabajo específico.
    """
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, related_name="progreso_trabajos")
    trabajo = models.ForeignKey(Trabajo, on_delete=models.CASCADE, related_name="progreso_personajes")
    
    # el rango actual que tiene el personaje en este trabajo
    rango_actual = models.PositiveIntegerField(
        default=1, 
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Días acumulados para el *siguiente* rango
    dias_acumulados_rango = models.PositiveIntegerField(default=0)

    class Meta:
        # un personaje solo puede tener una entrada de progreso por trabajo
        unique_together = ('personaje', 'trabajo')

    def __str__(self):
        return f"{self.personaje.nombre_personaje} - {self.trabajo.nombre} (Rango {self.rango_actual})"

class ObjetoTienda(models.Model):
    tienda = models.ForeignKey("Tienda", on_delete=models.CASCADE, related_name='inventario')
    objeto = models.ForeignKey(Objeto, on_delete=models.CASCADE)
    stock = models.PositiveIntegerField(default=1, help_text="Cantidad de este objeto disponible en la tienda.")
    precio_personalizado = models.IntegerField(null=True, blank=True, help_text="Precio de venta en oro. Si se deja en blanco, se podría usar el valor base del objeto.")

    class Meta:
        # Asegura que no haya entradas duplicadas del mismo objeto en la misma tienda.
        unique_together = ('tienda', 'objeto')

    def __str__(self):
        return f"{self.objeto.Name} en {self.tienda.nombre} (Stock: {self.stock})"


class Tienda(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    npc_asociado = models.CharField(max_length=100, blank=True, help_text="Nombre del NPC que regenta la tienda.")
    
    # Relación Many-to-Many para incluir objetos en el inventario de la tienda.
    objetos = models.ManyToManyField(
        Objeto, 
        through=ObjetoTienda, 
        related_name='tiendas',
        blank=True
    )

    def __str__(self):
        return self.nombre

# ola
# estoy stremeneado en maxima calidad bit rate

class CompetenciaHerramienta(models.Model):
    """Representa el nivel de dominio de un personaje con una herramienta específica"""
    
    GRADO_CHOICES = [
        ('Novato', 'Novato'),
        ('Aprendiz', 'Aprendiz'),
        ('Experto', 'Experto'),
        ('Maestro Artesano', 'Maestro Artesano'),
        ('Gran Maestro', 'Gran Maestro'),
    ]
    
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, related_name='competencias_herramientas')
    nombre_herramienta = models.CharField(max_length=100)
    grado = models.CharField(max_length=20, choices=GRADO_CHOICES, default='Novato')
    exitos_acumulados = models.IntegerField(default=0)
    fecha_obtencion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('personaje', 'nombre_herramienta')
        verbose_name_plural = "Competencias con Herramientas"
    
    def __str__(self):
        return f"{self.personaje.nombre_personaje} - {self.nombre_herramienta} ({self.grado})"
    
    def obtener_modificador_habilidad(self):
        """
        Calcula el modificador de habilidad más alto del personaje.
        Fórmula D&D: (habilidad - 10) / 2, redondeado hacia abajo
        """
        habilidades = [
            self.personaje.fuerza,
            self.personaje.inteligencia,
            self.personaje.sabiduria,
            self.personaje.destreza,
            self.personaje.constitucion,
            self.personaje.carisma,
        ]
        
        habilidad_maxima = max(habilidades)
        modificador = math.floor((habilidad_maxima - 10) / 2)
        
        return modificador
    
    def obtener_modificador_competencia(self):
        """
        Calcula el modificador de competencia según el grado y el PB del personaje
        """
        try:
            pb = BonusProficiencia.objects.get(nivel=self.personaje.nivel).bonus
        except BonusProficiencia.DoesNotExist:
            pb = 2  # Default si no existe
        
        multiplicadores = {
            'Novato': 0,
            'Aprendiz': 0.5,
            'Experto': 1,
            'Maestro Artesano': 1.5,
            'Gran Maestro': 2,
        }
        
        multiplicador = multiplicadores.get(self.grado, 0)
        return math.floor(pb * multiplicador)
    
    def obtener_modificador(self):
        """
        Calcula el modificador TOTAL para crafting:
        Modificador de Competencia + Modificador de Habilidad más alta
        
        Ejemplo:
        - Nivel 5, Experto: PB=3 × 1 = +3
        - Inteligencia 14: (14-10)/2 = +2
        - Total: +5
        """
        mod_competencia = self.obtener_modificador_competencia()
        mod_habilidad = self.obtener_modificador_habilidad()
        
        return mod_competencia + mod_habilidad
    
    def obtener_info_grado(self):
        """Retorna información del grado actual (progreso por día, coste)"""
        info = {
            'Novato': {'suma_oro': 5, 'gasto_oro': 2},
            'Aprendiz': {'suma_oro': 10, 'gasto_oro': 3},
            'Experto': {'suma_oro': 25, 'gasto_oro': 6},
            'Maestro Artesano': {'suma_oro': 75, 'gasto_oro': 15},
            'Gran Maestro': {'suma_oro': 150, 'gasto_oro': 25},
        }
        return info.get(self.grado, info['Novato'])
    
    def verificar_subida_grado(self):
        """Verifica si debe subir de grado y lo hace automáticamente"""
        requisitos = {
            'Novato': ('Aprendiz', 1),
            'Aprendiz': ('Experto', 2),
            'Experto': ('Maestro Artesano', 10),
            'Maestro Artesano': ('Gran Maestro', 50),
            'Gran Maestro': (None, 250),  # Máximo nivel
        }
        
        if self.grado in requisitos:
            siguiente_grado, exitos_necesarios = requisitos[self.grado]
            if siguiente_grado and self.exitos_acumulados >= exitos_necesarios:
                self.grado = siguiente_grado
                self.exitos_acumulados = 0  # Resetea el contador
                self.save()
                return siguiente_grado  # Retorna el nuevo grado para notificar
        return None


class ProgresoReceta(models.Model):
    """Tracking del progreso de crafting de una receta"""
    
    ESTADO_CHOICES = [
        ('en_progreso', 'En Progreso'),
        ('completado', 'Completado'),
        ('pausado', 'Pausado'),
    ]
    
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, related_name='progresos_recetas')
    receta = models.ForeignKey(Receta, on_delete=models.CASCADE)
    competencia_utilizada = models.ForeignKey(CompetenciaHerramienta, on_delete=models.CASCADE, related_name='progresos')
    
    # Para objetos NO mágicos
    oro_acumulado = models.IntegerField(default=0)
    
    # Para objetos mágicos
    exitos_conseguidos = models.IntegerField(default=0)
    exitos_requeridos = models.IntegerField(default=0)
    
    # Comunes
    dias_trabajados = models.IntegerField(default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='en_progreso')
    
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_completado = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "Progresos de Recetas"
    
    def __str__(self):
        return f"{self.personaje.nombre_personaje} - {self.receta.nombre} ({self.estado})"


class HistorialTirada(models.Model):
    """Historial de tiradas de crafting"""
    progreso = models.ForeignKey(ProgresoReceta, on_delete=models.CASCADE, related_name='tiradas')
    resultado_dado = models.IntegerField()  # Resultado del d20
    modificador = models.IntegerField()
    resultado_total = models.IntegerField()
    exito = models.BooleanField()
    oro_sumado = models.IntegerField(default=0)  # Para no mágicos
    oro_gastado = models.IntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Tirada {self.resultado_total} - {'Éxito' if self.exito else 'Fallo'}"
    
def puede_craftear_rareza(grado_competencia: str, rareza: str) -> bool:
    """
    Verifica si un grado de competencia puede craftear una rareza específica.
    
    Jerarquía:
    - Novato: Common
    - Aprendiz: Common, Uncommon
    - Experto: Common, Uncommon, Rare
    - Maestro Artesano: Common, Uncommon, Rare, Very Rare
    - Gran Maestro: Todas (Common, Uncommon, Rare, Very Rare, Legendary)
    """
    jerarquia_grados = {
        'Novato': ['Common'],
        'Aprendiz': ['Common', 'Uncommon'],
        'Experto': ['Common', 'Uncommon', 'Rare'],
        'Maestro Artesano': ['Common', 'Uncommon', 'Rare', 'Very Rare'],
        'Gran Maestro': ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'],
    }
    
    rarezas_permitidas = jerarquia_grados.get(grado_competencia, [])
    return rareza in rarezas_permitidas

# Opciones para especies
CREATURE_TYPES = [
    ('Humanoid', 'Humanoide'),
    ('Elemental', 'Elemental'),
    ('Monstrosity', 'Monstruosidad'),
    ('Fey', 'Feérico'),
    ('Fiend', 'Infernal'),
    ('Celestial', 'Celestial'),
    ('Dragon', 'Dragón'),
    ('Giant', 'Gigante'),
    ('Aberration', 'Aberración'),
    ('Beast', 'Bestia'),
    ('Construct', 'Constructo'),
    ('Ooze', 'Limo'),
    ('Plant', 'Planta'),
    ('Undead', 'No-muerto'),
]

SIZES = [
    ('Tiny', 'Diminuto'),
    ('Small', 'Pequeño'),
    ('Medium', 'Mediano'),
    ('Small or Medium', 'Pequeño o Mediano'), 
    ('Medium or Large', 'Mediano o Grande'), 
    ('Large', 'Grande'),
    ('Huge', 'Enorme'),
    ('Gargantuan', 'Gargantuesco'),
]

class Species(models.Model):
    name = models.CharField(
        max_length=150, 
        unique=True, 
        help_text="El nombre completo de la especie (ej. 'Aarakocra (New World Ancestry)')"
    )
    slug = models.SlugField(
        max_length=150, 
        unique=True, 
        blank=True, 
        help_text="Versión amigable para URLs del nombre (se genera automáticamente)"
    )
    description = models.TextField(
        blank=True, 
        help_text="Texto de ambientación (lore) o descripción general de la especie."
    )
    
    creature_type = models.CharField(
        max_length=50, 
        choices=CREATURE_TYPES, 
        default='Humanoid',
        help_text="El tipo de criatura (ej. Humanoide, Elemental)."
    )
    size = models.CharField(
        max_length=50, 
        choices=SIZES, 
        default='Medium',
        help_text="El tamaño de la criatura (ej. Mediano, Pequeño o Mediano)."
    )
    walking_speed = models.PositiveIntegerField(
        default=30, 
        help_text="Velocidad base de movimiento en pies."
    )
    darkvision = models.PositiveIntegerField(
        default=0, 
        help_text="Rango de la visión en la oscuridad en pies (0 si no tiene)."
    )
    
    class Meta:
        verbose_name = "Species"
        verbose_name_plural = "Species"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Trait(models.Model):
    species = models.ForeignKey(
        Species, 
        on_delete=models.CASCADE, 
        related_name="traits",
        help_text="La especie a la que pertenece este rasgo."
    )
    name = models.CharField(
        max_length=200, 
        help_text="El nombre del rasgo (ej. 'Wind Caller', 'Chikcha Legacy', 'Natural Armor')."
    )
    description = models.TextField(
        help_text="La descripción completa y las reglas del rasgo."
    )
    
    parent_choice = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name="options",
        help_text="Si este rasgo es una *opción* seleccionable (ej. 'Natural Armor'), "
                  "conéctalo aquí al rasgo 'padre' (ej. 'Chikcha Legacy')."
    )
    
    min_choices = models.PositiveIntegerField(
        default=0, 
        help_text="Para un rasgo 'padre', el número MÍNIMO de opciones a elegir (ej. 2 para Chikcha Legacy)."
    )
    max_choices = models.PositiveIntegerField(
        default=0, 
        help_text="Para un rasgo 'padre', el número MÁXIMO de opciones a elegir (ej. 2 para Chikcha Legacy)."
    )

    display_order = models.PositiveIntegerField(
        default=10, 
        help_text="Orden para mostrar los rasgos. Menor número primero."
    )

    def clean(self):
        super().clean()
    
        if self.parent_choice:
            if self.parent_choice.species_id != self.species_id:
                raise ValidationError(
                    f"El rasgo padre '{self.parent_choice}' (especie: {self.parent_choice.species.name}) "
                    f"no pertenece a la misma especie que este rasgo (especie: {self.species.name})."
                )

        if self.parent_choice and (self.min_choices > 0 or self.max_choices > 0):
             raise ValidationError(
                 "Un rasgo no puede ser una 'opción' (tener un 'parent_choice') "
                 "y al mismo tiempo ser un 'grupo de opciones' (tener 'min_choices' o 'max_choices')."
             )
        
        if self.max_choices > 0 and self.min_choices > self.max_choices:
            raise ValidationError("El número 'min_choices' no puede ser mayor que 'max_choices'.")

    class Meta:
        verbose_name = "Trait"
        verbose_name_plural = "Traits"
        ordering = ['species', 'display_order', 'name']
        constraints = []

    def __str__(self):
        if self.parent_choice:
            return f"{self.species.name} -> {self.parent_choice.name} (Opción: {self.name})"
        return f"{self.species.name} -> {self.name}"
    
# Modelos para clases de D&D
STAT_FIELDS = [
    ('fuerza', 'Fuerza'),
    ('destreza', 'Destreza'),
    ('constitucion', 'Constitución'),
    ('inteligencia', 'Inteligencia'),
    ('sabiduria', 'Sabiduría'),
    ('carisma', 'Carisma'),
]

HIT_DIE_CHOICES = [(6, 'd6'), (8, 'd8'), (10, 'd10'), (12, 'd12')]

RESET_CHOICES = [
    ('Short Rest', 'Descanso Corto'),
    ('Long Rest', 'Descanso Largo'),
    ('Special', 'Especial'),
]

class DnDClass(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Ej: Artificer")
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField()
    hit_die = models.IntegerField(choices=HIT_DIE_CHOICES, default=8)
    primary_ability = models.CharField(
        max_length=20, 
        choices=STAT_FIELDS, 
        default='fuerza',
        help_text="Estadística principal de la clase (ej. 'inteligencia' para Artificer)."
    )
    
    saving_throws = models.JSONField(
        default=list, 
        help_text="Lista de campos de estadística para salvaciones."
    )
    
    skill_choices = models.ManyToManyField(
        'Habilidad', 
        related_name='class_options',
        blank=True,
        help_text="Qué habilidades puede elegir el jugador."
    )
    skill_choices_count = models.PositiveIntegerField(default=2)
    
    armor_proficiencies = models.TextField(blank=True, help_text="Ej: Light and Medium armor, Shields")
    weapon_proficiencies = models.TextField(blank=True, help_text="Ej: Simple weapons, firearms")
    tool_proficiencies = models.TextField(blank=True, help_text="Ej: Thieves' tools, tinker's tools")
    starting_equipment = models.TextField(blank=True, help_text="Descripción del equipo inicial.")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ClassFeature(models.Model):
    dnd_class = models.ForeignKey(DnDClass, related_name='features', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    level = models.PositiveIntegerField(default=1)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['level', 'display_order']

    def __str__(self):
        return f"{self.dnd_class.name} Lvl {self.level}: {self.name}"


class ClassResource(models.Model):
    dnd_class = models.ForeignKey(DnDClass, related_name='resources', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    quantity_type = models.CharField(max_length=20, default='Fixed') 
    quantity_stat = models.CharField(max_length=20, blank=True, null=True)
    progression = models.JSONField(default=dict, blank=True)
    value_progression = models.JSONField(default=dict, blank=True)
    reset_on = models.CharField(max_length=50, default="Long Rest")

    def __str__(self):
        return f"{self.name} ({self.dnd_class.name})"

# Modelos de subclases
class DnDSubclass(models.Model):
    dnd_class = models.ForeignKey(DnDClass, related_name='subclasses', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField()
    source = models.CharField(max_length=100, default="PHB")
    skill_choices = models.ManyToManyField(
        'Habilidad', 
        related_name='subclass_options',
        blank=True,
        help_text="Habilidades adicionales que otorga la subclase (o opciones)."
    )
    skill_choices_count = models.PositiveIntegerField(default=0, help_text="Si es 0, se otorgan todas. Si es > 0, el jugador elige.")
    bonus_proficiencies = models.TextField(blank=True, help_text="Texto libre para herramientas, idiomas o armas extra.")
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.dnd_class.name}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.dnd_class.name})"


class SubclassFeature(models.Model):
    dnd_subclass = models.ForeignKey(DnDSubclass, related_name='features', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    level = models.PositiveIntegerField(default=3, help_text="Nivel de CLASE en que se gana.")
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    parent_feature = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='options',
        help_text="Si este rasgo es una opción (ej. una Maniobra), selecciona el rasgo padre."
    )
    choices_count = models.PositiveIntegerField(default=0, help_text="Cuántas opciones elegir (Ej: 3 para Maniobras iniciales).")
    class Meta:
        ordering = ['level', 'display_order', 'name']
    def __str__(self):
        if self.parent_feature:
            return f"{self.dnd_subclass.name} Opt: {self.name}"
        return f"{self.dnd_subclass.name} Lvl {self.level}: {self.name}"


class SubclassResource(models.Model):
    dnd_subclass = models.ForeignKey(DnDSubclass, related_name='resources', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, help_text="Ej: Superiority Dice")
    quantity_type = models.CharField(max_length=20, default='Fixed')
    quantity_stat = models.CharField(max_length=20, blank=True, null=True)
    progression = models.JSONField(default=dict, blank=True, help_text="{ '3': 4, '7': 5 }")
    value_progression = models.JSONField(default=dict, blank=True, help_text="{ '3': 'd8', '10': 'd10' }")
    reset_on = models.CharField(max_length=50, default="Short Rest")
    def __str__(self):
        return f"{self.name} ({self.dnd_subclass.name})"

# Modelos para dotes
FEAT_TYPES = [
    ('Origin', 'Origin'),
    ('General', 'General'),
    ('Epic Boon', 'Epic Boon'),
    ('Fighting Style', 'Fighting Style'),
]

class DnDFeat(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    feat_type = models.CharField(max_length=20, choices=FEAT_TYPES, default='General')
    description = models.TextField(help_text="Flavor text o descripción general.")
    source = models.CharField(max_length=100, default="PHB")
    prerequisite_level = models.PositiveIntegerField(default=0, help_text="Nivel mínimo (ej. 4). 0 si no tiene.")
    prerequisite_species = models.ForeignKey(
        'Species', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='exclusive_feats',
        help_text="Si requiere una especie específica."
    )
    prerequisite_feat = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dependent_feats',
        help_text="Si requiere tener otro dote previo."
    )
    prerequisite_text = models.CharField(
        max_length=255, 
        blank=True, 
        help_text="Texto manual de requisitos (ej. 'Str 13+', 'Spellcasting feature')."
    )
    ability_score_increase = models.TextField(
        blank=True, 
        help_text="Texto describiendo qué stats suben."
    )
    repeatable = models.BooleanField(default=False, help_text="¿Se puede tomar este dote más de una vez?")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.feat_type})"


class FeatFeature(models.Model):
    dnd_feat = models.ForeignKey(DnDFeat, related_name='features', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)
    parent_feature = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='options',
        help_text="Si este rasgo es una opción (ej. 'Cloud Giant'), selecciona su padre ('Giant Bless')."
    )
    choices_count = models.PositiveIntegerField(default=0, help_text="Cuántas opciones elegir (Ej: 1 para Giant Heritage).")
    class Meta:
        ordering = ['display_order', 'name']
    def __str__(self):
        if self.parent_feature:
            return f"{self.dnd_feat.name}: {self.parent_feature.name} -> {self.name}"
        return f"{self.dnd_feat.name}: {self.name}"
    

# TABLAS PARA LAS PARTYS

class Party(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    # El creador (User) para gestionar permisos
    creador = models.ForeignKey(User, on_delete=models.CASCADE, related_name="partys_creadas")
    
    # Los personajes que son miembros (ManyToMany)
    miembros = models.ManyToManyField(Personaje, related_name="partys", blank=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} (Líder: {self.creador.username})"


class InventarioParty(models.Model):
    """
    Botín compartido. Es idéntico a 'Inventario' pero vinculado a 'Party'.
    """
    party = models.ForeignKey(Party, on_delete=models.CASCADE, related_name='inventario_party')
    objeto = models.ForeignKey(Objeto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    
    # saber quién puso el objeto ahí
    donado_por = models.ForeignKey(Personaje, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('party', 'objeto')

    def __str__(self):
        return f"{self.cantidad} x {self.objeto.Name} - {self.party.nombre}"

# Modelos para NPCS
class NPC(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    
    # Datos Básicos 
    title = models.CharField(max_length=100, blank=True, help_text="Ej: General, Líder de expedición")
    occupation = models.CharField(max_length=100, blank=True, help_text="Ej: Aristocrática, Soldado")
    location = models.CharField(max_length=200, blank=True, help_text="Ej: Cuartel de New Helmsport")
    
    # Especie
    species = models.ForeignKey(
        'Species', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='npcs'
    )

    # Detalles Narrativos
    appearance = models.TextField(blank=True, help_text="Descripción física")
    personality = models.TextField(blank=True, help_text="Personalidad y comportamiento")
    reputation = models.TextField(blank=True, help_text="Historia y cómo es conocido")
    
    # Economía
    gold = models.IntegerField(default=0, help_text="Acumulación de oro por turno")
    sells = models.TextField(blank=True, help_text="Qué vende este NPC")
    buys = models.TextField(blank=True, help_text="Qué compra este NPC")
    
    # Beneficios y Consecuencias
    benefit = models.TextField(blank=True, help_text="Beneficio estándar (ej. venta de objetos)")
    secret_benefit = models.TextField(blank=True, help_text="Beneficios por rango alto de amistad")
    detriment = models.TextField(blank=True, help_text="Consecuencias por llevarse mal")

    # Imagen (Opcional, recomendado para NPCs)
    image_url = models.URLField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.title})"


class RelacionNPC(models.Model):
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, related_name='relaciones_npc')
    npc = models.ForeignKey(NPC, on_delete=models.CASCADE, related_name='relaciones_personajes')
    valor_amistad = models.IntegerField(default=0, help_text="Rango numérico de afinidad.")

    class Meta:
        unique_together = ('personaje', 'npc')
        ordering = ['npc__name']

    def __str__(self):
        return f"{self.personaje.nombre_personaje} <-> {self.npc.name}: {self.valor_amistad}"

# Modelo para registrar compras de treasure points
class TPTransaction(models.Model):
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, related_name='tp_transactions')
    objeto = models.ForeignKey(Objeto, on_delete=models.CASCADE)
    costo = models.IntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    nivel_personaje = models.IntegerField()
    tier_personaje = models.IntegerField()

    def __str__(self):
        return f"{self.personaje.nombre_personaje} compró {self.objeto.Name} por {self.costo} TP"