import { entity } from './entity.js';

// The inventory_controller module handles inventory functionality and item management
export const inventory_controller = (() => {

  // InventoryController class manages the player's inventory and equipped items
  class InventoryController extends entity.Component {
    constructor(params) {
      super();

      // Initialize an empty inventory with 24 slots for items and 8 slots for equipment
      this._inventory = {};
      
      // Create 24 inventory slots for regular items
      for (let i = 1; i <= 24; ++i) {
        this._inventory['inventory-' + i] = {
          type: 'inventory',  // type: regular inventory slot
          value: null,         // initially no item
        };
      }

      // Create 8 inventory slots for equipment items
      for (let i = 1; i <= 8; ++i) {
        this._inventory['inventory-equip-' + i] = {
          type: 'equip',      // type: equipment slot
          value: null,        // initially no equipment
        };
      }
    }

    // Initializes the component, sets up event handlers for drag-and-drop functionality
    InitComponent() {
      // Register a handler for when an item is added to the inventory
      this._RegisterHandler('inventory.add', (m) => this._OnInventoryAdded(m));

      // Helper function to set up drag-and-drop functionality on inventory elements
      const _SetupElement = (n) => {
        const element = document.getElementById(n);
        
        // Handle drag start event
        element.ondragstart = (ev) => {
          ev.dataTransfer.setData('text/plain', n);  // Set data to transfer (item ID)
        };

        // Handle drag over event (allow dropping)
        element.ondragover = (ev) => {
          ev.preventDefault();  // Prevent default behavior to allow drop
        };

        // Handle drop event
        element.ondrop = (ev) => {
          ev.preventDefault();  // Prevent default behavior
          const data = ev.dataTransfer.getData('text/plain');  // Get dragged item data
          const other = document.getElementById(data);  // Get the dropped item element
  
          // Handle item drop (swap items between slots)
          this._OnItemDropped(other, element);
        };
      }

      // Set up all inventory and equipment slots with drag-and-drop handlers
      for (let k in this._inventory) {
        _SetupElement(k);
      }
    }

    // Handles swapping items between slots when dropped
    _OnItemDropped(oldElement, newElement) {
      const oldItem = this._inventory[oldElement.id];  // Get the old item's data
      const newItem = this._inventory[newElement.id];  // Get the new item's data

      const oldValue = oldItem.value;  // Value of the old item
      const newValue = newItem.value;  // Value of the new item

      // Swap items between the old and new slots
      this._SetItemAtSlot(oldElement.id, newValue);
      this._SetItemAtSlot(newElement.id, oldValue);

      // If the item was equipment, notify that it's been removed from the inventory
      if (newItem.type == 'equip') {
        this.Broadcast({
          topic: 'inventory.equip',  // Topic: equipment management
          value: oldValue,           // Item being removed from equipment
          added: false,              // Item removed from equipment
        });
      }
    }

    // Sets an item in the specified inventory slot
    _SetItemAtSlot(slot, itemName) {
      const div = document.getElementById(slot);  // Get the inventory slot element
      const obj = this.FindEntity(itemName);     // Find the entity with the given item name
      if (obj) {
        const item = obj.GetComponent('InventoryItem');  // Get the inventory item component
        const path = './resources/icons/weapons/' + item.RenderParams.icon;  // Get the item's icon path
        div.style.backgroundImage = "url('" + path + "')";  // Set the slot's background image to the item's icon
      } else {
        div.style.backgroundImage = '';  // Remove background if no item is found
      }
      this._inventory[slot].value = itemName;  // Update the slot's value
    }

    // Handles adding an item to the inventory
    _OnInventoryAdded(msg) {
      for (let k in this._inventory) {
        if (!this._inventory[k].value && this._inventory[k].type == 'inventory') {
          // Find the first available inventory slot and add the item
          this._inventory[k].value = msg.value;
          msg.added = true;  // Mark the item as added

          // Set the item in the found slot
          this._SetItemAtSlot(k, msg.value);
  
          break;
        }
      }
    }

    // Retrieves an item by its name from the inventory
    GetItemByName(name) {
      for (let k in this._inventory) {
        if (this._inventory[k].value == name) {
          return this.FindEntity(name);  // Return the item entity by name
        }
      }
      return null;  // Return null if the item is not found
    }
  };

  // InventoryItem class represents an individual item in the inventory
  class InventoryItem extends entity.Component {
    constructor(params) {
      super();
      this._params = params;  // Store the item parameters
    }

    InitComponent() {}  // No initialization needed for now

    // Getter for the item parameters
    get Params() {
      return this._params;
    }

    // Getter for the item's render parameters (e.g., icon)
    get RenderParams() {
      return this._params.renderParams;
    }
  };

  // Return the InventoryController and InventoryItem classes as part of the module
  return {
    InventoryController: InventoryController,
    InventoryItem: InventoryItem,
  };
})();
