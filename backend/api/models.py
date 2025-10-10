from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Personaje(models.Model):
    DND_CLASSES = [
        ('BARBARIAN', 'Barbarian'),
        ('BARD', 'Bard'),
        ('WARLOCK', 'Warlock'),
        ('CLERIC', 'Cleric'),
        ('DRUID', 'Druid'),
        ('RANGER', 'Ranger'),
        ('FIGHTER', 'Fighter'),
        ('SORCERER', 'Sorcerer'),
        ('WIZARD', 'Wizard'),
        ('MONK', 'Monk'),
        ('PALADIN', 'Paladin'),
        ('ROGUE', 'Rogue'),
    ]

    nombre_usuario = models.CharField(max_length=50)
    nombre_personaje = models.CharField(max_length=60, default="")
    treasure_points = models.IntegerField(default=0)
    oro = models.IntegerField(default=0)
    tiempo_libre = models.IntegerField(default=0)

    clase = models.CharField(max_length=30, choices=DND_CLASSES, blank=True)
    treasure_points_gastados = models.IntegerField(default=0, null=True)
    nivel = models.IntegerField(default=1, null=True)
    especie = models.CharField(max_length=50, blank=True)
    faccion = models.CharField(max_length=50, blank=True)
    
    # Estadísticas 
    fuerza = models.IntegerField(default=10)
    inteligencia = models.IntegerField(default=10)
    sabiduria = models.IntegerField(default=10)
    destreza = models.IntegerField(default=10)
    constitucion = models.IntegerField(default=10)
    carisma = models.IntegerField(default=10)

    #esto sirve para como se vera en admin los productos
    def __str__(self) :
        return self.nombre_usuario + " " + self.nombre_personaje
    

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

    def __str__(self):
        return self.name
    
class Receta(models.Model):
    nombre = models.CharField(max_length=100)
    objeto_final = models.ForeignKey("Objeto", on_delete=models.CASCADE, related_name="recetas")
    cantidad_final = models.IntegerField(default=1, null=True)

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

    fecha_realizacion = models.DateTimeField(auto_now_add=True)

    def calcular_pago(self):
        try:
            rango_info = self.trabajo.pagos.get(rango=self.rango)
            pago_base = (rango_info.valor_suma + self.bono_economia) * rango_info.multiplicador
            total = pago_base * self.dias_trabajados * self.desempenio
            return round(total, 2)
        except PagoRango.DoesNotExist:
            return 0

    def save(self, *args, **kwargs):
        self.pago_total = self.calcular_pago()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.personaje.nombre_personaje} - {self.trabajo.nombre} (Rango {self.rango})"

# ola

