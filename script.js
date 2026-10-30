
const ourCoords = {
    latitude: 48.94321,
    longitude: 24.73380
};

let watchId = null;      
let map = null;          
let destMarker = null;   
let destCoords = null;   
let track = null;        
let firstFix = true;     



document.addEventListener('DOMContentLoaded', getMyLocation);

function getMyLocation() {
    initMap();

    if (navigator.geolocation) {
        // successHandler, errorHandler, options
        navigator.geolocation.getCurrentPosition(displayLocation, displayError, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        });

        document.getElementById('watch').onclick = watchLocation;
        document.getElementById('clearWatch').onclick = clearWatch;
        document.getElementById('setDest').onclick = setDestination;
        document.getElementById('goDest').onclick = goToDestination;
    } else {
        alert('Oops, no geolocation support');
    }
}



function displayLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const div = document.getElementById('location');
    div.classList.remove('error');
    div.innerHTML = `You are at Latitude: ${latitude}, Longitude: ${longitude}`;
    div.innerHTML += ` (with ${position.coords.accuracy} meters accuracy)`;

    const km = computeDistance(position.coords, ourCoords);
    const distance = document.getElementById('distance');
    distance.innerHTML = `You are ${km.toFixed(3)} km from the College`;

    
    showPositionOnMap(position);
    updateDestinationInfo(position.coords);
}


function displayError(error) {
    const errorTypes = {
        0: 'Unknown error',
        1: 'Permission denied by user',
        2: 'Position is not available',
        3: 'Request timed out'
    };
    let errorMessage = errorTypes[error.code];
    if (error.code == 0 || error.code == 2) {
        errorMessage = errorMessage + ' ' + error.message;
    }
    const div = document.getElementById('location');
    div.classList.add('error');
    div.innerHTML = errorMessage;
}

function computeDistance(startCoords, destCoords) {
    const startLatRads = degreesToRadians(startCoords.latitude);
    const startLongRads = degreesToRadians(startCoords.longitude);
    const destLatRads = degreesToRadians(destCoords.latitude);
    const destLongRads = degreesToRadians(destCoords.longitude);
    const Radius = 6371; 

    // Math.min/max 
    const cosValue =
        Math.sin(startLatRads) * Math.sin(destLatRads) +
        Math.cos(startLatRads) * Math.cos(destLatRads) *
        Math.cos(startLongRads - destLongRads);

    return Math.acos(Math.min(1, Math.max(-1, cosValue))) * Radius;
}

function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}


function watchLocation() {
    if (watchId) return;
    watchId = navigator.geolocation.watchPosition(displayLocation, displayError, {
        enableHighAccuracy: true,
        maximumAge: 0
    });
}

function clearWatch() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

function initMap() {
    map = L.map('map').setView([ourCoords.latitude, ourCoords.longitude], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    track = L.polyline([], { color: '#1f6f55', weight: 3 }).addTo(map);

    L.circleMarker([ourCoords.latitude, ourCoords.longitude], {
        radius: 7, color: '#8d311f', fillOpacity: 0.8
    }).addTo(map).bindPopup('College');
}

function showPositionOnMap(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const time = new Date(position.timestamp).toLocaleTimeString('uk-UA');

    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(
        `You are here: ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>Time: ${time}`
    );

    track.addLatLng([lat, lng]);

    if (firstFix) {
        map.setView([lat, lng], 15); 
        marker.openPopup();
        firstFix = false;
    } else {
        map.panTo([lat, lng]);
    }
}

function setDestination() {
    const lat = parseFloat(document.getElementById('destLat').value.replace(',', '.'));
    const lng = parseFloat(document.getElementById('destLng').value.replace(',', '.'));
    const info = document.getElementById('destInfo');

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        info.classList.add('error');
        info.innerHTML = 'Введіть коректні координати: широта від -90 до 90, довгота від -180 до 180.';
        return;
    }

    info.classList.remove('error');
    destCoords = { latitude: lat, longitude: lng };

    if (destMarker) map.removeLayer(destMarker);
    destMarker = L.circleMarker([lat, lng], {
        radius: 9, color: '#b3402a', fillColor: '#b3402a', fillOpacity: 0.7
    }).addTo(map).bindPopup(`Destination: ${lat}, ${lng}`);

    info.innerHTML = `Пункт призначення: ${lat}, ${lng}`;
}


function goToDestination() {
    if (!destCoords) {
        setDestination();
        if (!destCoords) return;
    }
    map.flyTo([destCoords.latitude, destCoords.longitude], 15);
    destMarker.openPopup();
}


function updateDestinationInfo(coords) {
    if (!destCoords) return;
    const km = computeDistance(coords, destCoords);
    document.getElementById('destInfo').innerHTML =
        `Пункт призначення: ${destCoords.latitude}, ${destCoords.longitude} — ${km.toFixed(3)} km від вас`;
}
