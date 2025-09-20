const map = L.map('map').setView([51.505, -0.09], 13);
const latInput = document.getElementById('lat-input');
const lonInput = document.getElementById('lon-input');
const gotoButton = document.getElementById('goto-button');
const fsNameSpan = document.getElementById('fs-name');
const editFsSpan = document.getElementById('edit-fs');
const pasteInput = document.getElementById('paste-input');
const hhIdInput = document.getElementById('hh-id-input');
const hhIdInfo = document.getElementById('hh-id-info');
const agriLandInput = document.getElementById('agri-land-input');
const insuredLandInput = document.getElementById('insured-land-input');
const tallyFormContainer = document.getElementById('tally-form-container');

let hhData = new Map();

// Fetch and parse CSV
fetch('crigps.csv')
    .then(response => response.text())
    .then(csvText => {
        const rows = csvText.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        const hhIdIndex = headers.indexOf('HH ID');
        const nameIndex = headers.indexOf('Name');
        const shgIndex = headers.indexOf('SHG');
        const acIndex = headers.indexOf('AC');
        const upazilaIndex = headers.indexOf('Upazila');

        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(',');
            const hhId = columns[hhIdIndex]?.trim().toUpperCase();
            if (hhId) {
                hhData.set(hhId, {
                    name: columns[nameIndex]?.trim(),
                    shg: columns[shgIndex]?.trim(),
                    ac: columns[acIndex]?.trim(),
                    upazila: columns[upazilaIndex]?.trim(),
                });
            }
        }
    });

// Define Tile Layers
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

const hybridLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
});


// Add default layer to map
satelliteLayer.addTo(map);
hybridLayer.addTo(map);

// Layer control
const baseMaps = {
    "Street": streetLayer,
    "Satellite": satelliteLayer,
    "Hybrid": hybridLayer
};

L.control.layers(baseMaps).addTo(map);

let marker;

function updateMarker(latlng) {
    if (marker) {
        marker.setLatLng(latlng);
    } else {
        marker = L.marker(latlng, { draggable: true }).addTo(map);
        marker.on('dragend', function(event) {
            const position = marker.getLatLng();
            updateCoordDisplays(position.lat, position.lng);
        });
    }
    map.setView(latlng, map.getZoom() < 13 ? 13 : map.getZoom());
    updateCoordDisplays(latlng.lat, latlng.lng);
}

function updateCoordDisplays(lat, lng) {
    const fixedLat = lat.toFixed(6);
    const fixedLng = lng.toFixed(6);
    latInput.value = fixedLat;
    lonInput.value = fixedLng;
    checkAllFieldsValid();
}

function onLocationFound(e) {
    const radius = e.accuracy / 2;
    updateMarker(e.latlng);
    marker.bindPopup(`You are within ${radius} meters from this point`).openPopup();
}

function onLocationError(e) {
    alert(e.message);
    // Set a default view if location is not found
    const defaultLatLng = L.latLng(23.8103, 90.4125); // Default to Dhaka
    updateMarker(defaultLatLng);
    marker.bindPopup('Default location. Drag to adjust.').openPopup();
}

function onGoToButtonClick() {
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lonInput.value);

    if (isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid coordinates.');
        return;
    }

    updateMarker(L.latLng(lat, lng));
}

function getAndSaveFSName() {
    const name = prompt('Responsible FS (Name):');
    if (name) {
        localStorage.setItem('responsibleFS', name);
        fsNameSpan.textContent = name;
    }
}

function handleInput(event) {
    const pastedText = event.target.value;
    const coords = pastedText.split(',');
    if (coords.length === 2) {
        const lat = parseFloat(coords[0].trim());
        const lng = parseFloat(coords[1].trim());

        if (!isNaN(lat) && !isNaN(lng)) {
            latInput.value = lat.toFixed(6);
            lonInput.value = lng.toFixed(6);
            updateMarker(L.latLng(lat, lng));
        }
    }
}

function validateHH_ID() {
    const hh_id = hhIdInput.value.toUpperCase();
    hhIdInput.value = hh_id;
    if (hhData.has(hh_id)) {
        hhIdInput.style.border = '2px solid green';
        const data = hhData.get(hh_id);
        hhIdInfo.innerHTML = `
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>SHG:</strong> ${data.shg}</p>
            <p><strong>AC:</strong> ${data.ac}</p>
            <p><strong>Upazila:</strong> ${data.upazila}</p>
        `;
    } else {
        hhIdInput.style.border = '2px solid red';
        hhIdInfo.innerHTML = '';
    }
    checkAllFieldsValid();
}

function validateNumberInput(event) {
    const input = event.target;
    const value = parseInt(input.value, 10);
    if (isNaN(value) || value < 1 || value > 10) {
        input.style.border = '2px solid red';
    } else {
        input.style.border = '2px solid green';
    }
    checkAllFieldsValid();
}

function checkAllFieldsValid() {
    const hhIdValid = hhIdInput.style.borderColor === 'green';
    const agriLandValid = agriLandInput.style.borderColor === 'green';
    const insuredLandValid = insuredLandInput.style.borderColor === 'green';
    const latValid = latInput.value !== '';
    const lonValid = lonInput.value !== '';

    if (hhIdValid && agriLandValid && insuredLandValid && latValid && lonValid) {
        const hhId = hhIdInput.value;
        const agriLand = agriLandInput.value;
        const insuredLand = insuredLandInput.value;
        const latitude = latInput.value;
        const longitude = lonInput.value;
        const reportedBy = localStorage.getItem('responsibleFS');

        const baseUrl = 'https://tally.so/r/waV4Wy';
        const params = new URLSearchParams({
            'HH ID': hhId,
            'Agricultural Land': agriLand,
            'Insured land': insuredLand,
            'GPS Latitude': latitude,
            'GPS Longitude': longitude,
            'Reported by': reportedBy
        });

        const prefilledUrl = `${baseUrl}?${params.toString()}`;

        tallyFormContainer.style.display = 'block';
        tallyFormContainer.innerHTML = `<iframe src="${prefilledUrl}"></iframe>`;
    } else {
        tallyFormContainer.style.display = 'none';
        tallyFormContainer.innerHTML = '';
    }
}

gotoButton.addEventListener('click', onGoToButtonClick);
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);
pasteInput.addEventListener('input', handleInput);
hhIdInput.addEventListener('input', validateHH_ID);
agriLandInput.addEventListener('input', validateNumberInput);
insuredLandInput.addEventListener('input', validateNumberInput);

map.locate({setView: true, maxZoom: 16});

map.on('click', function(e) {
    updateMarker(e.latlng);
});

window.addEventListener('load', () => {
    hhIdInput.style.border = '2px solid red';
    agriLandInput.style.border = '2px solid red';
    insuredLandInput.style.border = '2px solid red';
    const responsibleFS = localStorage.getItem('responsibleFS');
    if (responsibleFS) {
        fsNameSpan.textContent = responsibleFS;
    } else {
        getAndSaveFSName();
    }
});

editFsSpan.addEventListener('click', getAndSaveFSName);
