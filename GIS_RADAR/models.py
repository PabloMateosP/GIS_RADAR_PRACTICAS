from django.contrib.gis.db import models

# Create your models here.
class Radar(models.Model):
    # Campos normales
    nombre = models.CharField(max_length=100)
    velocidad = models.IntegerField(default=120)

    # EL CAMPO MÁGICO (Aquí es donde GeoDjango brilla)
    # srid=4326 significa que usaremos coordenadas GPS (latitud/longitud mundial)
    ubicacion = models.PointField(srid=4326)

    def __str__(self):
        return f"{self.nombre} ({self.velocidad} km/h)"