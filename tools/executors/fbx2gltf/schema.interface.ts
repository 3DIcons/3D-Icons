export enum LongIndices {
  Never = 'never',
  Auto = 'auto',
  Always = 'always'
}

export enum ComputeNormals {
  Never = 'never',
  Broken = 'broken',
  Missing = 'missing',
  Always = 'always',
}

export enum AnimFramerate {
  Bake24 = 'bake24',
  Bake30 = 'bake30',
  Bake60 = 'bake60',
}

export enum KeepAttribute {
  Position = 'position',
  Normal = 'normal',
  Tangent = 'tangent',
  Binormial = 'binormal',
  Color = 'color',
  Uv0 = 'uv0',
  Uv1 = 'uv1',
  Auto = 'auto',
}

export interface Fbx2GltfOptions {
  animFramerate?: AnimFramerate
  binary: boolean,
  blendShapeNormals: boolean,
  blendShapeTangents: boolean,
  computeNormals: ComputeNormals,
  draco: boolean,
  dracoBitsForColors: number,
  dracoBitsForNormals: number,
  dracoBitsForOther: number,
  dracoBitsForPosition: number,
  dracoBitsForUv: number,
  dracoCompressionLevel: number,
  embed: boolean,
  flipU: boolean,
  flipV: boolean
  inPath: string,
  keepAttribute: KeepAttribute,
  khrMaterialsUnlit: boolean,
  longIndices: LongIndices,
  noFlipU: boolean,
  noFlipV: boolean;
  noKhrLightsPunctual: boolean,
  pbrMetallicRoughness: boolean,
  tmpPath: string,
  userProperties: boolean,
  verbose: boolean,
}
