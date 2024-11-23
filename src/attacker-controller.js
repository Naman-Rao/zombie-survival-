// Importing the necessary libraries and modules
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {entity} from './entity.js';
import {math} from './math.js';

// Define the attack_controller module
export const attack_controller = (() => {

  // Class for controlling attack logic
  class AttackController extends entity.Component {
    constructor(params) {
      super(); // Call the parent class constructor
      this._params = params; // Parameters for the attack
      this._timeElapsed = 0.0; // Time elapsed since the last action
      this._action = null; // Current action being performed
    }

    // Initialize the component and register event handlers
    InitComponent() {
      // Register a handler for the "player.action" event
      this._RegisterHandler('player.action', (m) => { this._OnAnimAction(m); });
    }

    // Method triggered when a player performs an animation action
    _OnAnimAction(m) {
      // Update the current action and reset the timer if the action has changed
      if (m.action != this._action) {
        this._action = m.action;
        this._timeElapsed = 0.0;
      }

      // Store the old timing and update the elapsed time
      const oldTiming = this._timeElapsed;
      this._timeElapsed = m.time;

      // Check if the attack action timing has been reached
      if (oldTiming < this._params.timing && this._timeElapsed >= this._params.timing) {
        // Get the player's inventory and equipped weapon
        const inventory = this.GetComponent('InventoryController');
        const equip = this.GetComponent('EquipWeapon');
        let item = null;

        // Retrieve the item component of the equipped weapon
        if (equip) {
          item = inventory.GetItemByName(equip.Name);
          if (item) {
            item = item.GetComponent('InventoryItem');
          }
        }

        // Get nearby entities from the spatial grid
        const grid = this.GetComponent('SpatialGridController');
        const nearby = grid.FindNearbyEntities(2); // Find entities within a radius of 2 units

        // Filter entities to find those that are attackable
        const _Filter = (c) => {
          // Exclude the player itself
          if (c.entity == this._parent) {
            return false;
          }

          // Exclude entities without a health component or that are not alive
          const h = c.entity.GetComponent('HealthComponent');
          if (!h) {
            return false;
          }

          return h.IsAlive();
        };

        // List of attackable entities
        const attackable = nearby.filter(_Filter);

        // Process each attackable entity
        for (let a of attackable) {
          const target = a.entity;

          // Calculate the direction to the target
          const dirToTarget = target._position.clone().sub(this._parent._position);
          dirToTarget.normalize();

          // Calculate the forward direction of the player
          const forward = new THREE.Vector3(0, 0, 1);
          forward.applyQuaternion(this._parent._rotation);
          forward.normalize();

          // Calculate the base damage of the attack
          let damage = this.GetComponent('HealthComponent')._params.strength;
          if (item) {
            // Adjust damage based on the weapon's damage multiplier
            damage *= item.Params.damage;
            damage = Math.round(damage); // Round damage to the nearest integer
          }

          // Calculate the dot product to check if the target is in front
          const dot = forward.dot(dirToTarget);
          if (math.in_range(dot, 0.9, 1.1)) {
            // Apply damage to the target if within range
            target.Broadcast({
              topic: 'health.damage', // Broadcast a health damage event
              value: damage,          // Damage value
              attacker: this._parent, // Attacker entity
            });
          }
        }
      }
    }
  };

  // Export the AttackController class
  return {
      AttackController: AttackController,
  };
})();
