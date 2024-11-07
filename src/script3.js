import { interaction } from "./week14";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

const scene = new THREE.Scene();
const canvas = document.querySelector(".webgl");

const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
  "textures/envmap/px.png",
  "textures/envmap/nx.png",
  "textures/envmap/py.png",
  "textures/envmap/ny.png",
  "textures/envmap/pz.png",
  "textures/envmap/nz.png",
]);

scene.environment = environmentMap;
scene.background = environmentMap;

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const textureLoader = new THREE.TextureLoader();
const textTexture = textureLoader.load("/textures/matcaps/8.png");

const colorTexture = textureLoader.load("textures/3/color.jpg");
const dispTexture = textureLoader.load("textures/3/height.png");
const normalsTexture = textureLoader.load("textures/3/normal.jpg");
const aoTexture = textureLoader.load("textures/3/ao.jpg");
const roughnessTexture = textureLoader.load("textures/3/metallic.jpg");
const metallicTexture = textureLoader.load("textures/3/metallic.jpg");
const emissiveTexture = textureLoader.load("textures/3/metallic.jpg");

const material = new THREE.MeshStandardMaterial();
material.map = colorTexture;

material.displacementScale = 0.07;
material.displacementMap = dispTexture;
material.normalMap = normalsTexture;
material.aoMap = aoTexture;
material.aoMapIntensity = 0.5;
material.roughness = 0.1;
material.roughnessMap = roughnessTexture;
material.metalness = 1.0;
material.metalnessMap = metallicTexture;
material.emissiveMap = emissiveTexture;
material.emissiveIntensity = 1;

const cubeGeometry = new THREE.BoxGeometry(4, 4, 4, 512, 512, 512);
const cube = new THREE.Mesh(cubeGeometry, material);
cube.geometry.setAttribute(
  "uv2",
  new THREE.BufferAttribute(cube.geometry.attributes.uv.array, 2)
);
cube.position.set(10, 5, 0);
scene.add(cube);

const fontLoader = new FontLoader();
fontLoader.load("/fonts/helvetiker_bold.typeface.json", (font) => {
  const textGeometry = new TextGeometry("Three js Developer", {
    font: font,
    size: 2,
    height: 1,
    curveSegments: 10,
  });
  textGeometry.center();
  const textmaterial = new THREE.MeshMatcapMaterial({ matcap: textTexture });
  const text = new THREE.Mesh(textGeometry, textmaterial);
  scene.add(text);
});

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.z = 15;
scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(-5, 15, -5);
scene.add(directionalLight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas,
});
renderer.setSize(sizes.width, sizes.height);

const clock = new THREE.Clock();

const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load("/audio/AUD-20240506-WA0054.mp3", (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(false);
  sound.setVolume(0.5);
});

let audioContext;
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function startAudioContext() {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

document.addEventListener(
  "click",
  () => {
    initAudioContext();
    startAudioContext();
  },
  { once: true }
);

interaction().then(() => {
  const gui = new dat.GUI();
  gui.add(material, "displacementScale", 0, 2, 0.01).name("displacementScale");
  gui.add(material, "aoMapIntensity", 0, 5, 0.1).name("aoIntensity");
  gui.add(material, "roughness", 0, 2, 0.01).name("roughness");
  gui.add(material, "metalness", 0, 2, 0.01).name("Metalness");
  gui.add(material, "emissiveIntensity", 0, 1, 0.01).name("emissiveIntensity");
  gui.add(ambientLight, "intensity", 0, 10, 0.1);
  sound.play();
  const animate = () => {
    const elapsedTime = clock.getElapsedTime();

    cube.rotation.x = 0.15 * elapsedTime;
    cube.rotation.y = 0.1 * elapsedTime;

    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  };

  animate();
});
