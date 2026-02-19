from django.urls import path
from . import views

urlpatterns = [
    # Al dejar las comillas vacías '', decimos que es la portada de la sección "Radar/"
    path('', views.mapa_radares, name='mapa_radares'),
    path('actualizar/', views.actualizar_radares, name='actualizar_radares'),
    # NUEVAS RUTAS PARA EDITAR Y BORRAR
    path('editar/<int:radar_id>/', views.editar_radar, name='editar_radar'),
    path('borrar/<int:radar_id>/', views.borrar_radar, name='borrar_radar'),
]