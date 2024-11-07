import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
import { interaction } from "./week14";

interaction().then(() => {
  const gui = new dat.GUI();

  const parameters = {
    switchTexture: () => {
      if (currentTexture === 1) {
        cubeMaterial.map = texture2;
        sphereMaterial.map = texture2;
        toursMaterial.map = texture2;
        currentTexture = 2;
      } else if (currentTexture === 2) {
        cubeMaterial.map = texture3;
        sphereMaterial.map = texture3;
        toursMaterial.map = texture3;
        currentTexture = 3;
      } else {
        cubeMaterial.map = texture1;
        sphereMaterial.map = texture1;
        toursMaterial.map = texture1;
        currentTexture = 1;
      }

      cubeMaterial.needsUpdate = true;
      sphereMaterial.needsUpdate = true;
      toursMaterial.needsUpdate = true;
    },
  };

  const textureLoader = new THREE.TextureLoader();
  const texture1 = textureLoader.load("textures/1/color.jpg/");
  const texture2 = textureLoader.load("textures/2/normal.jpg/");
  const texture3 = textureLoader.load("textures/3/color.jpg/");

  const scene = new THREE.Scene();
  const canvas = document.querySelector("canvas.webgl");

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  scene.background = new THREE.Color(0xffffff);

  window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(sizes.width, sizes.height);

  const cubeMaterial = new THREE.MeshStandardMaterial({ map: texture1 });
  const sphereMaterial = new THREE.MeshStandardMaterial({ map: texture1 });
  const toursMaterial = new THREE.MeshStandardMaterial({ map: texture1 });

  const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.x = 10;
  cube.castShadow = true;
  scene.add(cube);

  const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  scene.add(sphere);

  const toursGeometry = new THREE.TorusGeometry(2, 0.4, 32, 32);
  const tours = new THREE.Mesh(toursGeometry, toursMaterial);
  tours.position.x = -10;
  tours.castShadow = true;
  scene.add(tours);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  plane.material.side = THREE.DoubleSide;
  plane.rotation.x = -Math.PI * 0.5;
  plane.position.y = -4;
  plane.receiveShadow = true;
  scene.add(plane);

  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.z = 15;
  scene.add(camera);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 10, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 512;
  directionalLight.shadow.mapSize.height = 512;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  directionalLight.shadow.radius = 0;

  scene.add(directionalLight);

  const directionalLightCameraHelper = new THREE.CameraHelper(
    directionalLight.shadow.camera
  );
  // scene.add(directionalLightCameraHelper);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  let currentTexture = 1;
  gui.add(parameters, "switchTexture").name("Switch Texture");

  const clock = new THREE.Clock();

  const animate = () => {
    const elapsedTime = clock.getElapsedTime();

    cube.rotation.x = 0.5 * elapsedTime;
    cube.rotation.y = 0.5 * elapsedTime;

    tours.rotation.x = 0.5 * elapsedTime;
    tours.rotation.y = 0.5 * elapsedTime;

    sphere.rotation.x = 0.5 * elapsedTime;
    sphere.rotation.y = 0.5 * elapsedTime;

    cube.position.y = Math.sin(elapsedTime * 20) * 1.5;

    tours.position.y = Math.sin(elapsedTime * 20) * 1.5;

    sphere.position.x = Math.sin(elapsedTime * 2) * 4;
    sphere.position.y = Math.sin(elapsedTime * 20) * 1.5;
    sphere.position.z = Math.cos(elapsedTime * 2) * 3;
    controls.update();
    renderer.render(scene, camera);

    window.requestAnimationFrame(animate);
  };

  animate();
});
