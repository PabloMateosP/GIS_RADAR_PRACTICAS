// Inicializar el mapa
var map = L.map('map').setView([40.416, -3.703], 6);

// Configuramos los controles de Geoman a nuestro gusto
map.pm.addControls({
    position: 'topleft',
    drawMarker: true,
    drawCircleMarker: false,
    drawPolyline: false,
    drawRectangle: false,
    drawPolygon: false,
    drawCircle: false,
    drawText: false,
    cutPolygon: false,
    rotateMode: false,
    editMode: true,
    dragMode: true,
    removalMode: true
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// A. Creamos un grupo de clusters
var markers = L.markerClusterGroup();

// B. Definimos los iconos diferenciados
var iconoRadarFijo = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/75/75684.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

var iconoRadarMovil = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2838/2838724.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// C. Creamos la capa de puntos GeoJSON con Geoman integrado
var geoJsonLayer = L.geoJSON(datosRadares, {

    pointToLayer: function (feature, latlng) {
        // Leemos el tipo que viene de la base de datos
        var esMovil = feature.properties.tipo === 'MOVIL';

        // Asignamos el icono dependiendo del tipo
        var iconoElegido = esMovil ? iconoRadarMovil : iconoRadarFijo;

        return L.marker(latlng, {icon: iconoElegido});
    },

    onEachFeature: function (feature, layer) {
        const id = feature.id;
        const nombre = feature.properties.nombre;
        const velocidad = feature.properties.velocidad;
        // Si por algún motivo el tipo viene vacío, asumimos que es FIJO
        const tipo = feature.properties.tipo || 'FIJO';

        // 1. Añadimos el popup del nombre y el botón de editar
        if (feature.properties && feature.properties.nombre) {

            // Cambiamos el título según el tipo
            let tituloPopup = (tipo === 'MOVIL') ? "ZONA DE RADAR MOVIL" : "RADAR FIJO";

            var contenido = `
                <div style='text-align:center'>
                    <b>${tituloPopup}</b><br>
                    ${nombre}<br>
                    Velocidad: ${velocidad} km/h<br><br>
                    <button onclick="editarRadar('${id}', '${nombre}', '${velocidad}')" 
                            style="cursor:pointer; padding:5px 10px; border:1px solid #ccc; background:#fff; border-radius:4px;">
                        Editar Datos
                    </button>
                </div>
            `;
            layer.bindPopup(contenido);
        }

        // 2. Evento de Geoman: BORRAR (pm:remove)
        layer.on('pm:remove', function(evento) {
            evento.target.addTo(map);
            borrarRadar(id);
        });

        // 3. Evento de Geoman: MOVER/ARRASTRAR (pm:dragend)
        layer.on('pm:dragend', function(evento) {
            const nuevaLat = evento.target.getLatLng().lat;
            const nuevaLng = evento.target.getLatLng().lng;

            if (confirm("¿Quieres guardar la nueva ubicación de este radar?")) {
                fetch('/Radar/mover/' + id + '/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        lat: nuevaLat,
                        lng: nuevaLng
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if(data.status === 'ok') {
                        alert("Ubicación actualizada correctamente en la base de datos.");
                    } else {
                        alert("Error al mover: " + data.mensaje);
                        location.reload();
                    }
                });
            } else {
                location.reload();
            }
        });
    }
});

// D. Metemos los puntos dentro de la bolsa de clusters y la añadimos al mapa
markers.addLayer(geoJsonLayer);
map.addLayer(markers);

// --- GEOLOCALIZACIÓN DEL USUARIO ---
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

// --- ACTUALIZACIÓN MASIVA CON LA DGT ---
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

// --- EVENTO DE CREACIÓN DE GEOMAN ---
map.on('pm:create', function(evento) {
    const nuevoMarcador = evento.layer;
    const lat = nuevoMarcador.getLatLng().lat;
    const lng = nuevoMarcador.getLatLng().lng;

    let nombre = prompt("Introduce el nombre para esta zona de radar móvil:");
    if (nombre === null || nombre.trim() === "") {
        map.removeLayer(nuevoMarcador);
        return;
    }

    let velocidad = prompt("Introduce el límite de velocidad (ej: 90):");
    if (velocidad === null) {
        map.removeLayer(nuevoMarcador);
        return;
    }

    fetch('/Radar/crear_movil/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nombre: nombre,
            velocidad: velocidad,
            lat: lat,
            lng: lng
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'ok') {
            alert("Radar móvil registrado correctamente.");
            location.reload();
        } else {
            alert("Error al guardar: " + data.mensaje);
            map.removeLayer(nuevoMarcador);
        }
    });
});

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