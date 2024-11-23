// Import necessary modules from THREE.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

// Import custom modules for entity management and math utilities
import { entity } from './entity.js';
import { math } from './math.js';

// Define the health_bar module
export const health_bar = (() => {

  // Vertex shader code (used to process vertices in 3D space)
  const _VS = `#version 300 es
varying vec2 vUV;

void main() {
  // Apply the model-view matrix transformation and set the position of the vertex
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vUV = uv;
}
`;

  // Fragment shader code (used to calculate the final color for each pixel)
  const _PS = `#version 300 es
uniform vec3 colour;
uniform float health;

varying vec2 vUV;

out vec4 out_FragColor;

void main() {
  // Interpolate the color based on the health value (green to red)
  out_FragColor = vec4(mix(colour, vec3(0.0), step(health, vUV.y)), 1.0);
}
`;

  // HealthBar component class
  class HealthBar extends entity.Component {
    constructor(params) {
      super(); // Call the parent class constructor
      this._params = params; // Store passed parameters
      this._Initialize(); // Initialize the health bar
    }

    // Initialize the health bar with shaders, materials, and geometry
    _Initialize() {
      const uniforms = {
        colour: {
          value: new THREE.Color(0, 1, 0), // Set initial color to green
        },
        health: {
          value: 1.0, // Initial health value (full)
        },
      };

      // Create a shader material for the health bar using the vertex and fragment shaders
      this._material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _PS,
        blending: THREE.NormalBlending, // Standard blending mode
        transparent: true, // Make the material transparent
        depthTest: false, // Disable depth testing
        depthWrite: false, // Disable depth writing
        side: THREE.DoubleSide, // Draw both sides of the geometry
      });

      this._geometry = new THREE.BufferGeometry(); // Create a geometry object for the health bar

      // Create the health bar mesh (using the geometry and material)
      this._bar = new THREE.Mesh(this._geometry, this._material);
      this._bar.frustumCulled = false; // Ensure the health bar is not culled when out of view
      this._bar.scale.set(2, 0.125, 1); // Set the scale of the health bar

      this._realHealth = 1.0; // Actual health value
      this._animHealth = 1.0; // Animated health value (used for smooth transitions)

      this._params.parent.add(this._bar); // Add the health bar to the parent object
      this._GenerateBuffers(); // Generate the geometry buffers for the health bar
    }

    // Initialize component-specific event handlers
    InitComponent() {
      this._RegisterHandler('health.update', (m) => { this._OnHealth(m); });
    }

    // Update health based on received message
    _OnHealth(msg) {
      const healthPercent = (msg.health / msg.maxHealth); // Calculate health as a percentage
      this._realHealth = healthPercent; // Update real health
    }

    // Update the health bar every frame (smoothly transition the health value)
    Update(timeElapsed) {
      const t = 1.0 - Math.pow(0.001, timeElapsed); // Smoothing factor based on time

      // Smoothly interpolate between the current animated health and the real health
      this._animHealth = math.lerp(t, this._animHealth, this._realHealth);

      // Define colors for the health bar (from red to green)
      const _R = new THREE.Color(1.0, 0, 0);
      const _G = new THREE.Color(0.0, 1.0, 0.0);
      const c = _R.clone();
      c.lerpHSL(_G, this._animHealth); // Interpolate color between red and green

      // Update shader uniforms with the current health value and color
      this._material.uniforms.health.value = this._animHealth;
      this._material.uniforms.colour.value = c;

      // Update the position and orientation of the health bar
      this._bar.position.copy(this._parent._position);
      this._bar.position.y += 8.0; // Offset the health bar above the parent object
      this._bar.quaternion.copy(this._params.camera.quaternion); // Align the health bar with the camera's orientation
    }

    // Generate the buffer attributes (geometry) for the health bar
    _GenerateBuffers() {
      const indices = []; // Store the index data for the vertices
      const positions = []; // Store the position data for the vertices
      const uvs = []; // Store the UV coordinates for the vertices

      // Define a square (two triangles)
      const square = [0, 1, 2, 2, 3, 0];

      indices.push(...square); // Add the square indices

      // Define the four corners of the square
      const p1 = new THREE.Vector3(-1, -1, 0);
      const p2 = new THREE.Vector3(-1, 1, 0);
      const p3 = new THREE.Vector3(1, 1, 0);
      const p4 = new THREE.Vector3(1, -1, 0);

      // Add UV coordinates (mapping the texture to the square)
      uvs.push(0.0, 0.0);
      uvs.push(1.0, 0.0);
      uvs.push(1.0, 1.0);
      uvs.push(0.0, 1.0);

      // Add the positions of the vertices to the positions array
      positions.push(p1.x, p1.y, p1.z);
      positions.push(p2.x, p2.y, p2.z);
      positions.push(p3.x, p3.y, p3.z);
      positions.push(p4.x, p4.y, p4.z);

      // Set the geometry attributes (positions, UVs, indices)
      this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      this._geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      this._geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

      // Mark the positions attribute as needing an update
      this._geometry.attributes.position.needsUpdate = true;
    }
  };

  // Return the HealthBar class for use in other parts of the application
  return {
    HealthBar: HealthBar,
  };
})();
