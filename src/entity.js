// Import the Three.js library for 3D rendering
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

// Define a module for entity-related classes and functionality
export const entity = (() => {

  /**
   * The `Entity` class represents an object in the 3D world.
   * It can have components (behaviors, properties) and supports hierarchical structures.
   */
  class Entity {
    constructor() {
      this._name = null; // The name of the entity
      this._components = {}; // A map of components attached to this entity

      // Position and rotation of the entity in the 3D space
      this._position = new THREE.Vector3();
      this._rotation = new THREE.Quaternion();
      this._handlers = {}; // Event handlers for various message topics
      this._parent = null; // Reference to the parent system managing this entity
    }

    /**
     * Registers a handler function for a specific event/topic.
     * @param {string} n - The topic name
     * @param {function} h - The handler function
     */
    _RegisterHandler(n, h) {
      if (!(n in this._handlers)) {
        this._handlers[n] = [];
      }
      this._handlers[n].push(h);
    }

    /**
     * Sets the parent system or manager for this entity.
     * @param {object} p - The parent object
     */
    SetParent(p) {
      this._parent = p;
    }

    /**
     * Sets the name of the entity.
     * @param {string} n - The name to assign
     */
    SetName(n) {
      this._name = n;
    }

    /**
     * Getter for the entity's name.
     * @return {string} The entity name
     */
    get Name() {
      return this._name;
    }

    /**
     * Activates or deactivates this entity within its parent system.
     * @param {boolean} b - Whether to activate (`true`) or deactivate (`false`) the entity
     */
    SetActive(b) {
      this._parent.SetActive(this, b);
    }

    /**
     * Adds a component to this entity.
     * @param {Component} c - The component to add
     */
    AddComponent(c) {
      c.SetParent(this); // Set the entity as the component's parent
      this._components[c.constructor.name] = c; // Store the component by its class name
      c.InitComponent(); // Initialize the component
    }

    /**
     * Retrieves a component by its class name.
     * @param {string} n - The name of the component
     * @return {Component} The component instance
     */
    GetComponent(n) {
      return this._components[n];
    }

    /**
     * Finds another entity by its name through the parent system.
     * @param {string} n - The name of the entity to find
     * @return {Entity} The found entity, or `null` if not found
     */
    FindEntity(n) {
      return this._parent.Get(n);
    }

    /**
     * Broadcasts a message to all handlers registered for the message's topic.
     * @param {object} msg - The message object containing a topic and value
     */
    Broadcast(msg) {
      if (!(msg.topic in this._handlers)) {
        return; // No handlers registered for the topic
      }

      for (let curHandler of this._handlers[msg.topic]) {
        curHandler(msg); // Call each handler with the message
      }
    }

    /**
     * Sets the position of the entity and notifies listeners of the change.
     * @param {THREE.Vector3} p - The new position
     */
    SetPosition(p) {
      this._position.copy(p);
      this.Broadcast({
        topic: 'update.position',
        value: this._position,
      });
    }

    /**
     * Sets the rotation (quaternion) of the entity and notifies listeners of the change.
     * @param {THREE.Quaternion} r - The new rotation
     */
    SetQuaternion(r) {
      this._rotation.copy(r);
      this.Broadcast({
        topic: 'update.rotation',
        value: this._rotation,
      });
    }

    /**
     * Updates all components of the entity.
     * @param {number} timeElapsed - The time elapsed since the last update
     */
    Update(timeElapsed) {
      for (let k in this._components) {
        this._components[k].Update(timeElapsed);
      }
    }
  };

  /**
   * The `Component` class represents a behavior or property that can be attached to an entity.
   */
  class Component {
    constructor() {
      this._parent = null; // The parent entity to which this component belongs
    }

    /**
     * Sets the parent entity of this component.
     * @param {Entity} p - The parent entity
     */
    SetParent(p) {
      this._parent = p;
    }

    /**
     * A method that initializes the component. Can be overridden by subclasses.
     */
    InitComponent() {}

    /**
     * Retrieves a component from the parent entity by its name.
     * @param {string} n - The name of the component
     * @return {Component} The requested component
     */
    GetComponent(n) {
      return this._parent.GetComponent(n);
    }

    /**
     * Finds another entity by its name through the parent system.
     * @param {string} n - The name of the entity
     * @return {Entity} The found entity, or `null` if not found
     */
    FindEntity(n) {
      return this._parent.FindEntity(n);
    }

    /**
     * Broadcasts a message to the parent entity.
     * @param {object} m - The message object
     */
    Broadcast(m) {
      this._parent.Broadcast(m);
    }

    /**
     * Updates the component. Can be overridden by subclasses.
     * @param {number} _ - Time elapsed (not used by default)
     */
    Update(_) {}

    /**
     * Registers a handler for a specific topic with the parent entity.
     * @param {string} n - The topic name
     * @param {function} h - The handler function
     */
    _RegisterHandler(n, h) {
      this._parent._RegisterHandler(n, h);
    }
  };

  // Return the Entity and Component classes as part of the module
  return {
    Entity: Entity,
    Component: Component,
  };

})();
