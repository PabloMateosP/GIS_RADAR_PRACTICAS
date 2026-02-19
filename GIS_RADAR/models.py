from django.contrib.gis.db import models

# EL CAMBIO ESTÁ AQUÍ: models.Model
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