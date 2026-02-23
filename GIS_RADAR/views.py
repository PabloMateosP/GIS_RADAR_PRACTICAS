from django.shortcuts import render
from django.core.serializers import serialize
from django.http import JsonResponse
from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Point
from .models import Radar
import json

def mapa_radares(request):
    # 1. Obtener todos los radares
    radares = Radar.objects.all()

    # 2. Convertirlos a GeoJSON
    # Añadimos 'tipo' en los fields para que viaje al frontend
    radares_geojson = serialize('geojson', radares, geometry_field='ubicacion', fields=('nombre', 'velocidad', 'tipo'))

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

# Para que podamos modificar la base de datos, necesitamos saltar el Token CSRF que no voy a implementar para
# hacer más sencilla la app.
# Para una app sería es de vital importancia ya un atacante podría modificar la base de datos
@csrf_exempt
def editar_radar(request, radar_id):
    if request.method == 'POST':
        try:
            # Leemos los datos que nos manda JavaScript
            data = json.loads(request.body)

            # Buscamos el radar en la base de datos
            radar = Radar.objects.get(id=radar_id)

            # Actualizamos los campos
            radar.nombre = data.get('nombre', radar.nombre)
            radar.velocidad = data.get('velocidad', radar.velocidad)

            # Guardamos los cambios
            radar.save()
            return JsonResponse({'status': 'ok'})

        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})

@csrf_exempt
def borrar_radar(request, radar_id):
    if request.method == 'POST':
        try:
            # Buscamos el radar y lo eliminamos
            radar = Radar.objects.get(id=radar_id)
            radar.delete()
            return JsonResponse({'status': 'ok'})

        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})

@csrf_exempt
def mover_radar(request, radar_id):
    if request.method == 'POST':
        try:
            # Leemos las coordenadas que nos mandará JavaScript
            data = json.loads(request.body)
            nueva_lat = data.get('lat')
            nueva_lng = data.get('lng')

            # Buscamos el radar y le asignamos el nuevo punto espacial
            radar = Radar.objects.get(id=radar_id)
            radar.ubicacion = Point(nueva_lng, nueva_lat, srid=4326)  # Ojo: Point usa (Longitud, Latitud)
            radar.save()

            return JsonResponse({'status': 'ok'})

        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})

@csrf_exempt
def crear_radar_movil(request):
    if request.method == 'POST':
        try:
            # Leemos los datos enviados por Geoman/JavaScript
            data = json.loads(request.body)
            nombre = data.get('nombre', 'Zona de Control Móvil')
            velocidad = data.get('velocidad', 0)
            nueva_lat = data.get('lat')
            nueva_lng = data.get('lng')

            # Creamos el punto espacial
            punto = Point(nueva_lng, nueva_lat, srid=4326)

            # Guardamos en la base de datos especificando el tipo MOVIL
            Radar.objects.create(
                nombre=nombre,
                velocidad=velocidad,
                tipo='MOVIL',
                ubicacion=punto
            )

            return JsonResponse({'status': 'ok'})

        except Exception as e:
            return JsonResponse({'status': 'error', 'mensaje': str(e)})