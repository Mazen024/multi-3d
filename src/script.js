import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const solarSystem = new THREE.Object3D();
const scene = new THREE.Scene();
const canvas = document.querySelector(".webgl");

import px from "../static/360_Degree_Images/px.png";
import nx from "../static/360_Degree_Images/nx.png";
import py from "../static/360_Degree_Images/py.png";
import ny from "../static/360_Degree_Images/ny.png";
import pz from "../static/360_Degree_Images/pz.png";
import nz from "../static/360_Degree_Images/nz.png";

const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([px, nx, py, ny, pz, nz]);
scene.environment = environmentMap;
scene.background = environmentMap;

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(3, 7, 20);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(
  "textures/earthdunya/textures/Image_3.png"
);

const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
const earthSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(earthSphere);

const sunLoader = new GLTFLoader().setPath("../textures/Sun/");
let sun;
sunLoader.load(
  "scene.gltf",
  function (gltf) {
    sun = gltf.scene;
    if (sun) {
      sun.position.set(0, 0, 0);
      sun.scale.set(0.1, 0.1, 0.1);
      solarSystem.add(sun);
    }
  },
  undefined,
  function (error) {
    console.log(error);
  }
);
scene.add(solarSystem);

const marsTexture = textureLoader.load("textures/mars/textures/8k_mars.jpg");
const marsSphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const marsSphereMaterial = new THREE.MeshStandardMaterial({ map: marsTexture });
const marsSphere = new THREE.Mesh(marsSphereGeometry, marsSphereMaterial);
scene.add(marsSphere);

function OrbitPath(radius) {
  const orbitPath = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.05, 16, 100, Math.PI * 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  orbitPath.rotation.x = Math.PI / 2;
  scene.add(orbitPath);
}
OrbitPath(6);
OrbitPath(10);
OrbitPath(14);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight, 10);

function createRectAreaLight(x, y, z) {
  const rectLight = new THREE.RectAreaLight(0xffcc66, 2, 4, 6);
  rectLight.position.set(x, y, z);
  rectLight.lookAt(0, 0, 0);
  scene.add(rectLight);
  const rectLightHelper = new RectAreaLightHelper(rectLight);
}

createRectAreaLight(4.5, 0, 0);
createRectAreaLight(-4.5, 0, 0);
createRectAreaLight(0, 4.5, 0);
createRectAreaLight(0, -4.5, 0);
createRectAreaLight(0, 0, 4.5);
createRectAreaLight(0, 0, -4.5);

const radius = 14;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let zoomingToSun = false;
let zoomedIn = false;

const targetPosition = new THREE.Vector3(3, 3, 3);
const defaultPosition = new THREE.Vector3(3, 7, 20);
const sunPosition = new THREE.Vector3(0, 0, 0);

function toggleZoom() {
  zoomingToSun = true;
  zoomedIn = !zoomedIn;
}

window.addEventListener("click", (event) => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(sun, true);

  if (intersects.length > 0) {
    toggleZoom();
  }
});

const animate = () => {
  const elapsedTime = new Date().getTime();

  earthSphere.rotation.y = elapsedTime * 0.0005;
  earthSphere.position.x = Math.cos(elapsedTime / 1000) * radius;
  earthSphere.position.z = Math.sin(elapsedTime / 1000) * radius;

  marsSphere.rotation.y = elapsedTime * 0.0005;
  marsSphere.position.x = Math.cos(elapsedTime / 1000) * 6;
  marsSphere.position.z = Math.sin(elapsedTime / 1000) * 6;

  if (zoomingToSun) {
    const target = zoomedIn ? targetPosition : defaultPosition;
    camera.position.lerp(target, 0.05);
    camera.lookAt(sunPosition);
    controls.target.lerp(sunPosition, 0.05);
    controls.update();

    if (camera.position.distanceTo(target) < 0.1) {
      zoomingToSun = false;
    }
  } else {
    if (sun) {
      sun.rotation.y = elapsedTime * -0.001;
    }
    camera.position.x = Math.sin(elapsedTime / 1000) * 6;
    camera.position.z = Math.cos(elapsedTime / 1000) * 20;
    camera.lookAt(scene.position);
    controls.update();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
