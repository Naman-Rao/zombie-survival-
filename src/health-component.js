import { entity } from "./entity.js";

// Health component module
export const health_component = (() => {

  // HealthComponent class, extends from entity.Component
  class HealthComponent extends entity.Component {
    // Constructor accepts parameters to set initial health values and other attributes
    constructor(params) {
      super();  // Calls the parent constructor
      this._health = params.health;  // Current health value
      this._maxHealth = params.maxHealth;  // Maximum health value
      this._params = params;  // Stores additional parameters like strength, wisdom, etc.
    }

    // Initialization method to register handlers for events
    InitComponent() {
      // Register handlers for health-related events
      this._RegisterHandler('health.damage', (m) => this._OnDamage(m));  // Handles damage
      this._RegisterHandler('health.add-experience', (m) => this._OnAddExperience(m));  // Handles experience gain

      this._UpdateUI();  // Updates the UI based on the current health status
    }

    // Method to check if the entity is still alive
    IsAlive() {
      return this._health > 0;  // Alive if health is greater than 0
    }

    // Updates the UI elements related to health and stats
    _UpdateUI() {
      // If UI update flag is not set, return
      if (!this._params.updateUI) {
        return;
      }

      // Get the health bar DOM element
      const bar = document.getElementById('health-bar');

      // Calculate health percentage and update health bar width
      const healthAsPercentage = this._health / this._maxHealth;
      bar.style.width = Math.floor(200 * healthAsPercentage) + 'px';

      // Update the stats displayed on the UI
      document.getElementById('stats-strength').innerText = this._params.strength;
      document.getElementById('stats-wisdomness').innerText = this._params.wisdomness;
      document.getElementById('stats-benchpress').innerText = this._params.benchpress;
      document.getElementById('stats-curl').innerText = this._params.curl;
      document.getElementById('stats-experience').innerText = this._params.experience;
    }

    // Computes the experience required to level up based on the current level
    _ComputeLevelXPRequirement() {
      const level = this._params.level;
      // Simple calculation for required XP: 2^(level-1) * 100
      const xpRequired = Math.round(2 ** (level - 1) * 100);
      return xpRequired;
    }

    // Event handler when experience is added
    _OnAddExperience(msg) {
      this._params.experience += msg.value;  // Add experience value to current experience
      const requiredExperience = this._ComputeLevelXPRequirement();  // Get XP required for next level

      // If current experience is less than required, exit
      if (this._params.experience < requiredExperience) {
        return;
      }

      // Level up the character and increase their stats
      this._params.level += 1;
      this._params.strength += 1;
      this._params.wisdomness += 1;
      this._params.benchpress += 1;
      this._params.curl += 2;  // Curl stat increases more than others on level up

      // Spawn level-up effects (e.g., particles, visual feedback)
      const spawner = this.FindEntity('level-up-spawner').GetComponent('LevelUpComponentSpawner');
      spawner.Spawn(this._parent._position);

      // Broadcast level-up event to notify other components
      this.Broadcast({
        topic: 'health.levelGained',
        value: this._params.level,
      });

      this._UpdateUI();  // Update the UI after leveling up
    }

    // Event handler for the death of the entity
    _OnDeath(attacker) {
      if (attacker) {
        // If an attacker exists, award them experience based on the entity's level
        attacker.Broadcast({
          topic: 'health.add-experience',
          value: this._params.level * 100,
        });
      }
      // Broadcast the death event to notify other components
      this.Broadcast({
        topic: 'health.death',
      });
    }

    // Event handler for taking damage
    _OnDamage(msg) {
      // Reduce health based on the damage value, but ensure it doesn't go below 0
      this._health = Math.max(0.0, this._health - msg.value);

      // If health reaches 0, trigger death logic
      if (this._health == 0) {
        this._OnDeath(msg.attacker);
      }

      // Broadcast health update to notify other components
      this.Broadcast({
        topic: 'health.update',
        health: this._health,
        maxHealth: this._maxHealth,
      });

      this._UpdateUI();  // Update the UI after taking damage
    }
  };

  // Return the HealthComponent class as part of the module's public API
  return {
    HealthComponent: HealthComponent,
  };

})();
