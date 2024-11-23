import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

import {finite_state_machine} from './finite-state-machine.js';
import {entity} from './entity.js';
import {player_entity} from './player-entity.js'
import {player_state} from './player-state.js';

export const npc_entity = (() => {
  
  // AIInput: This class handles the input states for the NPC's actions
  class AIInput {
    constructor() {
      this._Init();    
    }

    _Init() {
      // Initialize input states to track movement and actions
      this._keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        space: false,
        shift: false,
      };
    }
  };

  // NPCFSM: Finite State Machine for the NPC's behavior states
  class NPCFSM extends finite_state_machine.FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this._Init();
    }

    _Init() {
      // Add states to the finite state machine for idle, walk, death, and attack
      this._AddState('idle', player_state.IdleState);
      this._AddState('walk', player_state.WalkState);
      this._AddState('death', player_state.DeathState);
      this._AddState('attack', player_state.AttackState);
    }
  };

  // NPCController: Component that controls the NPC's behavior, movement, and animations
  class NPCController extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);
    }

    _Init(params) {
      // Initialize the NPC controller with parameters and set up variables
      this._params = params;
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0); // Deceleration vector
      this._acceleration = new THREE.Vector3(1, 0.25, 40.0); // Acceleration vector
      this._velocity = new THREE.Vector3(0, 0, 0); // Current velocity of the NPC
      this._position = new THREE.Vector3(); // Position of the NPC

      this._animations = {}; // Store animations for different actions
      this._input = new AIInput(); // AI input handler for NPC movement
      // FIXME: State machine to control NPC behavior using animations
      this._stateMachine = new NPCFSM(
          new player_entity.BasicCharacterControllerProxy(this._animations));

      this._LoadModels(); // Load models (e.g., NPC mesh and animations)
    }

    InitComponent() {
      // Register event handlers for health and position updates
      this._RegisterHandler('health.death', (m) => { this._OnDeath(m); });
      this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
    }

    // Event handler for NPC death
    _OnDeath(msg) {
      this._stateMachine.SetState('death'); // Transition to death state
    }

    // Event handler for position updates
    _OnPosition(m) {
      if (this._target) {
        this._target.position.copy(m.value); // Update NPC position
        this._target.position.y = 0.35; // Set height
      }
    }

    // Load NPC models and animations using FBXLoader
    _LoadModels() {
      const loader = new FBXLoader();
      loader.setPath('./resources/monsters/FBX/');
      loader.load(this._params.resourceName, (glb) => {
        this._target = glb;
        this._params.scene.add(this._target); // Add the NPC model to the scene

        this._target.scale.setScalar(0.025); // Scale the model
        this._target.position.copy(this._parent._position);
        this._target.position.y += 0.35; // Adjust position height
        const texLoader = new THREE.TextureLoader();
        const texture = texLoader.load(
            './resources/monsters/Textures/' + this._params.resourceTexture); // Load NPC texture
        texture.encoding = THREE.sRGBEncoding;
        texture.flipY = true;

        // Traverse through the model and apply texture and shadows
        this._target.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
          if (c.material) {
            c.material.map = texture;
            c.material.side = THREE.DoubleSide;
          }
        });

        this._mixer = new THREE.AnimationMixer(this._target); // Set up the animation mixer

        const fbx = glb;
        const _FindAnim = (animName) => {
          for (let i = 0; i < fbx.animations.length; i++) {
            if (fbx.animations[i].name.includes(animName)) {
              const clip = fbx.animations[i];
              const action = this._mixer.clipAction(clip); // Get animation clip and action
              return {
                clip: clip,
                action: action
              }
            }
          }
          return null;
        };

        // Assign animations to states
        this._animations['idle'] = _FindAnim('Idle');
        this._animations['walk'] = _FindAnim('Walk');
        this._animations['death'] = _FindAnim('Death');
        this._animations['attack'] = _FindAnim('Bite_Front');

        this._stateMachine.SetState('idle'); // Start in idle state
      });
    }

    // Getter for the NPC's position
    get Position() {
      return this._position;
    }

    // Getter for the NPC's rotation
    get Rotation() {
      if (!this._target) {
        return new THREE.Quaternion();
      }
      return this._target.quaternion;
    }

    // Check for intersections with nearby entities
    _FindIntersections(pos) {
      const _IsAlive = (c) => {
        const h = c.entity.GetComponent('HealthComponent');
        if (!h) {
          return true;
        }
        return h._health > 0; // Entity is alive if health > 0
      };

      const grid = this.GetComponent('SpatialGridController');
      const nearby = grid.FindNearbyEntities(2).filter(e => _IsAlive(e)); // Find nearby entities
      const collisions = [];

      // Check for collision with entities within range (distance <= 4)
      for (let i = 0; i < nearby.length; ++i) {
        const e = nearby[i].entity;
        const d = ((pos.x - e._position.x) ** 2 + (pos.z - e._position.z) ** 2) ** 0.5;

        if (d <= 4) {
          collisions.push(nearby[i].entity);
        }
      }
      return collisions;
    }

    // Find the player by checking if the player is alive
    _FindPlayer(pos) {
      const _IsAlivePlayer = (c) => {
        const h = c.entity.GetComponent('HealthComponent');
        if (!h) {
          return false;
        }
        if (c.entity.Name != 'player') {
          return false;
        }
        return h._health > 0; // Player is alive if health > 0
      };

      const grid = this.GetComponent('SpatialGridController');
      const nearby = grid.FindNearbyEntities(100).filter(c => _IsAlivePlayer(c));

      if (nearby.length == 0) {
        return new THREE.Vector3(0, 0, 0); // Return zero vector if no player found
      }

      const dir = this._parent._position.clone();
      dir.sub(nearby[0].entity._position); // Calculate direction to player
      dir.y = 0.0; // Flatten on the y-axis
      dir.normalize();

      return dir;
    }

    // Update the NPC AI based on the current time
    _UpdateAI(timeInSeconds) {
      const currentState = this._stateMachine._currentState;
      if (currentState.Name != 'walk' &&
          currentState.Name != 'run' &&
          currentState.Name != 'idle') {
        return;
      }

      if (currentState.Name == 'death') {
        return;
      }

      if (currentState.Name == 'idle' ||
          currentState.Name == 'walk') {
        this._OnAIWalk(timeInSeconds); // Perform walking behavior
      }
    }

    // Handle NPC movement when walking
    _OnAIWalk(timeInSeconds) {
      const dirToPlayer = this._FindPlayer(); // Find direction to player

      const velocity = this._velocity;
      const frameDecceleration = new THREE.Vector3(
          velocity.x * this._decceleration.x,
          velocity.y * this._decceleration.y,
          velocity.z * this._decceleration.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
          Math.abs(frameDecceleration.z), Math.abs(velocity.z));
  
      velocity.add(frameDecceleration); // Apply deceleration

      const controlObject = this._target;
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = controlObject.quaternion.clone();
  
      this._velocity = velocity;

      if (this._stateMachine._currentState.Name == 'walk') {
        this._velocity = this._velocity.multiply(this._acceleration); // Apply acceleration during walking
      }
    }

    Update(timeInSeconds) {
      this._UpdateAI(timeInSeconds); // Update NPC behavior based on AI
    }
  }

  return {
    NPCController: NPCController, // Export the NPC controller for external usage
  };
})();
