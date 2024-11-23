// Importing the THREE.js library to handle 3D rendering
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

// Importing the entity module (likely handles entities in the game)
import {entity} from "./entity.js";

// The player_input module encapsulates all the functionality related to player input handling
export const player_input = (() => {

  // PickableComponent class allows entities to be interactable or pickable by the player
  class PickableComponent extends entity.Component {
    constructor() {
      super();
    }

    InitComponent() {
      // Initialization logic for PickableComponent (currently empty)
    }
  };

  // BasicCharacterControllerInput class handles keyboard and mouse input for controlling a character
  class BasicCharacterControllerInput extends entity.Component {
    constructor(params) {
      super();
      this._params = params; // Stores input parameters such as camera and other relevant data
      this._Init(); // Calls the internal _Init function to initialize controls
    }
  
    // Initializes the input handling setup
    _Init() {
      // Mapping the keys for character movement and actions
      this._keys = {
        forward: false,  // 'W' key for moving forward
        backward: false, // 'S' key for moving backward
        left: false,     // 'A' key for moving left
        right: false,    // 'D' key for moving right
        space: false,    // SPACE key for jumping or other actions
        shift: false,    // SHIFT key for sprinting or other special actions
      };

      // Initializes a raycaster for picking up objects in the scene
      this._raycaster = new THREE.Raycaster();

      // Adds event listeners for keyboard and mouse input
      document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
      document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
      document.addEventListener('mouseup', (e) => this._onMouseUp(e), false);
    }
  
    // Handles mouse button release (mouseup) event to pick up objects in the game world
    _onMouseUp(event) {
      // Gets the mouse position relative to the canvas element
      const rect = document.getElementById('threejs').getBoundingClientRect();
      const pos = {
        x: ((event.clientX - rect.left) / rect.width) * 2  - 1,  // Normalize x position
        y: ((event.clientY - rect.top ) / rect.height) * -2 + 1,  // Normalize y position
      };

      // Sets up the raycaster from the camera's perspective
      this._raycaster.setFromCamera(pos, this._params.camera);

      // Filters all pickable entities from the parent entity's children
      const pickables = this._parent._parent.Filter((e) => {
        const p = e.GetComponent('PickableComponent'); // Checks if the entity has a PickableComponent
        if (!p) {
          return false; // Exclude entities that are not pickable
        }
        return e._mesh; // Only include entities with a mesh
      });

      const ray = new THREE.Ray();
      // Set the ray's origin from the camera's world position
      ray.origin.setFromMatrixPosition(this._params.camera.matrixWorld);
      // Set the ray's direction from the camera's view using normalized mouse position
      ray.direction.set(pos.x, pos.y, 0.5).unproject(this._params.camera).sub(ray.origin).normalize();

      // Hide the quest UI while the player interacts with objects (hacky way)
      document.getElementById('quest-ui').style.visibility = 'hidden';

      // Loop through all pickable entities and check for intersections with the ray
      for (let p of pickables) {
        const box = new THREE.Box3().setFromObject(p._mesh); // Create a bounding box for the entity's mesh
        if (ray.intersectsBox(box)) {
          // If the ray intersects the entity's bounding box, broadcast the input picked event
          p.Broadcast({
              topic: 'input.picked'
          });
          break; // Only pick the first entity
        }
      }
    }

    // Handles keydown events for movement controls
    _onKeyDown(event) {
      switch (event.keyCode) {
        case 87: // 'W' key
          this._keys.forward = true;
          break;
        case 65: // 'A' key
          this._keys.left = true;
          break;
        case 83: // 'S' key
          this._keys.backward = true;
          break;
        case 68: // 'D' key
          this._keys.right = true;
          break;
        case 32: // SPACE key
          this._keys.space = true;
          break;
        case 16: // SHIFT key
          this._keys.shift = true;
          break;
      }
    }
  
    // Handles keyup events to stop character movement when keys are released
    _onKeyUp(event) {
      switch(event.keyCode) {
        case 87: // 'W' key
          this._keys.forward = false;
          break;
        case 65: // 'A' key
          this._keys.left = false;
          break;
        case 83: // 'S' key
          this._keys.backward = false;
          break;
        case 68: // 'D' key
          this._keys.right = false;
          break;
        case 32: // SPACE key
          this._keys.space = false;
          break;
        case 16: // SHIFT key
          this._keys.shift = false;
          break;
      }
    }
  };

  // Return the classes for external use
  return {
    BasicCharacterControllerInput: BasicCharacterControllerInput,
    PickableComponent: PickableComponent,
  };

})();
