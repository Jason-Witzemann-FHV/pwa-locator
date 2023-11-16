import cameraImage from '../svg/camera.svg'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import marker from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const COORD_FORMATTER = Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
  minimumIntegerDigits: 3,
  style: 'unit',
  unit: 'degree',
})
const DIST_FORMATTER = Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: 'unit',
  unit: 'meter',
})
const DEG_FORMATTER = Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: 'unit',
  unit: 'degree',
})

const LOCATION_LEFT_ID = 'location-left'
const LOCATION_MIDDLE_ID = 'location-middle'
const CAMERA_INPUT_ID = 'camera'

//map state
var map
var ranger

// needed for location
let geolocation
let watchId
let currentPosition
let cameraButton

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
}

function configureMap(latLngArray) {
  map = L.map('map').setView(latLngArray, 17)
  if (isTouchDevice()) {
    map.removeControl(map.zoomControl)
  }
  map.attributionControl.setPosition('bottomleft')

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  ranger = L.circle(latLngArray, { radius: 20.0 }).addTo(map)

  const markerIcon = new L.Icon.Default({
    iconUrl: marker,
    iconRetinaUrl: marker2x,
    shadowUrl: markerShadow,
  })

  Object.keys(localStorage).forEach((key) => {
    const value = localStorage.getItem(key)
    const fullCoord = key.split(',')
    const lng = fullCoord[0]
    const lat = fullCoord[1]

    L.marker([lat, lng], { icon: markerIcon }).addTo(map).bindPopup(`
      <div class="popup-container">
                    <img src='${value}' width='150px' alt="Marker Image">
                </div>`)
  })
}

function updatePosition(position) {
  const locatorLeftDiv = document.getElementById(LOCATION_LEFT_ID)
  const locatorMiddleDiv = document.getElementById(LOCATION_MIDDLE_ID)

  const coords = position.coords
  cameraButton.disabled = false
  currentPosition = position

  console.debug(`got new coordinates: ${coords}`)
  locatorLeftDiv.innerHTML = `
        <dl>
            <dt>LAT</dt>
            <dd>${COORD_FORMATTER.format(coords.latitude)}</dd>
            <dt>LONG</dt>
            <dd>${COORD_FORMATTER.format(coords.longitude)}</dd>
            <dt>ALT</dt>
            <dd>${coords.altitude ? DIST_FORMATTER.format(coords.altitude) : '-'}</dd>
        </dl>`
  locatorMiddleDiv.innerHTML = `
        <dl>
            <dt>ACC</dt>
            <dd>${DIST_FORMATTER.format(coords.accuracy)}</dd>
            <dt>HEAD</dt>
            <dd>${coords.heading ? DEG_FORMATTER.format(coords.heading) : '-'}</dd>
            <dt>SPD</dt>
            <dd>${coords.speed ? DIST_FORMATTER.format(coords.speed) : '-'}</dd>
        </dl>`
  var ll = [coords.latitude, coords.longitude]

  map.setView(ll)

  ranger.setLatLng(ll)
  ranger.setRadius(coords.accuracy)
}

/* setup component */
window.onload = () => {
  const queryParams = new URLSearchParams(window.location.search)
  cameraButton = document.getElementById(CAMERA_INPUT_ID)

  //setup UI
  cameraButton.src = cameraImage
  cameraButton.addEventListener('click', openCamera)

  //init leaflet
  configureMap([47.406653, 9.744844])

  //init footer
  updatePosition({
    coords: { latitude: 47.406653, longitude: 9.744844, altitude: 440, accuracy: 40, heading: 45, speed: 1.8 },
  })

  // setup service worker
  const swDisbaled = queryParams.get('service-worker') === 'disabled'
  console.debug(`query param 'service-worker': ${queryParams.get('service-worker')}, disabled: ${swDisbaled}`)
  if (false && !swDisbaled && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(new URL('serviceworker.js', import.meta.url), { type: 'module' })
      .then(() => {
        console.log('Service worker registered!')
      })
      .catch((error) => {
        console.warn('Error registering service worker:')
        console.warn(error)
      })
  }

  if ('geolocation' in navigator) {
    let options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 27000,
    }

    geolocation = navigator.geolocation
    watchId = geolocation.watchPosition(
      updatePosition,
      (error) => {
        console.warn(`Error getting location: ${error.code} - ${error.message}`)
      },
      options
    )
  }
}

window.onbeforeunload = () => {
  if (watchId) {
    geolocation.clearWatch(watchId)
  }
}

function openCamera() {
  location.href = `/camera.html?lng=${encodeURIComponent(currentPosition.coords.longitude)}&lat=${encodeURIComponent(
    currentPosition.coords.latitude
  )}`
}
