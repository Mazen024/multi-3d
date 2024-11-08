import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const canvas = document.querySelector("canvas.introC");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.y = 5;
camera.position.z = 25;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor(0xffffff);

const textureLoader = new THREE.TextureLoader();
const snowTexture = textureLoader.load("/1.png");

const snowCount = 3000;
const snowGeometry = new THREE.BufferGeometry();
const snowMaterial = new THREE.PointsMaterial({
  alphaMap: snowTexture,
  size: 2,
  transparent: true,
  sizeAttenuation: true,
  depthTest: false,
});

const positions = new Float32Array(snowCount * 3);
const speeds = new Float32Array(snowCount);
for (let i = 0; i < snowCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 100;
  positions[i * 3 + 1] = Math.random() * 100;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  speeds[i] = 0.5 + Math.random();
}
snowGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const snowflakes = new THREE.Points(snowGeometry, snowMaterial);
scene.add(snowflakes);

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
loader.setDRACOLoader(dracoLoader);

const roadRadius = 8;
const roadWidth = 0.5;
const roadGeometry = new THREE.RingGeometry(
  roadRadius - roadWidth,
  roadRadius + roadWidth,
  64
);
const roadMaterial = new THREE.MeshBasicMaterial({
  color: 0x333333,
  side: THREE.DoubleSide,
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = Math.PI / 2;
scene.add(road);

let mouse = {};
const checkpoints = [
  { position: new THREE.Vector3(9, 0, 0), index: 0, model: null },
  { position: new THREE.Vector3(-9, 0, 0), index: 1, model: null },
  { position: new THREE.Vector3(4, 0, -8), index: 2, model: null },
  { position: new THREE.Vector3(-4, 0, -8), index: 3, model: null },
];

loader.load("/models/sonic_checkpoint_post/scene.gltf", (gltf) => {
  checkpoints.forEach((checkpoint, index) => {
    const checkpointModel = gltf.scene.clone();
    checkpointModel.scale.set(0.2, 0.2, 0.2);
    checkpointModel.position.copy(checkpoint.position);

    setUserDataIdRecursively(checkpointModel, index + 1);

    scene.add(checkpointModel);
    checkpoint.model = checkpointModel;

    console.log(
      `Checkpoint ${index + 1} added at position:`,
      checkpoint.position
    );
  });
});

const raycaster = new THREE.Raycaster();

function setUserDataIdRecursively(object, id) {
  object.userData.id = id;
  object.children.forEach((child) => setUserDataIdRecursively(child, id));
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "module";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.body.appendChild(script);
  });
}

window.addEventListener("click", async (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(
    checkpoints.map((c) => c.model),
    true
  );

  if (intersects.length > 0) {
    const clickedCheckpoint = intersects[0].object;
    const clickedId = clickedCheckpoint.userData.id;

    const introScript = document.querySelector("script[src='/intro.js']");
    if (introScript) {
      if (typeof cleanupIntro === "function") {
        cleanupIntro();
      }
      introScript.remove();
    }

    if (clickedId) {
      let scriptToLoad = "";
      switch (clickedId) {
        case 1:
          scriptToLoad = "./script.js";
          break;
        case 2:
          scriptToLoad = "./script2.js";
          break;
        case 3:
          scriptToLoad = "./script3.js";
          break;
        case 4:
          scriptToLoad = "./script4.js";
          break;
      }
      if (scriptToLoad) {
        try {
          await loadScript(scriptToLoad);
          console.log(`Loaded ${scriptToLoad} successfully`);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
});

let Car;
let mixer;
let action;
loader.load(
  "/models/car/scene.gltf",
  (gltf) => {
    Car = gltf.scene;
    scene.add(Car);
    Car.scale.set(0.5, 0.5, 0.5);

    mixer = new THREE.AnimationMixer(Car);
    const carAnimation = gltf.animations[1];
    action = mixer.clipAction(carAnimation);
    action.loop = THREE.LoopRepeat;
    action.clampWhenFinished = false;
    action.play();
  },
  undefined,
  (error) => {
    console.error("An error occurred while loading the GLTF model:", error);
  }
);

let eye;
loader.load("/models/EyeModel2/scene.gltf", (gltf) => {
  eye = gltf.scene;
  scene.add(eye);
  eye.scale.set(0.5, 0.5, 0.5);
  eye.rotation.set(1, 0.5, 1);

  const setEyePosition = () => {
    const screenPosition = new THREE.Vector3(-0.9, 0.8, 0);
    screenPosition.unproject(camera);
    const direction = screenPosition.sub(camera.position).normalize();
    const distance = -camera.position.z / direction.z;
    const worldPosition = camera.position
      .clone()
      .add(direction.multiplyScalar(distance));
    eye.position.copy(worldPosition);
  };

  setEyePosition();
  window.addEventListener("resize", setEyePosition);
});

const cursor = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
  cursor.x = (e.clientX / sizes.width - 0.5) * 2;
  cursor.y = -(e.clientY / sizes.height - 0.5) * 2;

  if (eye) {
    eye.rotation.y = THREE.MathUtils.lerp(0.5, 1.8, (cursor.x + 1) / 2);
    eye.rotation.x = THREE.MathUtils.lerp(1, -0.5, (cursor.y + 1) / 2);
  }
});

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  if (sizes.width < 600) {
    Car.position.x = 0.5;
    CarResize = 0.5;
    Car.scale.set(0.3, 0.3, 0.3);
  } else {
    Car.position.x = 5;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

let isSnowing = true;

const clock = new THREE.Clock();
let angle = 0;

const tick = () => {
  const elapsedTime = clock.getDelta();

  if (mixer) mixer.update(elapsedTime);

  if (Car) {
    angle += elapsedTime;
    Car.position.x = Math.cos(angle) * roadRadius;
    Car.position.z = Math.sin(angle) * roadRadius;
    Car.rotation.y = -angle;
  }

  const snowPositions = snowflakes.geometry.attributes.position.array;
  for (let i = 0; i < snowCount; i++) {
    if (isSnowing) {
      snowPositions[i * 3 + 1] -= speeds[i] * 0.1;
      if (snowPositions[i * 3 + 1] < -50) {
        snowPositions[i * 3 + 1] = 50;
        snowPositions[i * 3] = (Math.random() - 0.5) * 100;
        snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      }
    }
  }
  snowflakes.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};
tick();

// let moveTowardsCamera = true;
// let moveAlongX = false;
// let rotationY = false;

// if (Car) {
//   // if (moveTowardsCamera) {
//   //   Car.position.z += 0.1;
//   //   if (Car.position.z >= camera.position.z + 5) {
//   //     moveTowardsCamera = false;
//   //     moveAlongX = true;
//   //     Car.position.set(CarResize * 8, 0, 0);
//   //   }
//   // } else if (moveAlongX) {
//   //   Car.rotation.y = -Math.PI / 2;
//   //   Car.position.x -= 0.1;
//   //   if (Car.position.x <= CarResize) {
//   //     moveAlongX = false;
//   //     rotationY = true;
//   //   }
//   // } else if (rotationY) {
//   //   if (Car.rotation.y >= 0) {
//   //     moveTowardsCamera = true;
//   //   } else Car.rotation.y += 0.1;
//   // }
//   if (Car.position.x >= -2) {
//     Car.position.x -= 0.1;
//   }
// }
/////////////////////////////////////////////////////
// function createLine(startX, startY, endX, endY) {
// const pathPoints = [
//   new THREE.Vector3(-2 + xOffset, 7 + yOffset, 0),
//   const geometry = new THREE.BufferGeometry();
//   const material = new THREE.LineBasicMaterial({ color: 0x000000 });

//   const start = new THREE.Vector3(startX, startY, 0);
//   const end = new THREE.Vector3(endX, endY, 0);
//   geometry.setFromPoints([start, end]);
//   const line = new THREE.Line(geometry, material);
//   return line;
// }

// const xOffset = 0;
// const yOffset = -4;
// const pentagonal1 = createLine(
//   -2 + xOffset,
//   7 + yOffset,
//   4 + xOffset,
//   7 + yOffset
// );
// const pentagonal2 = createLine(
//   -6 + xOffset,
//   5 + yOffset,
//   -2 + xOffset,
//   7 + yOffset
// );
// const pentagonal3 = createLine(
//   -6 + xOffset,
//   5 + yOffset,
//   -2 + xOffset,
//   3 + yOffset
// );
// const pentagonal4 = createLine(
//   4 + xOffset,
//   7 + yOffset,
//   4 + xOffset,
//   3 + yOffset
// );
// const pentagonal5 = createLine(
//   -2 + xOffset,
//   3 + yOffset,
//   4 + xOffset,
//   3 + yOffset
// );
// scene.add(pentagonal1);
// scene.add(pentagonal2);
// scene.add(pentagonal3);
// scene.add(pentagonal4);
// scene.add(pentagonal5);
//   new THREE.Vector3(4 + xOffset, 7 + yOffset, 0),
//   new THREE.Vector3(4 + xOffset, 4 + yOffset, 0),
//   new THREE.Vector3(-2 + xOffset, 3 + yOffset, 0),
//   new THREE.Vector3(-6 + xOffset, 5 + yOffset, 0),
//   new THREE.Vector3(-2 + xOffset, 7 + yOffset, 0),
// ];
// let currentSegmentIndex = 0;
// let t = 0;
// const carSpeed = 0.01;
//////////////////////////////////////
// function moveCarAlongPath() {
//   if (Car) {
//     const start = pathPoints[currentSegmentIndex];
//     const end = pathPoints[(currentSegmentIndex + 1) % pathPoints.length];

//     Car.position.lerpVectors(start, end, t);
//     Car.lookAt(end);
//     t += carSpeed;
//     if (t >= 1) {
//       t = 0;
//       currentSegmentIndex = (currentSegmentIndex + 1) % pathPoints.length;
//     }
//   }
// }
