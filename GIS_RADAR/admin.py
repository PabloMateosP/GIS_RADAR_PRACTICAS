from django.contrib.gis import admin  # <--- OJO: Importamos de .gis.admin
from .models import Radar

# Usamos GISModelAdmin en lugar de ModelAdmin normal
# Esto es lo que hace que aparezca el mapa de OpenStreetMap
@admin.register(Radar)
class RadarAdmin(admin.GISModelAdmin):
    list_display = ('nombre', 'velocidad', 'ubicacion')
