import requests
import xml.etree.ElementTree as ET
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from GIS_RADAR.models import Radar


class Command(BaseCommand):
    help = 'Carga radares únicos (elimina duplicados de sentido contrario)'

    def handle(self, *args, **kwargs):
        # 1. Limpiamos la base de datos para empezar de cero
        Radar.objects.all().delete()
        self.stdout.write("Limpiando base de datos...")

        url = "https://infocar.dgt.es/datex2/dgt/PredefinedLocationsPublication/radares/content.xml"

        self.stdout.write("Descargando datos oficiales...")
        response = requests.get(url)

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR('Error al descargar'))
            return

        root = ET.fromstring(response.content)
        ns = {'d2': 'http://datex2.eu/schema/1_0/1_0'}

        count = 0
        ignorados = 0

        for location in root.findall('.//d2:predefinedLocation', ns):
            try:
                coords = location.find('.//d2:pointCoordinates', ns)
                if coords is None:
                    continue

                lat = float(coords.find('d2:latitude', ns).text)
                lon = float(coords.find('d2:longitude', ns).text)

                # Creamos el punto geométrico
                punto = Point(lon, lat, srid=4326)

                # --- EL FILTRO ANTI-DUPLICADOS ---
                # Preguntamos: ¿Existe ya algún radar EXACTAMENTE en este punto?
                if Radar.objects.filter(ubicacion=punto).exists():
                    ignorados += 1
                    continue  # Si existe, pasamos al siguiente (saltamos este)

                # Si no existe, sacamos el nombre y lo creamos
                nombre_via = "Radar"
                name_tag = location.find('.//d2:descriptor/d2:value', ns)
                if name_tag is not None:
                    nombre_via = name_tag.text

                # Ya no necesitamos el ID raro en el nombre porque no habrá duplicados
                Radar.objects.create(
                    nombre=nombre_via,
                    velocidad=0,
                    ubicacion=punto
                )
                count += 1

            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error: {e}'))

        self.stdout.write(self.style.SUCCESS(f'-----------------------------------'))
        self.stdout.write(self.style.SUCCESS(f'Radares físicos cargados: {count}'))
        self.stdout.write(self.style.WARNING(f'Duplicados eliminados (sentido contrario): {ignorados}'))
        self.stdout.write(self.style.SUCCESS(f'-----------------------------------'))