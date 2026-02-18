from django.urls import path
from . import views

urlpatterns = [
    # Al dejar las comillas vacías '', decimos que es la portada de la sección "Radar/"
    path('', views.mapa_radares, name='mapa_radares'),
]