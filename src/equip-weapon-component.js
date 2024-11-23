// Importing the base entity class
import {entity} from './entity.js';

// Importing the FBXLoader from the Three.js library
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

// Define the equip_weapon_component namespace
export const equip_weapon_component = (() => {

  // EquipWeapon class handles equipping and attaching weapons to a character
  class EquipWeapon extends entity.Component {
    constructor(params) {
      super();
      // Store the parameters needed for this component
      this._params = params;
      this._target = null; // The currently equipped weapon's 3D model
      this._name = null;   // Name of the currently equipped weapon
    }

    // Initializes the component by registering event handlers
    InitComponent() {
      this._RegisterHandler('load.character', (m) => this._OnCharacterLoaded(m));
      this._RegisterHandler('inventory.equip', (m) => this._OnEquip(m));
    }

    // Getter for the name of the equipped weapon
    get Name() {
      return this._name;
    }

    // Handles the event when the character's model is loaded
    _OnCharacterLoaded(msg) {
      this._bones = msg.bones; // Get the character's bones for attaching the weapon
      this._AttachTarget();    // Attach the weapon (if it exists) to the correct bone
    }

    // Attaches the weapon model to the specified bone in the character's skeleton
    _AttachTarget() {
      if (this._bones && this._target) {
        // Add the weapon model to the specified anchor bone
        this._bones[this._params.anchor].add(this._target);
      }
    }

    // Handles the event to equip a new weapon
    _OnEquip(msg) {
      if (msg.value == this._name) {
        // If the new weapon is the same as the current one, do nothing
        return;
      }

      // If there's already a weapon equipped, unload it
      if (this._target) {
        this._UnloadModels();
      }

      // Get the InventoryController component to retrieve item details
      const inventory = this.GetComponent('InventoryController');
      const item = inventory.GetItemByName(msg.value).GetComponent('InventoryItem');
      this._name = msg.value; // Update the name of the equipped weapon

      // Load the 3D model of the new weapon and attach it
      this._LoadModels(item, () => {
        this._AttachTarget();
      });
    }

    // Unloads the currently equipped weapon's model
    _UnloadModels() {
      if (this._target) {
        // Remove the weapon model from its parent (the bone it was attached to)
        this._target.parent.remove(this._target);
        // Free the reference to the weapon model
        this._target = null;
      }
    }

    // Loads the 3D model for the new weapon
    _LoadModels(item, cb) {
      const loader = new FBXLoader(); // Create an FBXLoader instance
      loader.setPath('./resources/weapons/FBX/'); // Set the path to the weapon models

      // Load the FBX file for the weapon
      loader.load(item.RenderParams.name + '.fbx', (fbx) => {
        this._target = fbx; // Store the loaded weapon model
        // Set the scale and orientation of the weapon model
        this._target.scale.setScalar(item.RenderParams.scale);
        this._target.rotateY(Math.PI); // Rotate 180 degrees
        this._target.rotateX(-Math.PI / 3); // Slight downward tilt
        this._target.rotateY(-1); // Additional rotation adjustment

        // Enable shadows for all parts of the weapon model
        this._target.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
        });

        // Call the callback function after loading the model
        cb();

        // Broadcast an event to notify other components that a weapon has been loaded
        this.Broadcast({
            topic: 'load.weapon',
            model: this._target,  // The loaded weapon model
            bones: this._bones,  // The character's bones
        });
      });
    }
  };

  // Return the EquipWeapon class as part of the module
  return {
      EquipWeapon: EquipWeapon,
  };
})();
