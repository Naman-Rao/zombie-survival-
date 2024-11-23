import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { entity } from './entity.js';

export const third_person_camera = (() => {
  
  // Defining a class ThirdPersonCamera that extends entity.Component.
  class ThirdPersonCamera extends entity.Component {
    constructor(params) {
      super(); // Call the parent class constructor

      this._params = params; // Store the parameters passed to the constructor
      this._camera = params.camera; // Store the camera object

      // Initialize current position and lookat vectors.
      this._currentPosition = new THREE.Vector3();
      this._currentLookat = new THREE.Vector3();
    }

    // Calculate the ideal offset of the camera relative to the target
    _CalculateIdealOffset() {
      const idealOffset = new THREE.Vector3(-0, 10, -15); // Define an offset position
      idealOffset.applyQuaternion(this._params.target._rotation); // Apply the target's rotation to the offset
      idealOffset.add(this._params.target._position); // Add the target's position to the offset
      return idealOffset; // Return the final ideal offset
    }

    // Calculate the ideal look-at position for the camera
    _CalculateIdealLookat() {
      const idealLookat = new THREE.Vector3(0, 5, 20); // Define a target position to look at
      idealLookat.applyQuaternion(this._params.target._rotation); // Apply the target's rotation to the look-at position
      idealLookat.add(this._params.target._position); // Add the target's position to the look-at position
      return idealLookat; // Return the final ideal look-at position
    }

    // Update method to be called on each frame
    Update(timeElapsed) {
      // Calculate the ideal offset and ideal look-at positions
      const idealOffset = this._CalculateIdealOffset();
      const idealLookat = this._CalculateIdealLookat();

      // Interpolation factor 't' that smoothens the transition, based on timeElapsed
      // This can control how quickly the camera transitions to the new position/look-at
      const t = 1.0 - Math.pow(0.01, timeElapsed); // Use exponential smoothing to control the speed of transition

      // Lerp (Linear Interpolation) the current position and look-at towards the ideal values
      this._currentPosition.lerp(idealOffset, t);
      this._currentLookat.lerp(idealLookat, t);

      // Update the camera's position and direction (look-at)
      this._camera.position.copy(this._currentPosition);
      this._camera.lookAt(this._currentLookat);
    }
  }

  // Return an object that exposes the ThirdPersonCamera class
  return {
    ThirdPersonCamera: ThirdPersonCamera
  };

})();
