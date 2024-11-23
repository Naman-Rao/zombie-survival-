import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js'; // Importing the THREE.js library for 3D rendering
import { particle_system } from "./particle-system.js"; // Importing the particle system module
import { entity } from "./entity.js"; // Importing the entity module

export const level_up_component = (() => {

  // LevelUpComponentSpawner class to handle spawning of level-up components
  class LevelUpComponentSpawner extends entity.Component {
    constructor(params) {
      super();
      this._params = params; // Storing parameters passed during initialization
    }

    // Method to spawn a new level-up component at a given position
    Spawn(pos) {
      const e = new entity.Entity(); // Create a new entity
      e.SetPosition(pos); // Set the position of the entity
      e.AddComponent(new LevelUpComponent(this._params)); // Add a LevelUpComponent to the entity
      this._parent._parent.Add(e); // Add the new entity to the parent entity's parent (likely the main scene)

      return e; // Return the created entity
    }
  };

  // LevelUpComponent class to handle the particle effects and behavior for level-up visuals
  class LevelUpComponent extends entity.Component {
    constructor(params) {
      super();
      this._params = params; // Storing parameters passed during initialization

      // Initialize the particle system with camera, scene, and texture details
      this._particles = new particle_system.ParticleSystem({
          camera: params.camera, // Camera reference for perspective
          parent: params.scene, // The parent scene to attach particles
          texture: './resources/textures/ball.png', // Texture used for particles
      });

      // Define the alpha (transparency) behavior of particles over time
      this._particles._alphaSpline.AddPoint(0.0, 0.0); // Start with fully transparent particles
      this._particles._alphaSpline.AddPoint(0.1, 1.0); // Particles become fully opaque quickly
      this._particles._alphaSpline.AddPoint(0.7, 1.0); // Keep particles opaque for a while
      this._particles._alphaSpline.AddPoint(1.0, 0.0); // Fade out particles over time

      // Define the color behavior of particles over time
      this._particles._colourSpline.AddPoint(0.0, new THREE.Color(0x00FF00)); // Start with green color
      this._particles._colourSpline.AddPoint(0.5, new THREE.Color(0x40C040)); // Transition to a darker green
      this._particles._colourSpline.AddPoint(1.0, new THREE.Color(0xFF4040)); // End with red color

      // Define the size behavior of particles over time
      this._particles._sizeSpline.AddPoint(0.0, 0.05); // Start with small particles
      this._particles._sizeSpline.AddPoint(0.5, 0.25); // Particles grow in size
      this._particles._sizeSpline.AddPoint(1.0, 0.0); // Particles shrink to nothing as they fade out
    }

    // Method to initialize the component (create and add particles)
    InitComponent() {
      this._particles.AddParticles(this._parent._position, 300); // Add 300 particles at the entity's position
    }
   
    // Method to update the component on each frame (handle particle movement and removal)
    Update(timeElapsed) {
      this._particles.Step(timeElapsed); // Update particle system with the time elapsed

      // If all particles have been removed (i.e., the visual effect is done)
      if (this._particles._particles.length == 0) {
        this._parent.SetActive(false); // Deactivate the level-up component (or entity)
      }
    }
  }
  
  // Return the level-up component and spawner classes for external use
  return {
      LevelUpComponent: LevelUpComponent,
      LevelUpComponentSpawner: LevelUpComponentSpawner,
  };
})();
