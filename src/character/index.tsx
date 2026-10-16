import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import setupMonitor from "./utils/monitor";
import "./character.css";

interface CharacterProps {
  /** Called once the model is decrypted, loaded, and compiled. */
  onLoaded?: () => void;
  /** Delay (ms) between load completion and the intro animation. Default 500. */
  introDelay?: number;
  /** Show the glowing, flickering laptop screen. Default false (hidden, as on the original landing view). */
  monitor?: boolean;
}

const Character = ({
  onLoaded,
  introDelay = 500,
  monitor = false,
}: CharacterProps) => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());

  useEffect(() => {
    if (!canvasDiv.current) return;
    const rect = canvasDiv.current.getBoundingClientRect();
    const container = { width: rect.width, height: rect.height };
    const aspect = container.width / container.height;
    const scene = sceneRef.current;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    canvasDiv.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: any | null = null;
    let mixer: THREE.AnimationMixer | undefined;
    let disposed = false;

    const clock = new THREE.Clock();
    const light = setLighting(scene);
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    const onResize = () => handleResize(renderer, camera, canvasDiv);

    let monitorSetup: ReturnType<typeof setupMonitor> | null = null;
    loadCharacter().then((gltf) => {
      if (!gltf || disposed) return;
      const animations = setAnimations(gltf);
      hoverDivRef.current && animations.hover(gltf, hoverDivRef.current);
      mixer = animations.mixer;
      const character = gltf.scene;
      monitorSetup = setupMonitor(character, monitor);
      scene.add(character);
      headBone = character.getObjectByName("spine006") || null;
      screenLight = monitorSetup.screenLight;
      setTimeout(() => {
        if (disposed) return;
        light.turnOnLights();
        animations.startIntro();
        onLoaded?.();
      }, introDelay);
      window.addEventListener("resize", onResize);
    });

    let mouse = { x: 0, y: 0 },
      interpolation = { x: 0.1, y: 0.2 };

    let inView = true;
    const sectionEl = canvasDiv.current.closest("section");
    const inViewObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.2 }
    );
    if (sectionEl) inViewObserver.observe(sectionEl);

    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => (mouse = { x, y }));
    };
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const onTouchMoveListener = (e: TouchEvent) =>
      handleTouchMove(e, (x, y) => (mouse = { x, y }));
    const onTouchStart = () => {
      debounce = setTimeout(() => {
        canvasDiv.current?.addEventListener("touchmove", onTouchMoveListener);
      }, 200);
    };
    const onTouchEnd = () => {
      handleTouchEnd((x, y, interpolationX, interpolationY) => {
        mouse = { x, y };
        interpolation = { x: interpolationX, y: interpolationY };
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    const touchTarget = canvasDiv.current;
    touchTarget.addEventListener("touchstart", onTouchStart);
    touchTarget.addEventListener("touchend", onTouchEnd);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (headBone) {
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp,
          inView
        );
        if (screenLight) light.setPointLight(screenLight);
      }
      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(debounce);
      inViewObserver.disconnect();
      monitorSetup?.dispose();
      scene.clear();
      renderer.dispose();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMouseMove);
      touchTarget.removeEventListener("touchstart", onTouchStart);
      touchTarget.removeEventListener("touchend", onTouchEnd);
      touchTarget.removeEventListener("touchmove", onTouchMoveListener);
      if (renderer.domElement.parentElement === touchTarget) {
        touchTarget.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="character-container">
      <div className="character-model" ref={canvasDiv}>
        <div className="character-rim"></div>
        <div className="character-hover" ref={hoverDivRef}></div>
      </div>
    </div>
  );
};

export default Character;
