from django.core.management.base import BaseCommand
from GIS_RADAR.services.radares_service import sincronizar_radares


class Command(BaseCommand):
    help = 'Actualiza radares nuevos sin borrar las ediciones manuales'

    def handle(self, *args, **kwargs):
        self.stdout.write("Sincronizando con DGT...")

        try:
            resultado = sincronizar_radares()

            self.stdout.write(self.style.SUCCESS('-----------------------------------'))
            self.stdout.write(self.style.SUCCESS(
                f'Nuevos radares añadidos: {resultado["nuevos"]}'
            ))
            self.stdout.write(self.style.SUCCESS(
                f'Radares previos conservados: {resultado["existentes"]}'
            ))
            self.stdout.write(self.style.SUCCESS('-----------------------------------'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(str(e)))