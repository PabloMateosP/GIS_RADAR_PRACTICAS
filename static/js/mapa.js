// Inicializar el mapa
var map = L.map('map').setView([40.416, -3.703], 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// A. Creamos un grupo de clusters (una "bolsa" inteligente)
var markers = L.markerClusterGroup();

var iconoRadar = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/75/75684.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// B. Creamos la capa de puntos GeoJSON con el icono nuevo
var geoJsonLayer = L.geoJSON(datosRadares, {
    pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: iconoRadar});
        },
    onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.nombre) {
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
    map.locate({setView: true, maxZoom: 13});
}

map.on('locationfound', function(e) {
    if (miMarcador) {
        map.removeLayer(miMarcador);
    }
    miMarcador = L.circleMarker(e.latlng, {
        radius: 10,
        color: 'white',
        weight: 3,
        fillColor: '#2196F3',
        fillOpacity: 1
    }).addTo(map);
    L.circle(e.latlng, e.accuracy / 2).addTo(map);
});

map.on('locationerror', function(e) {
    alert("No he podido encontrarte: " + e.message);
});

function llamarActualizacion() {
    var boton = document.getElementById('btn-actualizar');
    boton.innerText = "Descargando...";
    boton.disabled = true;

    fetch('/Radar/actualizar/')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
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

// --- LÓGICA DEL MENÚ LATERAL (Buscador y Orden) ---
const listaDiv = document.getElementById('lista-radares');
const buscadorInput = document.getElementById('buscador-radares');

// 1. Ordenar los datos alfabéticamente
let featuresOrdenadas = datosRadares.features.sort((a, b) => {
    return a.properties.nombre.localeCompare(b.properties.nombre);
});

// 2. Función para dibujar la lista
function renderizarLista(features) {
    listaDiv.innerHTML = ''; // Vaciamos la lista actual

    features.forEach(feature => {
        const radarId = feature.id;
        const nombre = feature.properties.nombre;
        const velocidad = feature.properties.velocidad;

        const div = document.createElement('div');
        div.className = 'radar-item';

        div.innerHTML = `
            <strong>${nombre}</strong><br>
            <small>Velocidad: ${velocidad} km/h</small>
            <div class="radar-acciones">
                <button class="btn-editar">Editar</button>
                <button class="btn-borrar">Borrar</button>
            </div>
        `;

        const btnEditar = div.querySelector('.btn-editar');
        const btnBorrar = div.querySelector('.btn-borrar');

        btnEditar.onclick = function(evento) {
            evento.stopPropagation();
            editarRadar(radarId, nombre, velocidad);
        };

        btnBorrar.onclick = function(evento) {
            evento.stopPropagation();
            borrarRadar(radarId);
        };

        div.onclick = function() {
            const lat = feature.geometry.coordinates[1];
            const lng = feature.geometry.coordinates[0];
            map.flyTo([lat, lng], 16);
        };

        listaDiv.appendChild(div);
    });
}

// 3. Pintamos la lista completa al cargar la página
renderizarLista(featuresOrdenadas);

// 4. Lógica del buscador (Se ejecuta cada vez que tecleas)
if (buscadorInput) {
    buscadorInput.addEventListener('input', function(evento) {
        const textoBusqueda = evento.target.value.toLowerCase();

        const featuresFiltradas = featuresOrdenadas.filter(feature => {
            const nombreRadar = feature.properties.nombre.toLowerCase();
            return nombreRadar.includes(textoBusqueda);
        });

        renderizarLista(featuresFiltradas);
    });
}

// --- FUNCIONES DE LOS BOTONES DE ACCIÓN ---
function editarRadar(id, nombreActual, velocidadActual) {
    let nuevoNombre = prompt("Introduce el nuevo nombre para este radar:", nombreActual);
    if (nuevoNombre === null) return;

    let nuevaVelocidad = prompt("Introduce el límite de velocidad (ej: 120):", velocidadActual);
    if (nuevaVelocidad === null) return;

    if (nuevoNombre !== nombreActual || nuevaVelocidad !== velocidadActual) {
        fetch('/Radar/editar/' + id + '/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre: nuevoNombre,
                velocidad: nuevaVelocidad
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'ok') {
                alert("Radar actualizado correctamente.");
                location.reload();
            } else {
                alert("Error al actualizar: " + data.mensaje);
            }
        });
    }
}

function borrarRadar(id) {
    if (confirm("Vas a borrar este radar permanentemente. ¿Continuar?")) {
        fetch('/Radar/borrar/' + id + '/', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'ok') {
                alert("Radar borrado correctamente.");
                location.reload();
            } else {
                alert("Error al borrar: " + data.mensaje);
            }
        });
    }
}