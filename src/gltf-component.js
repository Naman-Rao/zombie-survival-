// Import required modules from Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

// Import GLTFLoader and FBXLoader for loading 3D models
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

// Import custom entity module
import {entity} from './entity.js';

// Exporting the GLTF component module
export const gltf_component = (() => {

  // StaticModelComponent class handles loading and rendering of static models
  class StaticModelComponent extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);
    }
  
    // Initialize the component with parameters
    _Init(params) {
      this._params = params;
      this._LoadModels(); // Load the models based on parameters
    }
  
    // Register event handlers for position updates
    InitComponent() {
      this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
    }

    // Updates the position of the model when an event is triggered
    _OnPosition(m) {
      if (this._target) {
        this._target.position.copy(m.value);
      }
    }

    // Determines which type of model to load (GLB/GLTF or FBX)
    _LoadModels() {
      if (this._params.resourceName.endsWith('glb') || this._params.resourceName.endsWith('gltf')) {
        this._LoadGLB();
      } else if (this._params.resourceName.endsWith('fbx')) {
        this._LoadFBX();
      }
    }

    // Handles the model after it's loaded into the scene
    _OnLoaded(obj) {
      this._target = obj;
      this._params.scene.add(this._target); // Add the model to the scene

      // Scale and position the model
      this._target.scale.setScalar(this._params.scale);
      this._target.position.copy(this._parent._position);

      // Load and apply a texture if specified
      let texture = null;
      if (this._params.resourceTexture) {
        const texLoader = new THREE.TextureLoader();
        texture = texLoader.load(this._params.resourceTexture);
        texture.encoding = THREE.sRGBEncoding;
      }

      // Apply material settings and shadow properties to all child objects
      this._target.traverse(c => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            if (texture) {
              m.map = texture;
            }
            if (this._params.specular) {
              m.specular = this._params.specular;
            }
            if (this._params.emissive) {
              m.emissive = this._params.emissive;
            }
          }
        }

        if (this._params.receiveShadow != undefined) {
          c.receiveShadow = this._params.receiveShadow;
        }
        if (this._params.castShadow != undefined) {
          c.castShadow = this._params.castShadow;
        }
        if (this._params.visible != undefined) {
          c.visible = this._params.visible;
        }
      });
    }

    // Load GLTF/GLB models
    _LoadGLB() {
      const loader = new GLTFLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (glb) => {
        this._OnLoaded(glb.scene);
      });
    }

    // Load FBX models
    _LoadFBX() {
      const loader = new FBXLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (fbx) => {
        this._OnLoaded(fbx);
      });
    }

    // Update method (empty for now)
    Update(timeInSeconds) {}
  };

  // AnimatedModelComponent class handles loading and rendering of animated models
  class AnimatedModelComponent extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);
    }
  
    // Register event handlers for position updates
    InitComponent() {
      this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
    }

    // Updates the position of the model when an event is triggered
    _OnPosition(m) {
      if (this._target) {
        this._target.position.copy(m.value);
        this._target.position.y = 0.35; // Offset the Y position slightly
      }
    }

    // Initialize the component with parameters
    _Init(params) {
      this._params = params;
      this._LoadModels(); // Load the models based on parameters
    }
  
    // Determines which type of model to load (GLB/GLTF or FBX)
    _LoadModels() {
      if (this._params.resourceName.endsWith('glb') || this._params.resourceName.endsWith('gltf')) {
        this._LoadGLB();
      } else if (this._params.resourceName.endsWith('fbx')) {
        this._LoadFBX();
      }
    }

    // Handles the model and animations after they are loaded into the scene
    _OnLoaded(obj, animations) {
      this._target = obj;
      this._params.scene.add(this._target);

      // Scale and position the model
      this._target.scale.setScalar(this._params.scale);
      this._target.position.copy(this._parent._position);

      // Notify other components about the position
      this.Broadcast({
        topic: 'update.position',
        value: this._parent._position,
      });

      // Load and apply a texture if specified
      let texture = null;
      if (this._params.resourceTexture) {
        const texLoader = new THREE.TextureLoader();
        texture = texLoader.load(this._params.resourceTexture);
        texture.encoding = THREE.sRGBEncoding;
      }

      // Apply material settings and shadow properties to all child objects
      this._target.traverse(c => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            if (texture) {
              m.map = texture;
            }
            if (this._params.specular) {
              m.specular = this._params.specular;
            }
            if (this._params.emissive) {
              m.emissive = this._params.emissive;
            }
          }
        }

        if (this._params.receiveShadow != undefined) {
          c.receiveShadow = this._params.receiveShadow;
        }
        if (this._params.castShadow != undefined) {
          c.castShadow = this._params.castShadow;
        }
        if (this._params.visible != undefined) {
          c.visible = this._params.visible;
        }
      });

      // Load animations and play them
      const _OnLoad = (anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);
        action.play();
      };

      const loader = new FBXLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceAnimation, (a) => { _OnLoad(a); });

      // Initialize the animation mixer
      this._mixer = new THREE.AnimationMixer(this._target);

      // Notify other components about the loaded character model
      this._parent._mesh = this._target;
      this.Broadcast({
          topic: 'load.character',
          model: this._target,
      });
    }

    // Load GLTF/GLB models with animations
    _LoadGLB() {
      const loader = new GLTFLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (glb) => {
        this._OnLoaded(glb.scene, glb.animations);
      });
    }

    // Load FBX models with animations
    _LoadFBX() {
      const loader = new FBXLoader();
      loader.setPath(this._params.resourcePath);
      loader.load(this._params.resourceName, (fbx) => {
        this._OnLoaded(fbx);
      });
    }

    // Update the animation mixer to play animations
    Update(timeInSeconds) {
      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }
    }
  };

  // Exporting the components for static and animated models
  return {
      StaticModelComponent: StaticModelComponent,
      AnimatedModelComponent: AnimatedModelComponent,
  };

})();
