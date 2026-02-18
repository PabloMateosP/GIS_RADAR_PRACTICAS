from django.shortcuts import render
from django.core.serializers import serialize  # <--- Importante
from .models import Radar


def mapa_radares(request):
    # 1. Obtener todos los radares
    radares = Radar.objects.all()

    # 2. Convertirlos a GeoJSON
    # El primer argumento es el formato ('geojson')
    # El segundo son los datos
    # geometry_field='ubicacion' le dice cuál es el campo del punto
    radares_geojson = serialize('geojson', radares, geometry_field='ubicacion', fields=('nombre', 'velocidad'))

    # 3. Enviarlos al HTML (contexto)
    return render(request, 'mapa.html', {'radares_data': radares_geojson})