import React, { useState } from 'react';
import * as THREE from 'three';

let currentDensityData = null;
let currentDimensions = null;

export function renderDensityCloud(scene, densityData, dimensions, positiveThreshold = 0.001, negativeThreshold = 0.001) {
  currentDensityData = densityData;
  currentDimensions = dimensions;

  if (window.densityCloud) {
    scene.remove(window.densityCloud);
    window.densityCloud.geometry.dispose();
    window.densityCloud.material.dispose();
  }

  const { nx, ny, nz, origin, voxelSize } = dimensions;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];

  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      for (let z = 0; z < nz; z++) {
        const value = densityData[x][y][z];
        if (value > 0 && value < positiveThreshold) continue;
        if (value < 0 && Math.abs(value) < negativeThreshold) continue;
        if (Math.abs(value) < 0.00001) continue;

        const px = origin.x + x * voxelSize.x;
        const py = origin.y + y * voxelSize.y;
        const pz = origin.z + z * voxelSize.z;

        positions.push(px, py, pz);
        colors.push(value > 0 ? 1 : 0, 0, value < 0 ? 1 : 0);
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const cloud = new THREE.Points(geometry, material);
  scene.add(cloud);
  window.densityCloud = cloud;
}

export function updateDensityThresholds(scene, positiveThreshold, negativeThreshold) {
  if (currentDensityData && currentDimensions) {
    renderDensityCloud(scene, currentDensityData, currentDimensions, positiveThreshold, negativeThreshold);
  }
}
