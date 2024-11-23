// Import the 'entity' module, which likely contains base entity definitions or components
import {entity} from './entity.js';

// Create the spatial_grid_controller module, which manages spatial grid-based entity interactions
export const spatial_grid_controller = (() => {

  // Define the SpatialGridController class that extends entity.Component
  class SpatialGridController extends entity.Component {
    // Constructor to initialize the controller with parameters
    constructor(params) {
      super();  // Call the parent class constructor (entity.Component)

      // Store the grid passed in the parameters
      this._grid = params.grid;
    }

    // Method to initialize the component
    InitComponent() {
      // Get the position of the parent entity, specifically x and z coordinates
      const pos = [
          this._parent._position.x,
          this._parent._position.z,
      ];

      // Create a new client for this entity in the grid, passing the position and a size (1, 1)
      this._client = this._grid.NewClient(pos, [1, 1]);

      // Link the client to this entity
      this._client.entity = this._parent;

      // Register an event handler for the 'update.position' event to handle position updates
      this._RegisterHandler('update.position', (m) => this._OnPosition(m));
    }

    // Event handler to update the client's position in the grid when the entity's position changes
    _OnPosition(msg) {
      // Update the client's position based on the message data (x and z coordinates)
      this._client.position = [msg.value.x, msg.value.z];

      // Update the client in the grid with the new position
      this._grid.UpdateClient(this._client);
    }

    // Method to find entities within a specified range of the current entity
    FindNearbyEntities(range) {
      // Use the grid to find nearby entities based on the current position and the given range
      const results = this._grid.FindNear(
          [this._parent._position.x, this._parent._position.z], [range, range]);
          
      // Filter out the current entity itself from the results and return the remaining entities
      return results.filter(c => c.entity != this._parent);
    }
  };

  // Return an object with the SpatialGridController to expose it to other modules
  return {
      SpatialGridController: SpatialGridController,
  };
})();
