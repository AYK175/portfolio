import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { decryptFile } from "./decrypt";

const MODEL_URL = `${import.meta.env.BASE_URL}models/character.enc`;
const MODEL_PASSWORD = "Character3D#@";
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`;

// The source model shares one flat-gray material across the head, body/shirt,
// ears, neck, hands, pants and shoes. These meshes are each given their own
// cloned material (grouped by target color) so skin and clothing can differ.
const MESH_COLORS: Record<string, string> = {
  Plane007: "#e0ac80", // head
  Ear001: "#e0ac80",
  Neck: "#e0ac80",
  Hand: "#e0ac80",
  BODYSHIRT: "#1a1a1a",
  Pant: "#2b2b2f",
  Shoe: "#161616",
  Sole: "#161616",
};

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_PATH);
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        const encryptedBlob = await decryptFile(MODEL_URL, MODEL_PASSWORD);
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        let character: THREE.Object3D;
        loader.load(
          blobUrl,
          async (gltf) => {
            character = gltf.scene;
            await renderer.compileAsync(character, camera, scene);
            const coloredMaterials = new Map<string, THREE.MeshStandardMaterial>();
            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;
                child.castShadow = false;
                child.receiveShadow = false;
                mesh.frustumCulled = true;
                if (mesh.material && !Array.isArray(mesh.material)) {
                  (mesh.material as THREE.ShaderMaterial).precision = "mediump";
                  const targetColor = MESH_COLORS[mesh.name];
                  if (targetColor) {
                    let material = coloredMaterials.get(targetColor);
                    if (!material) {
                      material = (mesh.material as THREE.MeshStandardMaterial).clone();
                      material.color.set(targetColor);
                      coloredMaterials.set(targetColor, material);
                    }
                    mesh.material = material;
                  }
                }
              }
            });
            resolve(gltf);
            character!.getObjectByName("footR")!.position.y = 3.36;
            character!.getObjectByName("footL")!.position.y = 3.36;
            dracoLoader.dispose();
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
