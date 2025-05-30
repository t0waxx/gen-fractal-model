
import type { Face } from '../types';
import { FractalType } from '../types'; // Import FractalType if needed for internal logic, otherwise remove

// Type THREE explicitly from global scope, which should be populated by types.ts
type ThreeVector3 = THREE.Vector3;

interface GenerationOutput {
  bufferVertices: number[];
  bufferIndices: number[];
  exportVertices: ThreeVector3[];
  exportFaces: Face[];
}

function addUniqueVertex(
  vertex: ThreeVector3,
  allBufferVertices: number[],
  vertexMap: Map<string, number>,
  allExportVertices: ThreeVector3[]
): number {
  const key = `${vertex.x.toFixed(5)},${vertex.y.toFixed(5)},${vertex.z.toFixed(5)}`;
  if (vertexMap.has(key)) {
    return vertexMap.get(key)!;
  }
  const newIndex = allExportVertices.length;
  allBufferVertices.push(vertex.x, vertex.y, vertex.z);
  allExportVertices.push(vertex.clone());
  vertexMap.set(key, newIndex);
  return newIndex;
}

function subdivideTetrahedron(
  p1: ThreeVector3,
  p2: ThreeVector3,
  p3: ThreeVector3,
  p4: ThreeVector3,
  level: number,
  allBufferVertices: number[],
  allBufferIndices: number[],
  vertexMap: Map<string, number>,
  allExportVertices: ThreeVector3[],
  allExportFaces: Face[]
) {
  if (level === 0) {
    const idx1 = addUniqueVertex(p1, allBufferVertices, vertexMap, allExportVertices);
    const idx2 = addUniqueVertex(p2, allBufferVertices, vertexMap, allExportVertices);
    const idx3 = addUniqueVertex(p3, allBufferVertices, vertexMap, allExportVertices);
    const idx4 = addUniqueVertex(p4, allBufferVertices, vertexMap, allExportVertices);

    // Ensure consistent winding order for normals (e.g., counter-clockwise from outside)
    // Face 1 (p1, p3, p2)
    allBufferIndices.push(idx1, idx3, idx2);
    allExportFaces.push({ v1: idx1, v2: idx3, v3: idx2 });
    // Face 2 (p1, p2, p4)
    allBufferIndices.push(idx1, idx2, idx4);
    allExportFaces.push({ v1: idx1, v2: idx2, v3: idx4 });
    // Face 3 (p1, p4, p3)
    allBufferIndices.push(idx1, idx4, idx3);
    allExportFaces.push({ v1: idx1, v2: idx4, v3: idx3 });
    // Face 4 (p2, p3, p4) - check winding order if issues
    allBufferIndices.push(idx2, idx3, idx4); // Original: (idx2, idx3, idx4)
    allExportFaces.push({ v1: idx2, v2: idx3, v3: idx4 });
    return;
  }

  const m12 = p1.clone().add(p2).multiplyScalar(0.5);
  const m13 = p1.clone().add(p3).multiplyScalar(0.5);
  const m14 = p1.clone().add(p4).multiplyScalar(0.5);
  const m23 = p2.clone().add(p3).multiplyScalar(0.5);
  const m24 = p2.clone().add(p4).multiplyScalar(0.5);
  const m34 = p3.clone().add(p4).multiplyScalar(0.5);

  subdivideTetrahedron(p1, m12, m13, m14, level - 1, allBufferVertices, allBufferIndices, vertexMap, allExportVertices, allExportFaces);
  subdivideTetrahedron(m12, p2, m23, m24, level - 1, allBufferVertices, allBufferIndices, vertexMap, allExportVertices, allExportFaces);
  subdivideTetrahedron(m13, m23, p3, m34, level - 1, allBufferVertices, allBufferIndices, vertexMap, allExportVertices, allExportFaces);
  subdivideTetrahedron(m14, m24, m34, p4, level - 1, allBufferVertices, allBufferIndices, vertexMap, allExportVertices, allExportFaces);
}


export function generateSierpinskiTetrahedron(level: number, size: number): GenerationOutput {
  const bufferVertices: number[] = [];
  const bufferIndices: number[] = [];
  const exportVertices: ThreeVector3[] = [];
  const exportFaces: Face[] = [];
  const vertexMap = new Map<string, number>();

  // Initial vertices of the tetrahedron
  const p1 = new THREE.Vector3(size, size, size);
  const p2 = new THREE.Vector3(size, -size, -size);
  const p3 = new THREE.Vector3(-size, size, -size);
  const p4 = new THREE.Vector3(-size, -size, size);

  subdivideTetrahedron(p1, p2, p3, p4, level, bufferVertices, bufferIndices, vertexMap, exportVertices, exportFaces);
  return { bufferVertices, bufferIndices, exportVertices, exportFaces };
}

function subdivideCube(
  center: ThreeVector3,
  sideLength: number,
  level: number,
  allBufferVertices: number[],
  allBufferIndices: number[],
  vertexMap: Map<string, number>,
  allExportVertices: ThreeVector3[],
  allExportFaces: Face[]
) {
  if (level === 0) {
    const halfSide = sideLength / 2;
    const vertices = [
      new THREE.Vector3(center.x - halfSide, center.y - halfSide, center.z + halfSide), // 0
      new THREE.Vector3(center.x + halfSide, center.y - halfSide, center.z + halfSide), // 1
      new THREE.Vector3(center.x + halfSide, center.y + halfSide, center.z + halfSide), // 2
      new THREE.Vector3(center.x - halfSide, center.y + halfSide, center.z + halfSide), // 3
      new THREE.Vector3(center.x - halfSide, center.y - halfSide, center.z - halfSide), // 4
      new THREE.Vector3(center.x + halfSide, center.y - halfSide, center.z - halfSide), // 5
      new THREE.Vector3(center.x + halfSide, center.y + halfSide, center.z - halfSide), // 6
      new THREE.Vector3(center.x - halfSide, center.y + halfSide, center.z - halfSide)  // 7
    ];
    const idx = vertices.map(v => addUniqueVertex(v, allBufferVertices, vertexMap, allExportVertices));

    const facesData = [
      [idx[0], idx[1], idx[2]], [idx[0], idx[2], idx[3]], // Front
      [idx[4], idx[7], idx[6]], [idx[4], idx[6], idx[5]], // Back
      [idx[3], idx[2], idx[6]], [idx[3], idx[6], idx[7]], // Top
      [idx[0], idx[4], idx[5]], [idx[0], idx[5], idx[1]], // Bottom
      [idx[0], idx[3], idx[7]], [idx[0], idx[7], idx[4]], // Left
      [idx[1], idx[5], idx[6]], [idx[1], idx[6], idx[2]], // Right
    ];

    facesData.forEach(faceIndices => {
      allBufferIndices.push(...faceIndices);
      allExportFaces.push({ v1: faceIndices[0], v2: faceIndices[1], v3: faceIndices[2] });
    });
    return;
  }

  const newSideLength = sideLength / 3;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
        let zeroCount = 0;
        if (i === 0) zeroCount++;
        if (j === 0) zeroCount++;
        if (k === 0) zeroCount++;

        if (zeroCount < 2) {
          const offset = new THREE.Vector3(i * newSideLength, j * newSideLength, k * newSideLength);
          const newCenter = center.clone().add(offset);
          subdivideCube(newCenter, newSideLength, level - 1, allBufferVertices, allBufferIndices, vertexMap, allExportVertices, allExportFaces);
        }
      }
    }
  }
}

export function generateMengerSponge(level: number, size: number): GenerationOutput {
  const bufferVertices: number[] = [];
  const bufferIndices: number[] = [];
  const exportVertices: ThreeVector3[] = [];
  const exportFaces: Face[] = [];
  const vertexMap = new Map<string, number>();
  
  subdivideCube(new THREE.Vector3(0, 0, 0), size, level, bufferVertices, bufferIndices, vertexMap, exportVertices, exportFaces);
  return { bufferVertices, bufferIndices, exportVertices, exportFaces };
}


function subdivideOctahedron(
  center: ThreeVector3,
  scale: number,
  level: number,
  allBufferVertices: number[],
  allBufferIndices: number[],
  vertexMap: Map<string, number>,
  allExportVertices: ThreeVector3[],
  allExportFaces: Face[]
) {
  if (level === 0) {
    const vertices = [
      new THREE.Vector3(center.x, center.y + scale, center.z), // 0: top
      new THREE.Vector3(center.x, center.y - scale, center.z), // 1: bottom
      new THREE.Vector3(center.x + scale, center.y, center.z), // 2: +x
      new THREE.Vector3(center.x - scale, center.y, center.z), // 3: -x
      new THREE.Vector3(center.x, center.y, center.z + scale), // 4: +z
      new THREE.Vector3(center.x, center.y, center.z - scale)  // 5: -z
    ];
    const idx = vertices.map(v => addUniqueVertex(v, allBufferVertices, vertexMap, allExportVertices));

    const facesData = [
      [idx[0], idx[4], idx[2]], [idx[0], idx[2], idx[5]], [idx[0], idx[5], idx[3]], [idx[0], idx[3], idx[4]], // Top pyramid
      [idx[1], idx[2], idx[4]], [idx[1], idx[5], idx[2]], [idx[1], idx[3], idx[5]], [idx[1], idx[4], idx[3]], // Bottom pyramid
    ];
    facesData.forEach(faceIndices => {
      allBufferIndices.push(...faceIndices);
      allExportFaces.push({ v1: faceIndices[0], v2: faceIndices[1], v3: faceIndices[2] });
    });
    return;
  }

  const newScale = scale * 0.5;
  // This array holds the absolute centers for the new sub-octahedra.
  // The variable name "parentVerticesForCenters" from the original code was a bit misleading.
  // Let's call them "newSubOctahedraCenters" conceptually.
  const newSubOctahedraCenters = [
    new THREE.Vector3(center.x, center.y + newScale, center.z),
    new THREE.Vector3(center.x, center.y - newScale, center.z),
    new THREE.Vector3(center.x + newScale, center.y, center.z),
    new THREE.Vector3(center.x - newScale, center.y, center.z),
    new THREE.Vector3(center.x, center.y, center.z + newScale),
    new THREE.Vector3(center.x, center.y, center.z - newScale)
  ];

  for (let i = 0; i < newSubOctahedraCenters.length; i++) {
    const newCenterForSub = newSubOctahedraCenters[i]; // This IS the correct absolute center for the sub-octahedron.
    subdivideOctahedron(
      newCenterForSub, // Use this directly. The previous pv.add(center) was the bug.
      newScale,
      level - 1,
      allBufferVertices,
      allBufferIndices,
      vertexMap,
      allExportVertices,
      allExportFaces
    );
  }
}

export function generateSierpinskiOctahedron(level: number, size: number): GenerationOutput {
  const bufferVertices: number[] = [];
  const bufferIndices: number[] = [];
  const exportVertices: ThreeVector3[] = [];
  const exportFaces: Face[] = [];
  const vertexMap = new Map<string, number>();
  
  // For Sierpinski Octahedron, the initial 'scale' can be considered 'size'.
  // The 'center' is (0,0,0).
  subdivideOctahedron(new THREE.Vector3(0, 0, 0), size, level, bufferVertices, bufferIndices, vertexMap, exportVertices, exportFaces);
  return { bufferVertices, bufferIndices, exportVertices, exportFaces };
}
