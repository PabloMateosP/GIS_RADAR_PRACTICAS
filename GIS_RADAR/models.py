from django.contrib.gis.db import models

# Son los planos para los objetos de nuestra base de datos.
class Radar(models.Model):
    TIPOS_RADAR = [
        ('FIJO', 'Radar Fijo'),
        ('MOVIL', 'Zona de Radar Móvil'),
    ]

    nombre = models.CharField(max_length=200)
    velocidad = models.IntegerField(default=0)
    tipo = models.CharField(max_length=10, choices=TIPOS_RADAR, default='FIJO')
    ubicacion = models.PointField(srid=4326)

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"

# Este archivo es el que se usa cuando ejecutamos el comando: python manage.py makemigrations
# con el anterior comando creamos las instrucciones para el posterior comando: python manage.py migrate
# con este comando final ya construimos mediante las sentencias necesarias en postGIS.

# Estos comandos solo se deben ejecutar cuando modificamos la estructura de nuestra base de datos, tanto añadiendo
# un nuevo campo como eliminando ...

# TODO: MOCEL NUEVO FK A Radar (muiltas)

# tt, matricula, velocidad, importe