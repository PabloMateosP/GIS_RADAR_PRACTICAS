import requests
import xml.etree.ElementTree as ET # Importamos para leer los datos de la DGT en mejor formato
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from GIS_RADAR.models import Radar

class Command(BaseCommand):
    help = 'Actualiza radares nuevos sin borrar las ediciones manuales'

    def handle(self, *args, **kwargs):
        self.stdout.write("Sincronizando con DGT...")

        url = "https://infocar.dgt.es/datex2/dgt/PredefinedLocationsPublication/radares/content.xml"
        response = requests.get(url) # Descargamos el archivo

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR('Error al descargar'))
            return

        root = ET.fromstring(response.content) # Volvemos lo descargado en datos navegables a modo de árbol.
        ns = {'d2': 'http://datex2.eu/schema/1_0/1_0'} # Etiqueta prefijada d2 para organizar información.

        nuevos = 0
        existentes = 0

        for location in root.findall('.//d2:predefinedLocation', ns): # Buscamos en el documento las etiquetas predefinedLocation
            try:
                coords = location.find('.//d2:pointCoordinates', ns)
                if coords is None:
                    continue

                lat = float(coords.find('d2:latitude', ns).text)
                lon = float(coords.find('d2:longitude', ns).text)
                punto = Point(lon, lat, srid=4326) # Guardamos en un objeto Punto con el estandar de sistema de coordenadas GPS

                # Comprobamos si ya tenemos un radar en ese punto exacto
                if Radar.objects.filter(ubicacion=punto).exists():
                    # Ya existe. Lo ignoramos para proteger los cambios manuales.
                    existentes += 1
                    continue

                # Si no existe, es un radar nuevo
                nombre_via = "Radar"
                name_tag = location.find('.//d2:descriptor/d2:value', ns)
                if name_tag is not None:
                    nombre_via = name_tag.text

                Radar.objects.create(
                    nombre=nombre_via,
                    velocidad=0,
                    ubicacion=punto
                )
                nuevos += 1

            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error: {e}'))

        self.stdout.write(self.style.SUCCESS(f'-----------------------------------'))
        self.stdout.write(self.style.SUCCESS(f'Nuevos radares añadidos: {nuevos}'))
        self.stdout.write(self.style.SUCCESS(f'Radares previos conservados: {existentes}'))
        self.stdout.write(self.style.SUCCESS(f'-----------------------------------'))