import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import Stats from 'stats.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
const clock = new THREE.Clock()

const canvas = document.querySelector('#c')
const renderer = new THREE.WebGLRenderer({antialias:true, canvas})

// shadow settings
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

// camera settings
const fov = 40
const aspect = window.innerWidth / window.innerHeight
const near = 0.1
const far = 1000
const frustumSize = 20
let perspectiveCamera = new THREE.PerspectiveCamera(fov, aspect, near, far)
let orthographicCamera = new THREE.OrthographicCamera(
  - frustumSize * aspect / 2,
    frustumSize * aspect / 2,
    frustumSize / 2,
  - frustumSize / 2,
    near, far
)
let camera = perspectiveCamera

perspectiveCamera.position.set(0,30,-30)
perspectiveCamera.lookAt(0,0,0)
orthographicCamera.position.set(0,30,-30)
orthographicCamera.lookAt(0,0,0)

// control to move camera around
let orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.enabled = false
let flyControls = new FlyControls(camera, renderer.domElement)
setupControls(orbitControls, flyControls)
let controls = flyControls

function setupControls(o, f) {
  o.enableDamping = true
  o.dampingFactor = 0.1
  o.enablePan     = true

  f.movementSpeed = 20
  f.rollSpeed     = 1
  f.dragToLook    = true 
}

function resetControls() {
  const wasOrbit = controls === orbitControls

  orbitControls.dispose()
  flyControls.dispose()

  orbitControls = new OrbitControls(camera, renderer.domElement)
  flyControls   = new FlyControls  (camera, renderer.domElement)
  setupControls(orbitControls, flyControls)

  // reativa apenas o controle que estava ativo
  if (wasOrbit) {
    flyControls.enabled   = false
    controls = orbitControls
  } else {
    orbitControls.enabled = false
    controls = flyControls
  }
}

window.addEventListener('keydown', e => {
  let changed = false

  if (e.key === 'o' && camera !== orthographicCamera) {
    orthographicCamera.position.copy(perspectiveCamera.position)
    orthographicCamera.quaternion.copy(perspectiveCamera.quaternion)
    camera = orthographicCamera
    changed = true
  }
  else if (e.key === 'p' && camera !== perspectiveCamera) {
    perspectiveCamera.position.copy(orthographicCamera.position)
    perspectiveCamera.quaternion.copy(orthographicCamera.quaternion)
    camera = perspectiveCamera
    changed = true
  }
  else if (e.key === 'n') {
    // só alterna o tipo de controle sem trocar câmera
    const wasOrbit = controls === orbitControls
    controls = wasOrbit ? flyControls : orbitControls
    orbitControls.enabled = !wasOrbit
    flyControls.enabled   =  wasOrbit
    return
  }
  else return

  if (changed) resetControls() 
})

const scene = new THREE.Scene()
const textureLoader = new THREE.TextureLoader()

// add general lightning
const ambientLightColor = 0xFFFFFF
const ambientLightIntensity = .1
const ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity)
scene.add(ambientLight)

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// array of objects to get rotated in the animation
const objects = []

const sphereRadius = 1
const sphereWSegments = 32
const sphereHSegments = 32
const sphereGeometry = new THREE.SphereGeometry(sphereRadius, sphereWSegments, sphereHSegments)

// sun and solar system
const solarSystem = new THREE.Object3D()
scene.add(solarSystem)
objects.push(solarSystem)
const sunTexture = textureLoader.load("textures/sun/sun_map.jpg")
sunTexture.colorSpace = THREE.SRGBColorSpace
const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture,
})
const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial)
sunMesh.scale.set(5,5,5)
solarSystem.add(sunMesh)
objects.push(sunMesh)

// point light of the sun
const sunLight = new THREE.PointLight(0xFFFFFF, 100.0, 0, 1)
sunLight.castShadow = true
sunMesh.add(sunLight)

const earthOrbit = new THREE.Object3D()
earthOrbit.position.z = 12.5
solarSystem.add(earthOrbit)
objects.push(earthOrbit)

const flatEarthOrbit = new THREE.Object3D()
flatEarthOrbit.position.z = -12.5
solarSystem.add(flatEarthOrbit)
objects.push(flatEarthOrbit)

const flatEarthGroup = new THREE.Object3D()
flatEarthOrbit.add(flatEarthGroup)
objects.push(flatEarthGroup)

const flatEarthGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 64, 1, false)
const flatEarthTexture = textureLoader.load('textures/earth/flat_earth_map.jpg')
flatEarthTexture.colorSpace = THREE.SRGBColorSpace

const topMat = new THREE.MeshPhongMaterial({ map: flatEarthTexture })
const sideMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF }) // borda branca (gelo)
const bottomMat = new THREE.MeshPhongMaterial({ color: 0x392620 }) // base marrom (terra)

const flatEarthMesh = new THREE.Mesh(flatEarthGeometry, [sideMat, topMat, bottomMat])
flatEarthGroup.add(flatEarthMesh)
objects.push(flatEarthMesh)

const domeGeometry = new THREE.SphereGeometry(1.05, 64, 32, 0, Math.PI * 2, 0, Math.PI/2);
const domeMaterial = new THREE.MeshPhongMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide,
})
const domeMesh = new THREE.Mesh(domeGeometry, domeMaterial)
flatEarthGroup.add(domeMesh)
objects.push(domeMesh)
flatEarthGroup.rotation.z = THREE.MathUtils.degToRad(15)

const earthTexture = textureLoader.load("textures/earth/earth_map.jpg")
earthTexture.colorSpace = THREE.SRGBColorSpace
const earthSpecularTexture = textureLoader.load("textures/earth/earth_spec.jpg")
earthSpecularTexture.colorSpace = THREE.SRGBColorSpace
const earthBumpTexture = textureLoader.load("textures/earth/earth_bump.jpg")
const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  specularMap: earthSpecularTexture,
  bumpMap: earthBumpTexture,
  specular: new THREE.Color('grey'),
  shininess: 10,
  bumpScale: .1
});
const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial)
earthMesh.castShadow = true
earthMesh.receiveShadow = true
earthOrbit.add(earthMesh)
objects.push(earthMesh)

const moonOrbit = new THREE.Object3D()
moonOrbit.position.z = 2.5
earthOrbit.add(moonOrbit)
objects.push(moonOrbit)

const moonTexture = textureLoader.load("textures/moon/moon_map.jpg")
moonTexture.colorSpace = THREE.SRGBColorSpace
const moonBumpTexture = textureLoader.load("textures/moon/moon_bump.jpg")

const moonMaterial = new THREE.MeshPhongMaterial({
  map: moonTexture,
  bumpMap: moonBumpTexture,
  specular: new THREE.Color('grey'),
  bumpScale: .1,
  shininess: 5,
})
const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial)
moonMesh.receiveShadow = true
moonMesh.castShadow = true
moonMesh.scale.set(.5, .5, .5)
moonOrbit.add(moonMesh)
objects.push(moonMesh)


const sunGrid = new THREE.GridHelper(30, 30, 0xffcc00, 0xffcc00)
const earthGrid = new THREE.GridHelper(10, 10, 0x00ccff, 0x00ccff)
const fearthGrid = new THREE.GridHelper(10, 10, 0x00ff00, 0x00ff00)
const moonGrid = new THREE.GridHelper(3, 3, 0xcccccc, 0xcccccc)

earthOrbit.add(earthGrid)
flatEarthOrbit.add(fearthGrid)
moonOrbit.add(moonGrid)
solarSystem.add(sunGrid)

sunGrid.visible = false
earthGrid.visible = false
fearthGrid.visible = false
moonGrid.visible = false

const gridVisibility = {
  sunGrid: false,
  earthGrid: false,
  fearthGrid: false,
  moonGrid: false 
}

const gui = new GUI()
const gridFolder = gui.addFolder('Orbit Grids')
gridFolder.add(gridVisibility, 'sunGrid').name('Sun Grid').onChange((value) => {
  sunGrid.visible = value;
})
gridFolder.add(gridVisibility, 'earthGrid').name('Earth Grid').onChange((value) => {
  earthGrid.visible = value;
})
gridFolder.add(gridVisibility, 'fearthGrid').name('Fearth Grid').onChange((value) => {
  fearthGrid.visible = value;
})
gridFolder.add(gridVisibility, 'moonGrid').name('Moon Grid').onChange((value) => {
  moonGrid.visible = value;
})
const lightFolder = gui.addFolder('Scene Lighting');
lightFolder.add(ambientLight, 'intensity', 0, 5, 0.01).name('Ambient Intensity')
const sunLightFolder = gui.addFolder('Sun Light')
sunLightFolder.add(sunLight, 'intensity', 0, 200, 1).name('Sun Intensity')

const stats = new Stats
stats.showPanel(0)
document.body.appendChild(stats.dom)

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()
  controls.update(delta)

  stats.begin()
  objects.forEach( ( obj ) => {
		obj.rotation.y += 0.001
	} );

  renderer.render(scene, camera)
  stats.end()
}
animate();