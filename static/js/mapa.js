// Inicializar el mapa
var map = L.map('map').setView([40.416, -3.703], 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// --- AQUÍ ESTÁ EL CAMBIO CLAVE ---

// A. Creamos un grupo de clusters (una "bolsa" inteligente)
var markers = L.markerClusterGroup();

var iconoRadar = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/75/75684.png', // Icono de radar (cámara)
    iconSize: [32, 32], // Tamaño en pixeles
    iconAnchor: [16, 32], // El punto que "toca" el mapa (la base del icono)
    popupAnchor: [0, -32] // Donde sale el popup respecto al icono
});

// B. Creamos la capa de puntos GeoJSON con el icono nuevo
var geoJsonLayer = L.geoJSON(datosRadares, {

    // Esta función convierte el punto matemático en un dibujo en el mapa
    pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: iconoRadar});
        },

    // Esta función añade el popup (lo que ya tenías)
    onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.nombre) {
            // He puesto un poco de HTML para que se vea más bonito (Negrita y salto de línea)
            var contenido = "<div style='text-align:center'>" +
                "📷 <b>RADAR FIJO</b><br>" +
                feature.properties.nombre +
                "</div>";
            layer.bindPopup(contenido);
        }
    }
});

// C. Metemos los puntos dentro de la "bolsa" de clusters
markers.addLayer(geoJsonLayer);

// D. Finalmente, añadimos la "bolsa" al mapa
map.addLayer(markers);

// Variable para guardar tu marcador y no crear mil si le das muchas veces
var miMarcador = null;

function centrarEnMiPosicion() {
    // Pedimos al mapa que nos busque
    map.locate({setView: true, maxZoom: 13});
}

// Cuando el mapa te encuentra, ejecuta esto:
map.on('locationfound', function(e) {
    // Si ya había un marcador tuyo, lo quitamos para poner el nuevo
    if (miMarcador) {
        map.removeLayer(miMarcador);
    }

    // Creamos un círculo azul pulsante (simulando el de Google Maps)
    miMarcador = L.circleMarker(e.latlng, {
        radius: 10,
        color: 'white',
        weight: 3,
        fillColor: '#2196F3', // Azul Google
        fillOpacity: 1
    }).addTo(map);

    // Añadimos un radio de precisión (el círculo azul clarito alrededor)
    L.circle(e.latlng, e.accuracy / 2).addTo(map);
});

// Si hay error (ej: no das permiso)
map.on('locationerror', function(e) {
    alert("No he podido encontrarte: " + e.message);
});

function llamarActualizacion() {
    var boton = document.getElementById('btn-actualizar');

    // Cambiamos el texto para que el usuario sepa que está trabajando
    boton.innerText = "Descargando...";
    boton.disabled = true;

    // Hacemos la petición a la URL que creamos en urls.py
    fetch('/Radar/actualizar/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                // Si todo va bien, recargamos la página para que Leaflet dibuje los nuevos puntos
                alert("Base de datos actualizada con la DGT. Recargando mapa...");
                location.reload();
            } else {
                alert("Hubo un error: " + data.mensaje);
                boton.innerText = "Actualizar DGT";
                boton.disabled = false;
            }
        })
        .catch(error => {
            alert("Error de conexión con el servidor.");
            boton.innerText = "Actualizar DGT";
            boton.disabled = false;
        });
}

// Código para mostrar los radares en el lateral
const listaDiv = document.getElementById('lista-radares');

// Recorremos todos los radares
datosRadares.features.forEach(feature => {
    const radarId = feature.id;
    const nombre = feature.properties.nombre;
    const velocidad = feature.properties.velocidad;

    const div = document.createElement('div');
    div.className = 'radar-item';

    // 1. Creamos el HTML SIN los onclick integrados
    div.innerHTML = `
        <strong>${nombre}</strong><br>
        <small>Velocidad: ${velocidad} km/h</small>
        <div class="radar-acciones">
            <button class="btn-editar">Editar</button>
            <button class="btn-borrar">Borrar</button>
        </div>
    `;

    // 2. Localizamos los botones que acabamos de crear
    const btnEditar = div.querySelector('.btn-editar');
    const btnBorrar = div.querySelector('.btn-borrar');

    // 3. Le damos la función al botón EDITAR
    btnEditar.onclick = function(evento) {
        evento.stopPropagation(); // Hace que el clic se quede en el botón y no active el zoom del mapa
        editarRadar(radarId, nombre, velocidad);
    };

    // 4. Le damos la función al botón BORRAR
    btnBorrar.onclick = function(evento) {
        evento.stopPropagation();
        borrarRadar(radarId);
    };

    // 5. Función para que el mapa vuele al radar (al hacer clic en cualquier otra parte de la caja)
    div.onclick = function() {
        const lat = feature.geometry.coordinates[1];
        const lng = feature.geometry.coordinates[0];
        map.flyTo([lat, lng], 16);
    };

    listaDiv.appendChild(div);
});

// Dejamos las funciones preparadas para el siguiente paso
function editarRadar(id, nombreActual) {
    function editarRadar(id, nombreActual, velocidadActual) {
        // Pedimos el nombre
        let nuevoNombre = prompt("Introduce el nuevo nombre para este radar:", nombreActual);
        if (nuevoNombre === null) return; // Si el usuario cancela, paramos

        // Pedimos la velocidad
        let nuevaVelocidad = prompt("Introduce el límite de velocidad (ej: 120):", velocidadActual);
        if (nuevaVelocidad === null) return; // Si cancela, paramos

        // Si ha cambiado algo, mostramos el aviso
        if (nuevoNombre !== nombreActual || nuevaVelocidad !== velocidadActual) {
            console.log("Datos a enviar -> ID: " + id + ", Nombre: " + nuevoNombre + ", Vel: " + nuevaVelocidad);
            alert("Cambios registrados localmente.\nFalta conectarlo con la base de datos de Django.");
        }
    }
}

function borrarRadar(id) {
    if (confirm("Vas a borrar este radar permanentemente. Continuar?")) {
        console.log("Pendiente de enviar borrado a Django. ID: " + id);
    }
}