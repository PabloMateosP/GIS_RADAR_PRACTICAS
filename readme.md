# README #

# GIS Radar DGT - Sistema de Gestion Cartografica Espacial

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-GeoDjango-092E20.svg)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791.svg)](https://postgis.net/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Geoman-199900.svg)](https://leafletjs.com/)

## Descripcion del Proyecto

Aplicacion web Full-Stack GIS (Geographic Information System) orientada a la gestion, visualizacion y edicion de infraestructuras de control de trafico en tiempo real. El sistema integra el consumo de datos abiertos de la Direccion General de Trafico (DGT) mediante XML y proporciona un entorno de edicion cartografica bidireccional en el navegador.

El proyecto esta disenado para resolver el problema de la sincronizacion de datos externos sin sobrescribir las ediciones manuales locales, manteniendo una base de datos espacial coherente y centralizada.

## Arquitectura del Sistema



La arquitectura sigue un patron cliente-servidor con una fuerte separacion de responsabilidades:
1. **Frontend (Capa de Presentacion y Edicion):** Construido con HTML, CSS y JavaScript Vanilla. Utiliza Leaflet como motor de renderizado de mapas, MarkerCluster para la agrupacion de puntos y Geoman para la interaccion geometrica.
2. **Backend (Capa de Logica y API):** Desarrollado en Python con Django. Expone endpoints mediante vistas asincronas para procesar las peticiones AJAX/Fetch generadas por los eventos del mapa.
3. **Base de Datos (Capa de Persistencia):** PostgreSQL potenciado con PostGIS para almacenar los registros como geometrias nativas (PointField) bajo el SRID 4326 (WGS 84).

## Funcionalidades Core

* **Sincronizacion No Destructiva (Algoritmo de Insercion Condicional):** Consume el XML de la DGT e inserta nuevos radares comprobando colisiones de coordenadas para proteger las modificaciones locales de la base de datos.
* **CRUD Espacial en Cliente (Leaflet-Geoman):**
  * **Create:** Adicion de controles "Moviles" haciendo clic en el mapa tras activar la herramienta de dibujo.
  * **Read:** Renderizado de puntos con simbologia dinamica condicionada por el atributo `tipo` (Fijo vs. Movil) y agrupacion automatica por clasteres.
  * **Update:** * *Atributos:* Edicion de nombre y limite de velocidad integrada en popups de Leaflet.
    * *Espacial:* Captura del evento `pm:dragend` para arrastrar marcadores y actualizar la latitud/longitud en la base de datos en tiempo real.
  * **Delete:** Intercepcion del evento `pm:remove` mediante la herramienta de borrado de Geoman para confirmar y eliminar el registro en PostGIS.
* **Geolocalizacion Activa:** Seguimiento del usuario mediante la API nativa del navegador con representacion del radio de precision espacial.

## Instalacion y Despliegue Local

### Requisitos Previos
* Python 3.10 o superior.
* PostgreSQL instalado localmente con la extension PostGIS habilitada.

### Pasos de Instalacion

1. Clonar el repositorio:
```bash
git clone [https://github.com/tu-usuario/gis-radar-dgt.git](https://github.com/tu-usuario/gis-radar-dgt.git)
cd gis-radar-dgt
```
2. Crear y activar entorno virtual
```bash
python -m venv venv
source venv/bin/activate  # En Windows usa: venv\Scripts\activate
```

3. Instalar las dependencias del proyecto
```bash
pip install -r requirements.txt
```

4. Configura la base de datos
Asegurate de crear una base de datos espacial en PostgreSQL y configurar las credenciales en GIS_RADAR/settings.py:
```bash
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'tu_base_de_datos',
        'USER': 'tu_usuario',
        'PASSWORD': 'tu_password', // No es buena práctica dejar la contraseña en el mismo documento. 
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

5. Ejecutar migraciones para construir las tablas espaciales: 
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Levantar el servidor de desarrollo:
```bash
python manage.py runserver
```

7. Acceder a la aplicación mediante el enlace: http://localhost:8000/Radar/

## Estructura de Enpoints de Comunicación: 

El mapa interactua asincronamente con el backend a traves de las siguientes rutas:

- GET /Radar/actualizar/: Dispara el script de parsing XML contra los servidores de la DGT.
- POST /Radar/crear_movil/: Recibe un payload JSON con coordenadas y atributos para instanciar un punto nuevo.
- POST /Radar/editar/<id>/: Actualiza la informacion alfanumerica del punto.
- POST /Radar/mover/<id>/: Actualiza la geometria espacial PointField tras un evento drag & drop.
- POST /Radar/borrar/<id>/: Elimina permanentemente el registro de la base de datos espacial.