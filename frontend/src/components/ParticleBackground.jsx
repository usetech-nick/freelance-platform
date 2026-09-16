// import { useEffect, useRef } from "react";

// /**
//  * Drifting starfield behind the whole app.
//  * The scene rotates slowly on its own and the camera eases toward the pointer,
//  * so the field parallaxes as you move the mouse.
//  */
// export default function ParticleBackground() {
//   const mountRef = useRef(null);

//   useEffect(() => {
//     const mount = mountRef.current;
//     if (!mount) return;

//     let cleanup = () => {};
//     let cancelled = false;

//     // three.js is loaded on demand so it stays out of the initial bundle
//     (async () => {
//       const THREE = await import("three");
//       if (cancelled) return;

//       const reduceMotion = window.matchMedia(
//         "(prefers-reduced-motion: reduce)",
//       ).matches;

//       let mouseX = 0;
//       let mouseY = 0;
//       let windowHalfX = window.innerWidth / 2;
//       let windowHalfY = window.innerHeight / 2;
//       let frameId;

//       const camera = new THREE.PerspectiveCamera(
//         50,
//         window.innerWidth / window.innerHeight,
//         5,
//         2000,
//       );
//       camera.position.z = 500;

//       const scene = new THREE.Scene();
//       scene.fog = new THREE.FogExp2(0x08080a, 0.0009);

//       // fewer points on small screens so phones stay smooth
//       const count = window.innerWidth < 720 ? 7000 : 2000;
//       const size = 2000;
//       const positions = new Float32Array(count * 3);

//       for (let i = 0; i < count; i++) {
//         // two random numbers averaged: clusters points toward the centre
//         positions[i * 3] =
//           (Math.random() * size + Math.random() * size) / 2 - size / 2;
//         positions[i * 3 + 1] =
//           (Math.random() * size + Math.random() * size) / 2 - size / 2;
//         positions[i * 3 + 2] =
//           (Math.random() * size + Math.random() * size) / 2 - size / 2;
//       }

//       const geometry = new THREE.BufferGeometry();
//       geometry.setAttribute(
//         "position",
//         new THREE.BufferAttribute(positions, 3),
//       );

//       const material = new THREE.PointsMaterial({
//         size: 2,
//         color: 0xffffff,
//         transparent: true,
//         opacity: 0.9,
//         sizeAttenuation: true,
//       });

//       const particles = new THREE.Points(geometry, material);
//       scene.add(particles);

//       const renderer = new THREE.WebGLRenderer({
//         alpha: true,
//         antialias: false,
//       });
//       renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//       renderer.setSize(window.innerWidth, window.innerHeight);
//       renderer.setClearAlpha(0);
//       mount.appendChild(renderer.domElement);

//       function onPointerMove(event) {
//         if (event.isPrimary === false) return;
//         mouseX = event.clientX - windowHalfX;
//         mouseY = event.clientY - windowHalfY;
//       }

//       function onWindowResize() {
//         windowHalfX = window.innerWidth / 2;
//         windowHalfY = window.innerHeight / 2;
//         camera.aspect = window.innerWidth / window.innerHeight;
//         camera.updateProjectionMatrix();
//         renderer.setSize(window.innerWidth, window.innerHeight);
//       }

//       function render() {
//         camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
//         camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
//         camera.lookAt(scene.position);
//         renderer.render(scene, camera);
//         scene.rotation.x += 0.0004;
//         scene.rotation.y += 0.0008;
//       }

//       function animate() {
//         frameId = requestAnimationFrame(animate);
//         render();
//       }

//       window.addEventListener("resize", onWindowResize);
//       if (!reduceMotion) {
//         window.addEventListener("pointermove", onPointerMove);
//         animate();
//       } else {
//         renderer.render(scene, camera);
//       }

//       cleanup = () => {
//         cancelAnimationFrame(frameId);
//         window.removeEventListener("resize", onWindowResize);
//         window.removeEventListener("pointermove", onPointerMove);
//         geometry.dispose();
//         material.dispose();
//         renderer.dispose();
//         if (renderer.domElement.parentNode === mount)
//           mount.removeChild(renderer.domElement);
//       };
//     })();

//     return () => {
//       cancelled = true;
//       cleanup();
//     };
//   }, []);

//   return <div className="particle-bg" ref={mountRef} aria-hidden="true" />;
// }

import { useEffect, useRef } from "react";

/**
 * Drifting starfield behind the whole app.
 * The scene rotates slowly on its own.
 * Mouse movement has no effect on the background.
 */
export default function ParticleBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cleanup = () => {};
    let cancelled = false;

    // three.js is loaded on demand so it stays out of the initial bundle
    (async () => {
      const THREE = await import("three");
      if (cancelled) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      let frameId;

      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        5,
        2000,
      );

      camera.position.z = 500;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x08080a, 0.0009);

      // Fewer points on small screens so phones stay smooth
      const count = window.innerWidth < 720 ? 7000 : 2000;
      const size = 2000;

      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        // Two random numbers averaged:
        // clusters points toward the centre
        positions[i * 3] =
          (Math.random() * size + Math.random() * size) / 2 - size / 2;

        positions[i * 3 + 1] =
          (Math.random() * size + Math.random() * size) / 2 - size / 2;

        positions[i * 3 + 2] =
          (Math.random() * size + Math.random() * size) / 2 - size / 2;
      }

      const geometry = new THREE.BufferGeometry();

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );

      const material = new THREE.PointsMaterial({
        size: 2,
        // color: 0xffffff,
        color: 0x888888,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
      });

      const particles = new THREE.Points(geometry, material);

      scene.add(particles);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearAlpha(0);

      mount.appendChild(renderer.domElement);

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      function render() {
        // Mouse movement has NO effect on camera

        camera.lookAt(scene.position);

        renderer.render(scene, camera);

        // Automatic slow movement
        scene.rotation.x += 0.0004;
        scene.rotation.y += 0.0008;
      }

      function animate() {
        frameId = requestAnimationFrame(animate);
        render();
      }

      window.addEventListener("resize", onWindowResize);

      if (!reduceMotion) {
        animate();
      } else {
        renderer.render(scene, camera);
      }

      cleanup = () => {
        cancelAnimationFrame(frameId);

        window.removeEventListener("resize", onWindowResize);

        geometry.dispose();
        material.dispose();
        renderer.dispose();

        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      className="particle-bg"
      ref={mountRef}
      aria-hidden="true"
    />
  );
}