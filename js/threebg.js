import * as THREE from "./three.module.min.js";
// import * as THREE from "https://cdn.ludwig-lehnert.de/js/three.module.min.js";

function setupBackground() {
  const bgEl = document.getElementById("threebg");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  bgEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);

  function setupLighting() {
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.y = 100;
    light.position.z = 20;
    light.position.x = 40;
    scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.y = -10;
    light.position.z = 10;
    light.position.x = -20;
    scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.y = -10;
    light.position.z = 10;
    scene.add(light);

    light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);
  }

  setupLighting();

  /**
   * @param {number | undefined} color
   * @param {(width: number, height: number, depth: number) => THREE.BufferGeometry} generator
   * @returns {THREE.Mesh}
   */
  function generateElement(color, generator) {
    const geo = generator();
    const mat = new THREE.MeshStandardMaterial({
      color: color ?? 0xe8e8e8,
      roughness: 0.7,
    });

    const cube = new THREE.Mesh(geo, mat);
    cube.castShadow = true;
    cube.receiveShadow = true;

    return cube;
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} depth
   * @param {number | undefined} color
   */
  function generateCube(width, height, depth, color) {
    return generateElement(color, () => {
      return new THREE.BoxGeometry(width, height, depth);
    });
  }

  /**
   * @param {number} radius
   * @param {number | undefined} color
   */
  function generateIcosahedron(radius, color) {
    return generateElement(color, () => {
      return new THREE.IcosahedronGeometry(radius);
    });
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} depth
   * @param {number | undefined} color
   */
  function generateCylinder(width, height, depth, color) {
    return generateElement(color, () => {
      return new THREE.CylinderGeometry(width, height, depth, 40);
    });
  }

  /**
   * @param {number} radius
   * @param {number | undefined} color
   */
  function generateOctahedron(radius, color) {
    return generateElement(color, () => {
      return new THREE.OctahedronGeometry(radius);
    });
  }

  const generators = [
    () => generateCube(0.6, 0.6, 0.6),
    () => generateOctahedron(0.4),
    () => {
      const res = generateCylinder(0.4, 0.4, 0.4);
      res.rotation.z = Math.PI / 2;
      return res;
    },
    () => generateIcosahedron(0.4),
  ];

  // generate the geometries
  const geometryTypes = [];
  const geometries = Array.from({ length: 15 }, (_, i) =>
    Array.from({ length: 15 }, (_, j) => {
      const index = i + j;
      const qualifier = i + j + Math.floor((j * i) / 3);

      if (qualifier % 5 == 0) {
        geometryTypes[index] = 3;
      } else if (qualifier % 4 == 0) {
        geometryTypes[index] = 2;
      } else if (qualifier % 3 == 0) {
        geometryTypes[index] = 1;
      } else {
        geometryTypes[index] = 0;
      }

      return generators[geometryTypes[index]]();
    })
  );

  // add geometries to the scene
  const allGeometries = [];
  geometries.forEach((geometries) => {
    geometries.forEach((geometry) => {
      allGeometries.push(geometry);
      scene.add(geometry);
    });
  });

  const cameraX = (geometries.length - 1) / 2;
  const cameraY = ((geometries[0]?.length ?? 1) - 1) / 2;

  camera.position.z = 5;
  camera.position.x = cameraX;
  camera.position.y = cameraY;

  function adjustBackgroundSize() {
    const width = window.outerWidth * 1.5;
    const height = window.outerHeight * 1.5;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }
  adjustBackgroundSize();
  window.addEventListener("resize", adjustBackgroundSize);

  function updateCubeRotation() {
    const offset = window.scrollY;
    const rotation = offset / 2000;
    window.cubeRotationX = rotation;
    window.cubeRotationY = rotation * 3;
  }
  updateCubeRotation();
  window.addEventListener("scroll", updateCubeRotation);

  let previousIntersecting = [];

  /**
   * @param {MouseEvent} event
   */
  function updateFocused(event) {
    const x = (event.clientX / (window.outerWidth * 1.5)) * 2 - 1;
    const y = - (event.clientY / (window.outerHeight * 1.5)) * 2 + 1;

    const vector = new THREE.Vector2(x, y);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(vector, camera);
    const intersecting = raycaster.intersectObjects(allGeometries);

    previousIntersecting = intersecting.map((object) => {
      return object.object;
    });

    previousIntersecting.forEach((geometry) => {
      geometry.material.color.setHex(0x303030);
    });
  }
  window.addEventListener("mousemove", updateFocused);

  function updateScene() {
    const color = window.currentColor ?? 0x000000;

    scene.background = new THREE.Color(color);

    geometries.forEach((geometries, i1) => {
      geometries.forEach((geometry, i2) => {
        geometry.position.x = (1 + (window.spacing ?? 0)) * i1;
        geometry.position.y = (1 + (window.spacing ?? 0)) * i2;

        geometry.rotation.y = window.cubeRotationY ?? 0;
        geometry.rotation.x = window.cubeRotationX ?? 0;

        if (previousIntersecting.includes(geometry)) {
          // create color string with leading zeros
          let colorStr = color.toString(16);
          while (colorStr.length < 6) colorStr = '0' + colorStr;

          // darken rgb value
          let r = Math.max(0, parseInt(colorStr.substring(0, 2), 16) - 28).toString(16);
          let g = Math.max(0, parseInt(colorStr.substring(2, 4), 16) - 28).toString(16);
          let b = Math.max(0, parseInt(colorStr.substring(4, 6), 16) - 28).toString(16);

          // add leading zeros
          r = r.length < 2 ? ('0' + r) : r;
          g = g.length < 2 ? ('0' + g) : g;
          b = b.length < 2 ? ('0' + b) : b;

          console.log(color.toString(16), r, g, b, parseInt(r + g + b, 16).toString(16));

          geometry.material.color.setHex(parseInt(r + g + b, 16));
        } else {
          geometry.material.color.setHex(color);
        }
      });
    });
  }

  window.addEventListener("click", (event) => {
    updateFocused(event);
    if (!previousIntersecting.length) return;

    geometries.forEach((geometries1, i) => {
      geometries1.forEach((geometry, j) => {
        if (previousIntersecting.includes(geometry)) {
          const index = i + j;
          geometryTypes[index] = (geometryTypes[index] + 1) % generators.length;
          scene.remove(geometry);

          const newGeometry = generators[geometryTypes[index]]();
          geometries[i][j] = newGeometry;
          scene.add(newGeometry);
        }
      });
    });

    while (previousIntersecting.length) previousIntersecting.pop();
  });

  function animate() {
    requestAnimationFrame(animate);

    updateScene();

    renderer.render(scene, camera);
  }

  animate();
}

setupBackground();
