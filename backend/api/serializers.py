from rest_framework import serializers, validators
from django.contrib.auth.models import User
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Serializer para registro de usuarios
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        # Definimos el modelo y los campos que se van a utilizar
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name')
        # Configuramos los atributos adicionales para los campos
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {
                # Validador para asegurar que el email es único, requerido y no puede estar en blanco
                "required": True,
                "allow_blank": False,
                "validators": [
                    validators.UniqueValidator(
                        User.objects.all(), "Ya hay una cuenta asociada a ese email." 
                    )
                ]
            }
        }

    # Método para crear un nuevo usuario con los datos validados
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True,  # El usuario se crea como activo inmediatamente
            is_staff=validated_data.get("is_staff", False) # Para determinar si es admin (True) o user normal (False)
        )
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añade claims personalizados al payload del token
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['id'] = user.id
        return token

class PersonajeSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = Personaje
        fields = '__all__'

class ObjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Objeto
        fields = '__all__'

class IngredientesSerializer(serializers.ModelSerializer):
    # Muestra el nombre del ingrediente en lugar de solo la ID
    nombre_ingrediente = serializers.CharField(source='objeto.Name', read_only=True)

    class Meta:
        model = Ingredientes
        fields = ['id', 'receta', 'objeto', 'nombre_ingrediente', 'cantidad']
        # 'objeto' sigue enviando la ID para POST/PUT

class RecetaSerializer(serializers.ModelSerializer):
    nombre_objeto_final = serializers.CharField(source='objeto_final.Name', read_only=True)
    ingredientes = IngredientesSerializer(many=True, read_only=True)
    nombre_material_raro = serializers.CharField(source='material_raro.Name', read_only=True, allow_null=True)
    dc = serializers.SerializerMethodField()
    exitos_requeridos = serializers.SerializerMethodField()

    class Meta:
        model = Receta
        fields = [
            'id',
            'nombre',
            'objeto_final',
            'nombre_objeto_final',
            'ingredientes',
            'cantidad_final',
            'es_magico',
            'oro_necesario',
            'herramienta',
            # Nuevos campos para objetos mágicos
            'rareza',
            'material_raro',
            'nombre_material_raro',
            'grado_minimo_requerido',
            'es_consumible',
            'dc',
            'exitos_requeridos'
        ]
    
    def get_dc(self, obj):
        return obj.obtener_dc()
    
    def get_exitos_requeridos(self, obj):
        return obj.obtener_exitos_requeridos()

class InventarioSerializer(serializers.ModelSerializer):
    objeto_nombre = serializers.CharField(source='objeto.Name', read_only=True)

    class Meta:
        model = Inventario
        fields = ['id', 'objeto', 'objeto_nombre', 'cantidad']



class ProficienciaSerializer(serializers.ModelSerializer):
    personaje_nombre = serializers.CharField(source='personaje.nombre_personaje', read_only=True)
    habilidad_nombre = serializers.CharField(source='habilidad.nombre', read_only=True)

    class Meta:
        model = Proficiencia
        fields = ['id', 'personaje', 'personaje_nombre', 'habilidad', 'habilidad_nombre', 'es_proficiente']


class TrabajoSerializer(serializers.ModelSerializer):
    requisito_habilidad_nombre = serializers.CharField(source='requisito_habilidad.nombre', read_only=True)
    
    # --- AÑADE ESTA LÍNEA ---
    requisito_habilidad_estadistica = serializers.CharField(source='requisito_habilidad.estadistica_asociada', read_only=True)
    
    pagos = serializers.SerializerMethodField() 

    class Meta:
        model = Trabajo
        fields = [
            'id', 
            'nombre', 
            'requisito_habilidad', 
            'requisito_habilidad_nombre', 
            
            # --- Y AÑÁDELA AQUÍ TAMBIÉN ---
            'requisito_habilidad_estadistica', 
            
            'rango_maximo', 
            'descripcion', 
            'beneficio', 
            'pagos'
        ]

    def get_pagos(self, obj):
        """Obtener los pagos relacionados con este trabajo"""
        pagos = obj.pagos.all().order_by('rango')
        return PagoRangoSerializer(pagos, many=True).data


class HabilidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habilidad
        fields = '__all__'


class BonusProficienciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = BonusProficiencia
        fields = '__all__'


class PagoRangoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoRango
        fields = '__all__'

class TrabajoRealizadoSerializer(serializers.ModelSerializer):
    pago_total = serializers.FloatField(read_only=True)

    class Meta:
        model = TrabajoRealizado
        fields = '__all__'

class ProgresoTrabajoSerializer(serializers.ModelSerializer):
    """
    Serializa el progreso del trabajo para el frontend.
    """
    class Meta:
        model = ProgresoTrabajo
        fields = '__all__'
        
class ObjetoTiendaSerializer(serializers.ModelSerializer):
    nombre_objeto = serializers.CharField(source='objeto.Name', read_only=True)

    class Meta:
        model = ObjetoTienda
        fields = ['id', 'objeto', 'nombre_objeto', 'stock', 'precio_personalizado']


class TiendaSerializer(serializers.ModelSerializer):
    inventario = ObjetoTiendaSerializer(many=True, read_only=True)

    class Meta:
        model = Tienda
        fields = ['id', 'nombre', 'descripcion', 'npc_asociado', 'inventario']


class CompetenciaHerramientaSerializer(serializers.ModelSerializer):
    modificador = serializers.SerializerMethodField()
    modificador_competencia = serializers.SerializerMethodField()
    modificador_habilidad = serializers.SerializerMethodField()
    habilidad_maxima = serializers.SerializerMethodField()
    info_grado = serializers.SerializerMethodField()
    exitos_para_siguiente_grado = serializers.SerializerMethodField()
    
    class Meta:
        model = CompetenciaHerramienta
        fields = [
            'id', 'nombre_herramienta', 'grado', 'exitos_acumulados',
            'modificador', 'modificador_competencia', 'modificador_habilidad',
            'habilidad_maxima', 'info_grado', 'exitos_para_siguiente_grado',
            'fecha_obtencion'
        ]
    
    def get_modificador(self, obj):
        """Modificador TOTAL (competencia + habilidad)"""
        return obj.obtener_modificador()
    
    def get_modificador_competencia(self, obj):
        """Solo el modificador de competencia (PB × grado)"""
        return obj.obtener_modificador_competencia()
    
    def get_modificador_habilidad(self, obj):
        """Solo el modificador de habilidad"""
        return obj.obtener_modificador_habilidad()
    
    def get_habilidad_maxima(self, obj):
        """Devuelve la habilidad más alta y su valor"""
        habilidades = {
            'Fuerza': obj.personaje.fuerza,
            'Inteligencia': obj.personaje.inteligencia,
            'Sabiduría': obj.personaje.sabiduria,
            'Destreza': obj.personaje.destreza,
            'Constitución': obj.personaje.constitucion,
            'Carisma': obj.personaje.carisma,
        }
        
        max_habilidad = max(habilidades, key=habilidades.get)
        max_valor = habilidades[max_habilidad]
        
        return {
            'nombre': max_habilidad,
            'valor': max_valor
        }
    
    def get_info_grado(self, obj):
        return obj.obtener_info_grado()
    
    def get_exitos_para_siguiente_grado(self, obj):
        requisitos = {
            'Novato': 1,
            'Aprendiz': 2,
            'Experto': 10,
            'Maestro Artesano': 50,
            'Gran Maestro': None,  # Máximo nivel
        }
        return requisitos.get(obj.grado)


# serializers.py - RecetaDisponibleSerializer COMPLETO

class RecetaDisponibleSerializer(serializers.ModelSerializer):
    """Serializer extendido que muestra toda la info necesaria para craftear"""
    ingredientes = serializers.SerializerMethodField()
    nombre_objeto_final = serializers.CharField(source='objeto_final.Name', read_only=True)
    puede_craftear = serializers.SerializerMethodField()
    ingredientes_faltantes = serializers.SerializerMethodField()
    dc = serializers.SerializerMethodField()
    exitos_requeridos = serializers.SerializerMethodField()
    nombre_material_raro = serializers.CharField(source='material_raro.Name', read_only=True, allow_null=True)
    competencia_personaje = serializers.SerializerMethodField()
    coste_magico = serializers.SerializerMethodField()
    puede_craftear_rareza = serializers.SerializerMethodField()
    
    class Meta:
        model = Receta
        fields = [
            'id', 'nombre', 'objeto_final', 'nombre_objeto_final',
            'cantidad_final', 'es_magico', 'oro_necesario', 'herramienta',
            'ingredientes', 'puede_craftear', 'ingredientes_faltantes',
            'rareza', 'material_raro', 'nombre_material_raro', 
            'grado_minimo_requerido', 'es_consumible', 'dc', 'exitos_requeridos',
            'competencia_personaje', 'coste_magico', 'puede_craftear_rareza'
        ]
    
    def get_ingredientes(self, obj):
        """Lista todos los ingredientes incluyendo el material raro"""
        ingredientes_list = []
        for ing in obj.ingredientes.all():
            ingredientes_list.append({
                'objeto_id': ing.objeto.id,
                'nombre': ing.objeto.Name,
                'cantidad_necesaria': ing.cantidad
            })
        
        # Añadir material raro si existe
        if obj.es_magico and obj.material_raro:
            ingredientes_list.append({
                'objeto_id': obj.material_raro.id,
                'nombre': obj.material_raro.Name,
                'cantidad_necesaria': 1,
                'es_material_raro': True
            })
        
        return ingredientes_list
    
    def get_dc(self, obj):
        return obj.obtener_dc()
    
    def get_exitos_requeridos(self, obj):
        return obj.obtener_exitos_requeridos()
    
    def get_coste_magico(self, obj):
        """Retorna el coste total para objetos mágicos"""
        if obj.es_magico:
            return obj.obtener_coste_magico()
        return None
    
    def get_puede_craftear_rareza(self, obj):
        """Verifica si el personaje tiene el grado suficiente para la rareza"""
        if not obj.es_magico:
            return True
        
        personaje = self.context.get('personaje')
        if not personaje or not obj.herramienta:
            return False
        
        try:
            competencia = CompetenciaHerramienta.objects.get(
                personaje=personaje,
                nombre_herramienta=obj.herramienta
            )
            from .models import puede_craftear_rareza
            return puede_craftear_rareza(competencia.grado, obj.rareza)
        except CompetenciaHerramienta.DoesNotExist:
            # Si no tiene la competencia, solo puede hacer Common como Novato
            return obj.rareza == 'Common' and obj.obtener_grado_minimo_efectivo() == 'Novato'

    def get_puede_craftear(self, obj):
        personaje = self.context.get('personaje')
        if not personaje:
            return False
        
        # ✅ Verificar rareza si es mágico (sin llamada recursiva)
        if obj.es_magico:
            # Usar el método correcto para verificar rareza
            if not self.get_puede_craftear_rareza(obj):
                return False
            
            # Verificar que tenga recursos para el coste mágico
            coste = obj.obtener_coste_magico()
            if personaje.tiempo_libre < coste['dias'] or personaje.oro < coste['oro']:
                return False
        
        # Verificar ingredientes normales
        for ing in obj.ingredientes.all():
            inventario_item = Inventario.objects.filter(
                personaje=personaje,
                objeto=ing.objeto
            ).first()
            
            if not inventario_item or inventario_item.cantidad < ing.cantidad:
                return False
        
        # Verificar material raro para objetos mágicos
        if obj.es_magico and obj.material_raro:
            material_inv = Inventario.objects.filter(
                personaje=personaje,
                objeto=obj.material_raro
            ).first()
            if not material_inv or material_inv.cantidad < 1:
                return False
        
        # Verificar herramienta en inventario
        if obj.herramienta:
            tiene_herramienta = Inventario.objects.filter(
                personaje=personaje,
                objeto__Name__icontains=obj.herramienta
            ).exists()
            if not tiene_herramienta:
                return False
        
        # Verificar grado de competencia
        try:
            competencia = CompetenciaHerramienta.objects.get(
                personaje=personaje,
                nombre_herramienta=obj.herramienta
            )
            grados_orden = ['Novato', 'Aprendiz', 'Experto', 'Maestro Artesano', 'Gran Maestro']
            grado_actual_idx = grados_orden.index(competencia.grado)
            
            # Usar el método que calcula el grado correcto según tipo
            grado_requerido = obj.obtener_grado_minimo_efectivo()
            grado_requerido_idx = grados_orden.index(grado_requerido)
            
            if grado_actual_idx < grado_requerido_idx:
                return False
        except CompetenciaHerramienta.DoesNotExist:
            grado_requerido = obj.obtener_grado_minimo_efectivo()
            if grado_requerido != 'Novato':
                return False
        
        return True
    
    def get_competencia_personaje(self, obj):
        """Retorna la competencia del personaje con la herramienta necesaria"""
        personaje = self.context.get('personaje')
        if not personaje or not obj.herramienta:
            return None
        
        try:
            competencia = CompetenciaHerramienta.objects.get(
                personaje=personaje,
                nombre_herramienta=obj.herramienta
            )
            return CompetenciaHerramientaSerializer(competencia).data
        except CompetenciaHerramienta.DoesNotExist:
            return {
                'grado': 'Novato',
                'exitos_acumulados': 0,
                'mensaje': 'Primera vez usando esta herramienta'
            }
    
    
    def get_ingredientes_faltantes(self, obj):
        personaje = self.context.get('personaje')
        if not personaje:
            return []
        
        faltantes = []
        
        # Ingredientes normales
        for ing in obj.ingredientes.all():
            inventario_item = Inventario.objects.filter(
                personaje=personaje,
                objeto=ing.objeto
            ).first()
            
            cantidad_actual = inventario_item.cantidad if inventario_item else 0
            if cantidad_actual < ing.cantidad:
                faltantes.append({
                    'objeto': ing.objeto.Name,
                    'necesaria': ing.cantidad,
                    'actual': cantidad_actual,
                    'faltante': ing.cantidad - cantidad_actual
                })
        
        # Material raro
        if obj.es_magico and obj.material_raro:
            material_inv = Inventario.objects.filter(
                personaje=personaje,
                objeto=obj.material_raro
            ).first()
            cantidad_actual = material_inv.cantidad if material_inv else 0
            if cantidad_actual < 1:
                faltantes.append({
                    'objeto': obj.material_raro.Name + ' (Material Raro)',
                    'necesaria': 1,
                    'actual': cantidad_actual,
                    'faltante': 1 - cantidad_actual
                })
        
        return faltantes


class HistorialTiradaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialTirada
        fields = [
            'id', 'resultado_dado', 'modificador', 'resultado_total',
            'exito', 'oro_sumado', 'oro_gastado', 'fecha'
        ]


class ProgresoRecetaSerializer(serializers.ModelSerializer):
    receta_nombre = serializers.CharField(source='receta.nombre', read_only=True)
    objeto_final = serializers.CharField(source='receta.objeto_final.Name', read_only=True)
    es_magico = serializers.BooleanField(source='receta.es_magico', read_only=True)

    oro_necesario = serializers.IntegerField(source='receta.oro_necesario', read_only=True)
    dc = serializers.IntegerField(source='receta.obtener_dc', read_only=True)
    
    porcentaje_completado = serializers.SerializerMethodField()
    tiradas = serializers.SerializerMethodField()
    competencia = CompetenciaHerramientaSerializer(source='competencia_utilizada', read_only=True)
    
    class Meta:
        model = ProgresoReceta
        fields = [
            'id', 'receta_nombre', 'objeto_final', 'es_magico',
            'oro_acumulado', 'exitos_conseguidos', 'exitos_requeridos',
            'oro_necesario',  # 
            'dc',             # 
            'dias_trabajados', 'estado', 'porcentaje_completado',
            'tiradas', 'competencia', 'fecha_inicio'
        ]
    
    def get_porcentaje_completado(self, obj):
        if obj.receta.es_magico:
            if obj.exitos_requeridos == 0:
                return 100
            return min(100, (obj.exitos_conseguidos / obj.exitos_requeridos) * 100)
        else:
            if obj.receta.oro_necesario == 0:
                return 100
            return min(100, (obj.oro_acumulado / obj.receta.oro_necesario) * 100)
    
    def get_tiradas(self, obj):
        # Últimas 10 tiradas
        tiradas = obj.tiradas.all().order_by('-fecha')[:10]
        return HistorialTiradaSerializer(tiradas, many=True).data


# Serializers para acciones
class IniciarCraftingSerializer(serializers.Serializer):
    receta_id = serializers.IntegerField()
    personaje_id = serializers.IntegerField()


class TiradaCraftingSerializer(serializers.Serializer):
    progreso_id = serializers.IntegerField()
    
# Serializers para especies
class TraitOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trait
        exclude = ('species', 'parent_choice')


class TraitSerializer(serializers.ModelSerializer):
    options = TraitOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Trait
        fields = '__all__'


class SpeciesSerializer(serializers.ModelSerializer):
    traits = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Species
        fields = '__all__' 
        read_only_fields = ('slug',) 

    def get_traits(self, obj):
        try:
            all_traits = obj.traits.all() 
            top_level_traits = [t for t in all_traits if t.parent_choice_id is None]
            
            top_level_traits.sort(key=lambda t: t.display_order)
            
            return TraitSerializer(top_level_traits, many=True, context=self.context).data
        except AttributeError:
            return []

# Serializers para clases
class ClassFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassFeature
        fields = '__all__'

class ClassResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassResource
        fields = '__all__'

class DnDClassSerializer(serializers.ModelSerializer):
    features = ClassFeatureSerializer(many=True, read_only=True)
    resources = ClassResourceSerializer(many=True, read_only=True)
    skill_choices = HabilidadSerializer(many=True, read_only=True)

    class Meta:
        model = DnDClass
        fields = '__all__'

# Serializers para subclases
class SubclassResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubclassResource
        fields = '__all__'

class SubclassFeatureOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubclassFeature
        exclude = ('parent_feature', 'dnd_subclass')

class SubclassFeatureSerializer(serializers.ModelSerializer):
    options = SubclassFeatureOptionSerializer(many=True, read_only=True)

    class Meta:
        model = SubclassFeature
        fields = '__all__'

class DnDSubclassSerializer(serializers.ModelSerializer):
    resources = SubclassResourceSerializer(many=True, read_only=True)
    skill_choices = HabilidadSerializer(many=True, read_only=True)
    skill_choices_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Habilidad.objects.all(),
        source='skill_choices'
    )
    features = serializers.SerializerMethodField(read_only=True)
    dnd_class_name = serializers.CharField(source='dnd_class.name', read_only=True)
    class Meta:
        model = DnDSubclass
        fields = '__all__'
        read_only_fields = ('slug',)

    def get_features(self, obj):
        try:
            all_features = obj.features.all()
            parents = [f for f in all_features if f.parent_feature_id is None]
            parents.sort(key=lambda x: (x.level, x.display_order))
            return SubclassFeatureSerializer(parents, many=True).data
        except AttributeError:
            return []

# Serializers para dotes
class FeatFeatureOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatFeature
        exclude = ('parent_feature', 'dnd_feat')

class SpeciesReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Species
        fields = ['id', 'name', 'slug']

class FeatFeatureSerializer(serializers.ModelSerializer):
    options = FeatFeatureOptionSerializer(many=True, read_only=True)
    class Meta:
        model = FeatFeature
        fields = '__all__'

class DnDFeatSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField(read_only=True)
    prerequisite_species_data = SpeciesReferenceSerializer(source='prerequisite_species', read_only=True)
    prerequisite_feat_name = serializers.ReadOnlyField(source='prerequisite_feat.name')
    class Meta:
        model = DnDFeat
        fields = '__all__'
    def get_features(self, obj):
        try:
            all_features = obj.features.all()
            # Solo padres
            parents = [f for f in all_features if f.parent_feature_id is None]
            parents.sort(key=lambda x: x.display_order)
            return FeatFeatureSerializer(parents, many=True).data
        except AttributeError:
            return []


# PARA GRUPOS

class InventarioPartySerializer(serializers.ModelSerializer):
    # Traemos datos del Objeto para mostrarlos en el frontend sin hacer otra petición
    objeto_nombre = serializers.CharField(source='objeto.Name', read_only=True)
    objeto_rarity = serializers.CharField(source='objeto.Rarity', read_only=True)
    objeto_value = serializers.CharField(source='objeto.Value', read_only=True)
    objeto_text = serializers.CharField(source='objeto.Text', read_only=True) # Descripción
    
    # Nombre del personaje que lo donó
    donado_por_nombre = serializers.CharField(source='donado_por.nombre_personaje', read_only=True)

    class Meta:
        model = InventarioParty
        fields = [
            'id', 'party', 'objeto', 'cantidad', 
            'objeto_nombre', 'objeto_rarity', 'objeto_value', 'objeto_text',
            'donado_por', 'donado_por_nombre'
        ]


class PartySerializer(serializers.ModelSerializer):
    creador_nombre = serializers.CharField(source='creador.username', read_only=True)
    
    miembros_info = serializers.SerializerMethodField()

    class Meta:
        model = Party
        fields = ['id', 'nombre', 'descripcion', 'creador', 'creador_nombre', 'miembros', 'miembros_info', 'fecha_creacion']
        read_only_fields = ['creador', 'miembros'] 

    def get_miembros_info(self, obj):

        return obj.miembros.values('id', 'nombre_personaje', 'clase', 'nivel')

# Serializers para NPCs
class RelacionNPCSerializer(serializers.ModelSerializer):
    npc_nombre = serializers.ReadOnlyField(source='npc.name')
    npc_titulo = serializers.ReadOnlyField(source='npc.title')
    personaje_nombre = serializers.ReadOnlyField(source='personaje.nombre_personaje')
    class Meta:
        model = RelacionNPC
        fields = '__all__'

class NPCSerializer(serializers.ModelSerializer):
    species_name = serializers.ReadOnlyField(source='species.name')
    class Meta:
        model = NPC
        fields = '__all__'