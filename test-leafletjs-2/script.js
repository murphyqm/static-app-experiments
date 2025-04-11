const sidebar = document.getElementById('controls');
document.getElementById('toggleSidebar').addEventListener('click', function() {
const controlsPanel = document.getElementById('controls');

// Toggle the 'visible' class to show/hide the panel
controlsPanel.classList.toggle('visible');
});

const map = L.map('map').setView([40.5, -100.5], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const layers = {
    counties: L.layerGroup().addTo(map),
    schools: L.layerGroup(),
    clinics: L.layerGroup()
};

let data = {
    counties: [],
    schools: [],
    clinics: []
};

async function loadData() {
    const [countiesRes, schoolsRes, clinicsRes] = await Promise.all([
    fetch('data/counties.geojson').then(res => res.json()),
    fetch('data/schools.geojson').then(res => res.json()),
    fetch('data/clinics.geojson').then(res => res.json())
    ]);

    data.counties = countiesRes.features;
    data.schools = schoolsRes.features;
    data.clinics = clinicsRes.features;

    populateDropdown();
    updateMap();
}

function populateDropdown() {
    const regionFilter = document.getElementById('regionFilter');
    const locationIDs = new Set([
    ...data.counties.map(f => f.properties.location_id),
    ...data.schools.map(f => f.properties.location_id),
    ...data.clinics.map(f => f.properties.location_id)
    ]);

    [...locationIDs].sort().forEach(id => {
    const opt = document.createElement('option');
    opt.value = opt.text = id;
    regionFilter.add(opt);
    });

    regionFilter.addEventListener('change', updateMap);
    document.querySelectorAll('input[name="layerType"]').forEach(radio => {
    radio.addEventListener('change', updateMap);
    });
}

function updateMap() {
const selectedLayer = document.querySelector('input[name="layerType"]:checked').value;
const selectedRegion = document.getElementById('regionFilter').value;

// Clear all layers
Object.values(layers).forEach(layer => {
    layer.clearLayers();
    map.removeLayer(layer);
});

const showLayer = (type, color, nameField) => {
    const features = selectedRegion
    ? data[type].filter(f => f.properties.location_id === selectedRegion)
    : data[type];

    let layer;
    if (type === 'counties') {
    layer = L.geoJSON(features, {
        style: { color: color, weight: 2, fillOpacity: 0.3 },
        onEachFeature: (f, l) => l.bindPopup(f.properties.name)
    });
    } else {
    layer = L.geoJSON(features, {
        pointToLayer: (f, latlng) => L.circleMarker(latlng, {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 1,
        fillOpacity: 0.9
        }),
        onEachFeature: (f, l) => l.bindPopup(f.properties[nameField])
    });
    }

    layer.addTo(layers[type]);
    layers[type].addTo(map);
};

if (selectedLayer === 'all') {
    showLayer('counties', 'blue');
    showLayer('schools', 'orange', 'school_name');
    showLayer('clinics', 'green', 'clinic_name');
} else {
    const color = selectedLayer === 'counties' ? 'blue' :
                selectedLayer === 'schools' ? 'orange' : 'green';
    const nameField = selectedLayer === 'schools' ? 'school_name' :
                    selectedLayer === 'clinics' ? 'clinic_name' : 'name';

    showLayer(selectedLayer, color, nameField);
}
}


loadData();