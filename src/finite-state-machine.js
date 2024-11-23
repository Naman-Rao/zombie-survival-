// Export the finite state machine module as a self-contained object
export const finite_state_machine = (() => {

  // Define the FiniteStateMachine class
  class FiniteStateMachine {
    constructor() {
      // Initialize the dictionary of states
      this._states = {};
      // Track the current active state
      this._currentState = null;
    }

    /**
     * Adds a new state to the finite state machine.
     * @param {string} name - The name of the state.
     * @param {class} type - The class/type of the state to be added.
     */
    _AddState(name, type) {
      this._states[name] = type;
    }

    /**
     * Sets the active state of the finite state machine.
     * Exits the previous state (if any) and transitions to the new state.
     * @param {string} name - The name of the state to switch to.
     */
    SetState(name) {
      // Store a reference to the previous state
      const prevState = this._currentState;

      // If there is a current state and it's the same as the requested state, do nothing
      if (prevState) {
        if (prevState.Name == name) {
          return;
        }
        // Call the `Exit` method on the current state to perform cleanup
        prevState.Exit();
      }

      // Create an instance of the new state using the stored state class/type
      const state = new this._states[name](this);

      // Update the current state to the new state
      this._currentState = state;
      // Call the `Enter` method on the new state, passing the previous state as a parameter
      state.Enter(prevState);
    }

    /**
     * Updates the current state of the finite state machine.
     * Calls the `Update` method of the active state, if there is one.
     * @param {number} timeElapsed - The time elapsed since the last update.
     * @param {object} input - Any input data needed for the state to process.
     */
    Update(timeElapsed, input) {
      if (this._currentState) {
        this._currentState.Update(timeElapsed, input);
      }
    }
  };

  // Return the FiniteStateMachine class so it can be used elsewhere
  return {
    FiniteStateMachine: FiniteStateMachine
  };

})();
