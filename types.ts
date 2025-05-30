
export enum FractalType {
  SierpinskiTetrahedron = 'sierpinskiTetrahedron',
  MengerSponge = 'mengerSponge',
  SierpinskiOctahedron = 'sierpinskiOctahedron',
}

export interface FractalParameters {
  type: FractalType;
  level: number;
  size: number;
  color: string;
}

export interface LightSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalPosition: { x: number; y: number; z: number };
  fillIntensity: number;
  hemisphereIntensity: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Face {
  v1: number;
  v2: number;
  v3: number;
}

// Declaration for THREE.js types when loaded from CDN
declare global {
  namespace THREE {
    class OrbitControls {
      constructor(object: Camera, domElement?: HTMLElement);
      enabled: boolean;
      target: Vector3;
      enableDamping: boolean;
      dampingFactor: number;
      screenSpacePanning: boolean;
      minDistance: number;
      maxDistance: number;
      maxPolarAngle: number;
      update(): void;
      addEventListener(type: string, listener: (event: any) => void): void;
      removeEventListener(type: string, listener: (event: any) => void): void;
      dispose(): void;
    }

    type ColorRepresentation = string | number | Color;

    class Color {
      constructor(color?: ColorRepresentation);
      set(color: ColorRepresentation): this;
      // Add other Color methods/properties if needed
    }

    class Object3D {
      id: number;
      name: string;
      position: Vector3;
      rotation: Euler;
      scale: Vector3;
      castShadow: boolean;
      receiveShadow: boolean;
      visible: boolean;
      add(...object: Object3D[]): this;
      remove(...object: Object3D[]): this;
      getObjectByName(name: string): Object3D | undefined;
      lookAt(vector: Vector3 | number, y?: number, z?: number): void;
      // Add other Object3D methods/properties if needed
    }
    
    class Euler {
        constructor(x?: number, y?: number, z?: number, order?: string);
        x: number;
        y: number;
        z: number;
        order: string;
        set(x: number, y: number, z: number, order?: string): this;
    }

    class Vector2 {
        constructor(x?: number, y?: number);
        x: number;
        y: number;
        width: number;
        height: number;
    }

    class Vector3 {
      constructor(x?: number, y?: number, z?: number);
      x: number;
      y: number;
      z: number;
      set(x: number, y: number, z: number): this;
      clone(): Vector3;
      add(v: Vector3): this;
      sub(v: Vector3): this;
      multiplyScalar(s: number): this;
      divideScalar(scalar: number): this;
      length(): number;
      normalize(): this;
      copy(v: Vector3): this;
      // Note: lookAt is on Object3D, inherited by Camera
      // Add other Vector3 methods/properties if needed
    }
    
    class Sphere {
        constructor(center?: Vector3, radius?: number);
        center: Vector3;
        radius: number;
        copy(sphere: Sphere): this;
        // Add other Sphere methods/properties if needed
    }

    class Matrix4 {
        // Add Matrix4 methods/properties if needed
    }
    
    class Texture extends EventDispatcher {
        // Add Texture methods/properties if needed
    }
    class EventDispatcher {
        addEventListener(type: string, listener: (event: any) => void): void;
        hasEventListener(type: string, listener: (event: any) => void): boolean;
        removeEventListener(type: string, listener: (event: any) => void): void;
        dispatchEvent(event: { type: string; [attachment: string]: any }): void;
    }


    class Scene extends Object3D {
      constructor();
      background: Color | Texture | null;
      // Add other Scene methods/properties if needed
    }

    class Camera extends Object3D {
      projectionMatrix: Matrix4;
      updateProjectionMatrix(): void;
      lookAt(vector: Vector3 | number, y?: number, z?: number): void; // Explicitly add here
      // Add other Camera methods/properties if needed
    }

    class PerspectiveCamera extends Camera {
      constructor(fov?: number, aspect?: number, near?: number, far?: number);
      fov: number;
      aspect: number;
      near: number;
      far: number;
      // Add other PerspectiveCamera methods/properties if needed
    }
    
    class OrthographicCamera extends Camera {
        constructor(left: number, right: number, top: number, bottom: number, near?: number, far?: number);
        left: number;
        right: number;
        top: number;
        bottom: number;
        near: number;
        far: number;
        updateProjectionMatrix(): void;
        // Add other OrthographicCamera methods/properties if needed
    }


    interface WebGLRendererParameters {
      canvas?: HTMLCanvasElement;
      antialias?: boolean;
      alpha?: boolean;
      // Add other parameters if needed
    }

    interface WebGLShadowMap {
      enabled: boolean;
      type: ShadowMapType;
      // Add other WebGLShadowMap methods/properties if needed
    }
    
    type ShadowMapType = number; // THREE.BasicShadowMap, THREE.PCFShadowMap, THREE.PCFSoftShadowMap, THREE.VSMShadowMap
    const PCFSoftShadowMap: ShadowMapType;


    class WebGLRenderer {
      constructor(parameters?: WebGLRendererParameters);
      domElement: HTMLCanvasElement;
      shadowMap: WebGLShadowMap;
      setPixelRatio(value: number): void;
      setSize(width: number, height: number, updateStyle?: boolean): void;
      render(scene: Scene, camera: Camera): void;
      dispose(): void;
      // Add other WebGLRenderer methods/properties if needed
    }

    class Light extends Object3D {
      constructor(color?: ColorRepresentation, intensity?: number);
      color: Color;
      intensity: number;
      // Add other Light methods/properties if needed
    }

    class AmbientLight extends Light {
      constructor(color?: ColorRepresentation, intensity?: number);
    }
    
    class LightShadow {
        constructor(camera: Camera); // Typically OrthographicCamera or PerspectiveCamera for shadows
        camera: Camera; // Changed to base Camera type for flexibility, specific light shadows will refine this
        mapSize: Vector2;
        // Add other LightShadow methods/properties if needed
    }

    class DirectionalLightShadow extends LightShadow {
        camera: OrthographicCamera; // This remains specific
    }

    class DirectionalLight extends Light {
      constructor(color?: ColorRepresentation, intensity?: number);
      shadow: DirectionalLightShadow;
      target: Object3D; // Add target property
      // Add other DirectionalLight methods/properties if needed
    }

    class HemisphereLight extends Light {
      constructor(skyColor?: ColorRepresentation, groundColor?: ColorRepresentation, intensity?: number);
      // Add other HemisphereLight methods/properties if needed
    }

    class BufferAttribute {
      constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean);
      // Add other BufferAttribute methods/properties if needed
    }
    
    class Float32BufferAttribute extends BufferAttribute {
      constructor(array: ArrayLike<number> | ArrayBuffer, itemSize: number, normalized?: boolean);
    }

    class InterleavedBufferAttribute {
        // Define if used
    }

    class BufferGeometry extends EventDispatcher {
      constructor();
      attributes: { [name: string]: BufferAttribute | InterleavedBufferAttribute };
      setAttribute(name: string, attribute: BufferAttribute | InterleavedBufferAttribute): BufferGeometry;
      setIndex(index: BufferAttribute | number[] | null): BufferGeometry;
      computeVertexNormals(): void;
      computeBoundingSphere(): void;
      boundingSphere: Sphere | null;
      dispose(): void;
      // Add other BufferGeometry methods/properties if needed
    }
    
    type Side = number; // THREE.FrontSide, THREE.BackSide, THREE.DoubleSide
    const FrontSide: Side;
    const BackSide: Side;
    const DoubleSide: Side;

    class Material extends EventDispatcher {
      name: string;
      side: Side;
      transparent: boolean;
      opacity: number;
      visible: boolean;
      dispose(): void;
      // Add other Material methods/properties if needed
    }

    interface MeshStandardMaterialParameters {
      color?: ColorRepresentation;
      metalness?: number;
      roughness?: number;
      flatShading?: boolean;
      side?: Side;
      // Add other parameters if needed
    }

    class MeshStandardMaterial extends Material {
      constructor(parameters?: MeshStandardMaterialParameters);
      color: Color;
      metalness: number;
      roughness: number;
      flatShading: boolean;
      // Add other MeshStandardMaterial methods/properties if needed
    }

    class Mesh extends Object3D {
      constructor(geometry?: BufferGeometry, material?: Material | Material[]);
      geometry: BufferGeometry;
      material: Material | Material[];
      // Add other Mesh methods/properties if needed
    }
  }
}
