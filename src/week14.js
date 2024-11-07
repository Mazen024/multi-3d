import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export function interaction() {
  return new Promise((resolve) => {
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
    camera.position.set(0, 1, 3);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(sizes.width, sizes.height);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    window.addEventListener("resize", () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
    });

    const fontLoader = new FontLoader();
    const textureLoader = new THREE.TextureLoader();
    const textTexture = textureLoader.load("/textures/matcaps/3.png");
    let countdownText;
    let counter = 3;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    fontLoader.load("/fonts/helvetiker_bold.typeface.json", (font) => {
      const createText = (content) => {
        if (countdownText) scene.remove(countdownText);

        const textGeometry = new TextGeometry(content, {
          font: font,
          size: 2,
          height: 1,
          curveSegments: 70,
          bevelEnabled: true,
          bevelThickness: 0.1,
          bevelSize: 0.1,
          bevelOffset: 0,
          bevelSegments: 5,
        });

        const textMaterial = new THREE.MeshMatcapMaterial({
          matcap: textTexture,
        });

        countdownText = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.center();
        scene.add(countdownText);

        controls.target.copy(countdownText.position);
        controls.update();
      };

      createText(counter.toString());

      const intervalId = setInterval(() => {
        counter -= 1;
        if (counter >= 0) {
          createText(counter.toString());
        } else {
          clearInterval(intervalId);
          resolve();
        }
      }, 1000);
    });

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  });
}
