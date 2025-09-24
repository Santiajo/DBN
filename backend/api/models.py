from django.db import models

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
    
    # fuerza = models.IntegerField(default=10)

    #esto sirve para como se vera en admin los productos
    def __str__(self) :
        return self.nombre_usuario + " " + self.nombre_personaje
    


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

# class Proficiencia(models.Model):
#     personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE)
#     habilidad = models.CharField(max_length=100) NOMBRE DE LA HABILIDAD EJ: ATLETISMO 
#     VINCULAR LA ESTADISTICA A LA QUE PERTENECE EJ: FUERZA
#     ESTADO DE SI ES O NO PROFICIENTE

# BONUS DE PROFICIENCIA
# class BonusProficiencia(models.Model):

