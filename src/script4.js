import { interaction } from "./week14";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const scene = new THREE.Scene();
const canvas = document.querySelector(".webgl");

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
camera.position.set(0, 2, 5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.maxPolarAngle = Math.PI / 2;

scene.background = new THREE.Color(0x87ceeb);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffe4b5, 5);
sunLight.position.set(10, 100, -50);
scene.add(sunLight);

const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load(
  "model/80-street/rua para blender/render.png"
);
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 50);

const roadGeometry = new THREE.PlaneGeometry(10, 5000);
const roadMaterial = new THREE.MeshBasicMaterial({ map: roadTexture });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
scene.add(road);

const roofGeometry = new THREE.PlaneGeometry(10, 5000);
const roofMaterial = new THREE.MeshBasicMaterial({
  color: 0x0d0d0d,
  side: THREE.DoubleSide,
});
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.rotation.x = -Math.PI / 2;
roof.position.y = 10;
scene.add(roof);

const wallGeometry = new THREE.PlaneGeometry(5000, 10);
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x0d0d0d });
// Left wall
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-5, 5, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(5, 5, 0);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

const carLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
carLoader.setDRACOLoader(dracoLoader);

let userCar;
let cars = [];

carLoader.load(
  "/model/car.gltf/",
  (gltf) => {
    userCar = gltf.scene;
    userCar.position.set(0, 0, -2450);
    userCar.scale.set(0.5, 0.5, 0.5);
    scene.add(userCar);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

const createRandomCar = () => {
  carLoader.load(
    "/model/car.gltf/",
    (gltf) => {
      const car = gltf.scene;
      car.position.set(Math.random() * 8 - 4, 0, camera.position.z + 1000);
      car.scale.set(0.5, 0.5, 0.5);

      car.rotation.y = Math.PI;

      cars.push({
        object: car,
        direction: 1,
      });
      scene.add(car);
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );
};

for (let i = 0; i < 5; i++) {
  createRandomCar();
}

setInterval(createRandomCar, 3000);

let isWalkingForward = false;
let isWalkingBackward = false;
let isWalkingRight = false;
let isWalkingLeft = false;

window.addEventListener("keydown", (event) => {
  if (event.key === "w") {
    isWalkingForward = true;
  }
  if (event.key === "s") {
    isWalkingBackward = true;
  }
  if (event.key === "d") {
    isWalkingRight = true;
  }
  if (event.key === "a") {
    isWalkingLeft = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "w") {
    isWalkingForward = false;
  }
  if (event.key === "s") {
    isWalkingBackward = false;
  }
  if (event.key === "d") {
    isWalkingRight = false;
  }
  if (event.key === "a") {
    isWalkingLeft = false;
  }
});

let rotationDirection = 0;

let gameOver = false;

interaction().then(() => {
  const animate = () => {
    if (gameOver) return;
    const moveSpeed = 0.5;

    if (userCar) {
      if (isWalkingForward && userCar.position.z < 2450) {
        userCar.position.z += moveSpeed;
      }
      if (isWalkingBackward && userCar.position.z > -2450) {
        userCar.position.z -= moveSpeed;
      }

      userCar.rotation.y = rotationDirection * (Math.PI / 60);

      if (isWalkingRight) {
        userCar.position.x -= 0.1;
        rotationDirection = -10;
      } else if (isWalkingLeft) {
        userCar.position.x += 0.1;
        rotationDirection = 10;
      } else {
        rotationDirection = 0;
      }

      userCar.position.x = Math.max(-4, Math.min(userCar.position.x, 4));

      camera.position.z = userCar.position.z - 5;
      camera.position.y = userCar.position.y + 2;

      camera.lookAt(scene.position);
    }

    cars.forEach((carData) => {
      const car = carData.object;
      car.position.z -= moveSpeed;

      if (car.position.z > 5) {
        scene.remove(car);
        cars = cars.filter((c) => c.object !== car);
      }

      if (Math.random() < 0.05) {
        const moveSide = Math.random() < 0.5 ? -0.1 : 0.1;
        car.position.x += moveSide;
        car.position.x = Math.max(-4, Math.min(car.position.x, 4));
      }
      const distanceX = Math.abs(userCar.position.x - car.position.x);
      const distanceZ = Math.abs(userCar.position.z - car.position.z);

      const collisionThresholdX = 0.5;
      const collisionThresholdZ = 3;

      if (distanceX < collisionThresholdX && distanceZ < collisionThresholdZ) {
        console.log("Game Over");
        gameOver = true;
        setTimeout(() => {
          window.alert("Game Over! Refresh the page to restart.");
          window.location.reload();
        }, 1500);
      }
    });

    // controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
});

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
