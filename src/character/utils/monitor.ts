import * as THREE from "three";
import { gsap } from "gsap";

/**
 * Sets up the laptop-screen meshes ("Plane004" plane + "screenlight"
 * glow). In the original site these start invisible and only fade in
 * during a scroll sequence; standalone, `visible` chooses between the
 * hidden-screen hero look (false) and a glowing, flickering screen (true).
 */
export default function setupMonitor(
  character: THREE.Object3D,
  visible: boolean
) {
  let screenLight: any = null;
  let monitor: any = null;
  let intensity = Math.random();
  const flicker = setInterval(() => {
    intensity = Math.random();
  }, 200);

  character.children.forEach((object: any) => {
    if (object.name === "Plane004") {
      object.children.forEach((child: any) => {
        child.material.transparent = true;
        child.material.opacity = visible ? 1 : 0;
        if (child.material.name === "Material.027") {
          monitor = child;
          child.material.color.set("#FFFFFF");
        }
      });
    }
    if (object.name === "screenlight") {
      object.material.transparent = true;
      object.material.opacity = visible ? 1 : 0;
      object.material.emissive.set("#9FE8F5");
      if (visible) {
        gsap.timeline({ repeat: -1, repeatRefresh: true }).to(object.material, {
          emissiveIntensity: () => intensity * 8,
          duration: () => Math.random() * 0.6,
          delay: () => Math.random() * 0.1,
        });
      }
      screenLight = object;
    }
  });

  return {
    screenLight,
    monitor,
    dispose: () => clearInterval(flicker),
  };
}
