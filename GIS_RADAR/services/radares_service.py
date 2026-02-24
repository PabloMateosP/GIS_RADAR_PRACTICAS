import requests
import xml.etree.ElementTree as ET
from django.contrib.gis.geos import Point
from GIS_RADAR.models import Radar

DGT_URL = "https://infocar.dgt.es/datex2/dgt/PredefinedLocationsPublication/radares/content.xml"


def sincronizar_radares():
    """
    Descarga los radares desde la DGT y crea únicamente los nuevos.
    No modifica los existentes.

    Devuelve un diccionario con estadísticas.
    """

    response = requests.get(DGT_URL, timeout=10)

    if response.status_code != 200:
        raise Exception("Error al descargar datos de la DGT")

    root = ET.fromstring(response.content)
    ns = {'d2': 'http://datex2.eu/schema/1_0/1_0'}

    nuevos = 0
    existentes = 0

    for location in root.findall('.//d2:predefinedLocation', ns):
        try:
            coords = location.find('.//d2:pointCoordinates', ns)
            if coords is None:
                continue

            lat = float(coords.find('d2:latitude', ns).text)
            lon = float(coords.find('d2:longitude', ns).text)

            punto = Point(lon, lat, srid=4326)

            if Radar.objects.filter(ubicacion=punto).exists():
                existentes += 1
                continue

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

        except Exception:
            continue

    return {
        "nuevos": nuevos,
        "existentes": existentes
    }