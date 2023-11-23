import returnImage from '../svg/x-circle.svg'
import saveImage from '../svg/save.svg'
import pauseImage from '../svg/pause-btn.svg'
import playImage from '../svg/play-btn.svg'

const video = document.getElementById('video')
const photo = document.getElementById('photo')
const returnButton = document.getElementById('return')
const saveButton = document.getElementById('savePhoto')
const takePhotoButton = document.getElementById('takePhoto')

let stream
let photoImgBlob

window.onload = async () => {
  returnButton.src = returnImage
  saveButton.src = saveImage
  takePhotoButton.src = pauseImage

  returnButton.addEventListener('click', returnToHome)
  saveButton.addEventListener('click', savePhoto)

  await startVideoPlayback()
}

async function startVideoPlayback() {
  //start video playback
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Use back camera on phone
      },
      audio: false,
    })

    video.srcObject = stream
    video.play()

    takePhotoButton.removeEventListener('click', startVideoPlayback)
    takePhotoButton.addEventListener('click', takePhoto)
    takePhotoButton.disabled = false
    saveButton.disabled = true
    takePhotoButton.src = pauseImage
    photo.style.display = 'none'
    video.style.display = 'block'
  } catch (err) {
    console.error(`An error occurred: ${err}`)
  }
}

function getCoordParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const longitude = urlParams.get('lng')
  const latitude = urlParams.get('lat')

  return { longitude: longitude, latitude: latitude }
}

function returnToHome() {
  location.href = '/index.html'
}

function savePhoto() {
  const fileReader = new FileReader()
  fileReader.readAsDataURL(photoImgBlob)

  fileReader.onloadend = () => {
    const { longitude, latitude } = getCoordParams()
    localStorage.setItem(`${longitude},${latitude}`, fileReader.result)
  }
  returnToHome()
}

function takePhoto() {
  const width = video.offsetWidth
  const height = video.offsetHeight
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')
  context.drawImage(video, 0, 0, width, height)

  const { longitude, latitude } = getCoordParams()
  const photoText = `${longitude},${latitude}`
  const textFontSize = 18

  drawRect(context, textFontSize, photoText, width, height)
  drawText(context, textFontSize, photoText, width, height)

  canvas.convertToBlob({ type: 'image/jpeg' }).then((blob) => {
    photoImgBlob = blob
    const imageData = URL.createObjectURL(blob)
    photo.width = width
    photo.height = height
    photo.src = imageData
  })

  video.style.display = 'none'
  photo.style.display = 'block'

  takePhotoButton.src = playImage
  takePhotoButton.removeEventListener('click', takePhoto)
  takePhotoButton.addEventListener('click', startVideoPlayback)
  saveButton.disabled = false

  stream.getTracks().forEach((track) => track.stop())
}

function drawRect(context, textFont, photoText, width, height) {
  const textWidth = context.measureText(photoText).width
  context.fillStyle = 'rgba(255, 255, 255, 0.5)'

  const rectX = width / 2 - textWidth
  const rectY = height - textFont - 15
  const rectwidth = textWidth * 2
  const rectHeight = textFont + 15

  context.fillRect(rectX, rectY, rectwidth, rectHeight)
}

function drawText(context, textFont, photoText, width, height) {
  const textWidth = context.measureText(photoText).width

  context.font = `${textFont}px Arial`
  context.fillStyle = 'rgb(0,0,0)'

  const textX = width / 2 - textWidth + 10
  const textY = height - 10
  const maxTextWidth = textWidth * 2

  context.fillText(photoText, textX, textY, maxTextWidth)
}
