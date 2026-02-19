from django.shortcuts import render
from django.core.serializers import serialize
from django.http import JsonResponse
from django.core.management import call_command
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


def actualizar_radares(request):
    try:
        # Esto es exactamente igual que escribir "python manage.py cargar_radares" en la terminal
        call_command('cargar_radares')

        # Si va bien, devolvemos un mensaje de éxito en formato JSON
        return JsonResponse({'status': 'ok', 'mensaje': 'Radares actualizados correctamente'})
    except Exception as e:
        # Si algo falla, devolvemos el error
        return JsonResponse({'status': 'error', 'mensaje': str(e)}, status=500)