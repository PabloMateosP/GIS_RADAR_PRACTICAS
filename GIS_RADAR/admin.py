from django.contrib.gis import admin  # <--- OJO: Importamos de .gis.admin
from django.contrib.auth.models import Group, User # Importamos los modelos que queremos ocultar
from .models import Radar

# Usamos GISModelAdmin en lugar de ModelAdmin normal
# Esto es lo que hace que aparezca el mapa de OpenStreetMap
@admin.register(Radar)
class RadarAdmin(admin.GISModelAdmin):
    list_display = ('nombre', 'velocidad', 'ubicacion')

# Quitamos que en nuestra vista de radares aparezcan los usuarios y grupos
admin.site.unregister(Group)
admin.site.unregister(User)