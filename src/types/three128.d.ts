declare module "three128" {
  export class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
    lerp(v: Vector2, alpha: number): this;
  }
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
    setScalar(scalar: number): this;
    copy(v: Vector3): this;
  }
  export class Color {
    constructor(r?: string | number, g?: number, b?: number);
  }
  export class OrthographicCamera {
    constructor(left?: number, right?: number, top?: number, bottom?: number, near?: number, far?: number);
    position: Vector3;
  }
  export class PerspectiveCamera {
    fov: number;
    aspect: number;
    position: Vector3;
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    updateProjectionMatrix(): void;
  }
  export class Scene {
    add(...object: any[]): this;
  }
  export class Group {
    children: any[];
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    add(...object: any[]): this;
  }
  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
  }
  export class BufferGeometry {
    setAttribute(name: string, attribute: BufferAttribute): this;
    dispose(): void;
  }
  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number);
  }
  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number);
  }
  export class IcosahedronGeometry extends BufferGeometry {
    constructor(radius?: number, detail?: number);
  }
  export class TorusGeometry extends BufferGeometry {
    constructor(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number);
  }
  export class ShaderMaterial {
    uniforms: Record<string, { value: any }>;
    constructor(parameters?: Record<string, any>);
    dispose(): void;
  }
  export class Mesh {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    visible: boolean;
    geometry: BufferGeometry;
    material: ShaderMaterial | ShaderMaterial[];
    constructor(geometry?: any, material?: any);
  }
  export class Points {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
    visible: boolean;
    constructor(geometry?: any, material?: any);
  }
  export class WebGLRenderTarget {
    texture: any;
    constructor(width?: number, height?: number, options?: Record<string, any>);
    setSize(width: number, height: number): void;
    dispose(): void;
  }
  export class WebGLRenderer {
    autoClear: boolean;
    constructor(parameters?: Record<string, any>);
    setPixelRatio(value: number): void;
    setClearColor(color: number, alpha?: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setRenderTarget(renderTarget: WebGLRenderTarget | null): void;
    clear(): void;
    render(scene: Scene, camera: OrthographicCamera | PerspectiveCamera): void;
    dispose(): void;
  }
  export const AdditiveBlending: number;
  export const LinearFilter: number;
  export const RGBAFormat: number;
}
