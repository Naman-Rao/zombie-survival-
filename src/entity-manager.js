export const entity_manager = (() => {
  // EntityManager class manages a collection of entities, allowing for addition, removal, filtering, and updating.
  class EntityManager {
    constructor() {
      this._ids = 0; // Counter to generate unique IDs for entities.
      this._entitiesMap = {}; // A map to store entities with their names as keys for quick access.
      this._entities = []; // A list to store all entities for iteration and updates.
    }

    // Generates a unique name for an entity based on an internal counter.
    _GenerateName() {
      this._ids += 1; // Increment the counter.
      return '__name__' + this._ids; // Return a unique name string.
    }

    // Retrieves an entity by its name from the entities map.
    Get(n) {
      return this._entitiesMap[n];
    }

    // Filters entities based on a callback function.
    // The callback function determines whether an entity should be included in the result.
    Filter(cb) {
      return this._entities.filter(cb);
    }

    // Adds a new entity to the manager.
    // If no name is provided, a unique name is generated.
    Add(e, n) {
      if (!n) { // Check if a name is not provided.
        n = this._GenerateName(); // Generate a unique name.
      }

      // Add the entity to the map and the list.
      this._entitiesMap[n] = e;
      this._entities.push(e);

      // Set the parent manager and the name of the entity.
      e.SetParent(this);
      e.SetName(n);
    }

    // Sets an entity as inactive by removing it from the active entities list.
    SetActive(e, b) {
      const i = this._entities.indexOf(e); // Find the index of the entity in the list.
      if (i < 0) { // If the entity is not found, return early.
        return;
      }

      this._entities.splice(i, 1); // Remove the entity from the list.
    }

    // Updates all entities by calling their `Update` method.
    // `timeElapsed` is passed to allow entities to perform time-based updates.
    Update(timeElapsed) {
      for (let e of this._entities) {
        e.Update(timeElapsed); // Call the update method for each entity.
      }
    }
  }

  // Return the EntityManager class as part of the module export.
  return {
    EntityManager: EntityManager
  };
})();
