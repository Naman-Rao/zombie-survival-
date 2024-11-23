// Import the necessary modules from the Three.js library.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

// The particle system module is returned as a singleton to encapsulate the logic and prevent global namespace pollution.
export const particle_system = (() => {

  // Vertex Shader (VS) for the particle system: This is executed on the GPU for each particle.
  const _VS = `
  uniform float pointMultiplier;  // Multiplier for point size based on screen dimensions.
  
  attribute float size;  // The size of each particle.
  attribute float angle;  // The rotation angle for each particle.
  attribute vec4 colour;  // The color of the particle.
  
  varying vec4 vColour;  // Passed to the fragment shader to apply the color.
  varying vec2 vAngle;  // Passed to the fragment shader to apply the rotation.

  void main() {
    // Transform the particle position to camera space.
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
    // Calculate the final position of the particle in clip space.
    gl_Position = projectionMatrix * mvPosition;
  
    // Set the size of the point (particle) in screen space, adjusting for perspective.
    gl_PointSize = size * pointMultiplier / gl_Position.w;
  
    // Calculate the rotation for the particle.
    vAngle = vec2(cos(angle), sin(angle));
    vColour = colour;  // Set the color.
  }`;
  
  // Fragment Shader (FS) for the particle system: This is executed for each pixel of the particle.
  const _FS = `
  
  uniform sampler2D diffuseTexture;  // Texture to apply to the particles.
  
  varying vec4 vColour;  // The color passed from the vertex shader.
  varying vec2 vAngle;  // The angle passed from the vertex shader.
  
  void main() {
    // Adjust the texture coordinates to rotate the texture based on the particle's angle.
    vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  
    // Set the color of the fragment (pixel) by sampling the texture and multiplying by the particle's color.
    gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
  }`;

  // LinearSpline class: Interpolates between points for smooth transitions (used for particle properties like alpha, size, and color).
  class LinearSpline {
    constructor(lerp) {
      this._points = [];  // Store the points for interpolation.
      this._lerp = lerp;  // The interpolation function (linear in this case).
    }

    // Add a point to the spline with a time value and data value.
    AddPoint(t, d) {
      this._points.push([t, d]);
    }

    // Get the interpolated value for a given time.
    Get(t) {
      let p1 = 0;

      // Find the two points between which the time value t lies.
      for (let i = 0; i < this._points.length; i++) {
        if (this._points[i][0] >= t) {
          break;
        }
        p1 = i;
      }

      const p2 = Math.min(this._points.length - 1, p1 + 1);

      // If the points are the same, return the value.
      if (p1 == p2) {
        return this._points[p1][1];
      }

      // Interpolate between the two points.
      return this._lerp(
          (t - this._points[p1][0]) / (
              this._points[p2][0] - this._points[p1][0]),
          this._points[p1][1], this._points[p2][1]);
    }
  }

  // ParticleSystem class: Represents a system of particles (e.g., for explosions or fire).
  class ParticleSystem {
    constructor(params) {
      // Set up uniforms, including the texture and point multiplier for particle size.
      const uniforms = {
          diffuseTexture: {
              value: new THREE.TextureLoader().load(params.texture) // Load the texture for particles.
          },
          pointMultiplier: {
              value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))  // Calculate the multiplier based on the viewport size.
          }
      };

      // Create the shader material for rendering the particles.
      this._material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: _VS,
          fragmentShader: _FS,
          blending: THREE.AdditiveBlending,  // Additive blending for particles to create glowing effects.
          depthTest: true,
          depthWrite: false,  // Do not write to depth buffer (particles should appear in front of everything else).
          transparent: true,  // Make particles transparent to blend them correctly.
          vertexColors: true  // Allow particles to use vertex colors.
      });

      this._camera = params.camera;  // Store the camera for sorting particles by depth.
      this._particles = [];  // Store the particles.

      // Create the geometry and set up attributes for particle properties.
      this._geometry = new THREE.BufferGeometry();
      this._geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));  // Particle position.
      this._geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));  // Particle size.
      this._geometry.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));  // Particle color (RGBA).
      this._geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));  // Particle angle for rotation.

      // Create the Points object (which represents the particle system).
      this._points = new THREE.Points(this._geometry, this._material);

      // Add the particle system to the parent object in the scene.
      params.parent.add(this._points);

      // Initialize splines for particle properties.
      this._alphaSpline = new LinearSpline((t, a, b) => {
        return a + t * (b - a);  // Linear interpolation for alpha.
      });

      this._colourSpline = new LinearSpline((t, a, b) => {
        const c = a.clone();
        return c.lerp(b, t);  // Linear interpolation for color (lerp is used to blend the color).
      });

      this._sizeSpline = new LinearSpline((t, a, b) => {
        return a + t * (b - a);  // Linear interpolation for size.
      });

      // Update the particle geometry based on the current particle state.
      this._UpdateGeometry();
    }

    // Add a given number of particles at a specified origin point.
    AddParticles(origin, n) {
      for (let i = 0; i < n; i++) {
        // Randomize particle properties (life, position, size, color, etc.)
        const life = (Math.random() * 0.75 + 0.25) * 3.0;
        const p = new THREE.Vector3(
            (Math.random() * 2 - 1) * 1.0,
            (Math.random() * 2 - 1) * 1.0,
            (Math.random() * 2 - 1) * 1.0);
        const d = p.clone().normalize().multiplyScalar(15);  // Random velocity.
        p.add(origin);  // Offset particle from the origin.
        this._particles.push({
            position: p,
            size: (Math.random() * 0.5 + 0.5) * 4.0,  // Randomize size.
            colour: new THREE.Color(),  // Default color.
            alpha: 1.0,  // Full alpha at the start.
            life: life,  // Set the lifetime of the particle.
            maxLife: life,  // Store the max lifetime for calculations.
            rotation: Math.random() * 2.0 * Math.PI,  // Random rotation.
            velocity: d,  // Particle velocity.
        });
      }
    }

    // Update the geometry of the particle system (e.g., positions, sizes, colors).
    _UpdateGeometry() {
      const positions = [];
      const sizes = [];
      const colours = [];
      const angles = [];

      // Loop through particles and update their properties in the geometry attributes.
      for (let p of this._particles) {
        positions.push(p.position.x, p.position.y, p.position.z);
        colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
        sizes.push(p.currentSize);
        angles.push(p.rotation);
      }

      // Set the geometry attributes with the updated particle data.
      this._geometry.setAttribute(
          'position', new THREE.Float32BufferAttribute(positions, 3));
      this._geometry.setAttribute(
          'size', new THREE.Float32BufferAttribute(sizes, 1));
      this._geometry.setAttribute(
          'colour', new THREE.Float32BufferAttribute(colours, 4));
      this._geometry.setAttribute(
          'angle', new THREE.Float32BufferAttribute(angles, 1));
    
      // Mark the attributes as needing an update.
      this._geometry.attributes.position.needsUpdate = true;
      this._geometry.attributes.size.needsUpdate = true;
      this._geometry.attributes.colour.needsUpdate = true;
      this._geometry.attributes.angle.needsUpdate = true;
    }

    // Update the particle system by progressing the life of each particle.
    Update(deltaTime) {
      const deadParticles = [];
      for (let i = 0; i < this._particles.length; i++) {
        const p = this._particles[i];

        // Decrease the remaining life of the particle.
        p.life -= deltaTime;

        // If the particle is still alive, update its properties.
        if (p.life > 0) {
          p.position.add(p.velocity.clone().multiplyScalar(deltaTime));  // Update position based on velocity.
          p.alpha = this._alphaSpline.Get(1 - p.life / p.maxLife);  // Update alpha based on remaining life.
          p.currentSize = this._sizeSpline.Get(1 - p.life / p.maxLife);  // Update size based on remaining life.
          p.colour.setHSL(0.1 + Math.random() * 0.1, 1.0, 0.5);  // Randomize color.
          p.rotation += 0.03 * deltaTime;  // Apply a slight rotation.

        } else {
          // If the particle is dead, mark it for removal.
          deadParticles.push(i);
        }
      }

      // Remove dead particles from the system.
      for (let i = deadParticles.length - 1; i >= 0; i--) {
        this._particles.splice(deadParticles[i], 1);
      }

      // Update geometry after all particles are processed.
      this._UpdateGeometry();
    }

    // Get the 3D object representing the particle system.
    GetObject() {
      return this._points;
    }

    // Set the initial properties (like size and color) for the particle system.
    SetProperties(properties) {
      // Set alpha, size, color splines for the system.
      this._alphaSpline.AddPoint(0.0, properties.alphaStart);
      this._alphaSpline.AddPoint(1.0, properties.alphaEnd);
      this._colourSpline.AddPoint(0.0, properties.colourStart);
      this._colourSpline.AddPoint(1.0, properties.colourEnd);
      this._sizeSpline.AddPoint(0.0, properties.sizeStart);
      this._sizeSpline.AddPoint(1.0, properties.sizeEnd);
    }
  }

  // Return the ParticleSystem class to be used elsewhere.
  return ParticleSystem;

})();
