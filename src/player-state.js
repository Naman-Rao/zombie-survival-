import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

// Creating a player state management system
export const player_state = (() => {

  // Base class for the state system, all states will inherit from this
  class State {
    constructor(parent) {
      this._parent = parent;  // Reference to the parent object
    }
  
    // Methods that can be overridden by child states
    Enter() {}
    Exit() {}
    Update() {}
  };

  // State representing the player's "Death" state
  class DeathState extends State {
    constructor(parent) {
      super(parent);
      this._action = null;  // Stores the action for the death animation
    }
  
    get Name() {
      return 'death';  // The name of this state
    }
  
    // Enter the death state, optionally transitioning from another state
    Enter(prevState) {
      this._action = this._parent._proxy._animations['death'].action;  // Get the death action

      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        
        // Setup the animation to play from the beginning and fade from the previous action
        this._action.reset();  
        this._action.setLoop(THREE.LoopOnce, 1);  // Play the animation once
        this._action.clampWhenFinished = true;  // Stop animation at the end
        this._action.crossFadeFrom(prevAction, 0.2, true);  // Crossfade from previous action
        this._action.play();  // Start playing the death animation
      } else {
        this._action.play();  // Play the death animation if no previous state
      }
    }
  
    Exit() {}
    Update(_) {}
  };
  
  // State representing the player's "Attack" state
  class AttackState extends State {
    constructor(parent) {
      super(parent);
      this._action = null;  // Stores the action for the attack animation
      this._FinishedCallback = () => {
        this._Finished();  // Handle attack animation finish
      }
    }
  
    get Name() {
      return 'attack';  // The name of this state
    }
  
    // Enter the attack state, optionally transitioning from another state
    Enter(prevState) {
      this._action = this._parent._proxy._animations['attack'].action;
      const mixer = this._action.getMixer();
      mixer.addEventListener('finished', this._FinishedCallback);  // Listen for animation finish
  
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        
        // Setup the attack animation
        this._action.reset();  
        this._action.setLoop(THREE.LoopOnce, 1);
        this._action.clampWhenFinished = true;
        this._action.crossFadeFrom(prevAction, 0.2, true);  // Crossfade from previous action
        this._action.play();  // Start playing the attack animation
      } else {
        this._action.play();  // Play the attack animation if no previous state
      }
    }
  
    // Handle attack animation finish
    _Finished() {
      this._Cleanup();  // Cleanup the event listener
      this._parent.SetState('idle');  // Transition to idle state after attack is finished
    }
  
    // Cleanup the event listener for animation finish
    _Cleanup() {
      if (this._action) {
        this._action.getMixer().removeEventListener('finished', this._FinishedCallback);
      }
    }
  
    Exit() {
      this._Cleanup();  // Clean up when exiting the state
    }
  
    Update(_) {}
  };
  
  // State representing the player's "Walk" state
  class WalkState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'walk';  // The name of this state
    }
  
    // Enter the walk state, optionally transitioning from another state
    Enter(prevState) {
      const curAction = this._parent._proxy._animations['walk'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        
        curAction.enabled = true;

        // Sync the walking animation with the previous action if needed
        if (prevState.Name == 'run') {
          const ratio = curAction.getClip().duration / prevAction.getClip().duration;
          curAction.time = prevAction.time * ratio;
        } else {
          curAction.time = 0.0;  // Reset time for the walk animation
          curAction.setEffectiveTimeScale(1.0);  // Set the time scale
          curAction.setEffectiveWeight(1.0);  // Set the weight of the animation
        }
  
        curAction.crossFadeFrom(prevAction, 0.1, true);  // Crossfade from the previous action
        curAction.play();  // Play the walk animation
      } else {
        curAction.play();  // Play the walk animation if no previous state
      }
    }
  
    Exit() {}
  
    // Update method that checks for input and transitions between states
    Update(timeElapsed, input) {
      if (input._keys.forward || input._keys.backward) {
        if (input._keys.shift) {
          this._parent.SetState('run');  // Transition to run if shift is held
        }
        return;
      }
  
      this._parent.SetState('idle');  // Transition to idle if no forward or backward movement
    }
  };
  
  // State representing the player's "Run" state
  class RunState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'run';  // The name of this state
    }
  
    // Enter the run state, optionally transitioning from another state
    Enter(prevState) {
      const curAction = this._parent._proxy._animations['run'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        
        curAction.enabled = true;

        // Sync the running animation with the previous action if needed
        if (prevState.Name == 'walk') {
          const ratio = curAction.getClip().duration / prevAction.getClip().duration;
          curAction.time = prevAction.time * ratio;
        } else {
          curAction.time = 0.0;  // Reset time for the run animation
          curAction.setEffectiveTimeScale(1.0);  // Set the time scale
          curAction.setEffectiveWeight(1.0);  // Set the weight of the animation
        }
  
        curAction.crossFadeFrom(prevAction, 0.1, true);  // Crossfade from the previous action
        curAction.play();  // Play the run animation
      } else {
        curAction.play();  // Play the run animation if no previous state
      }
    }
  
    Exit() {}
  
    // Update method that checks for input and transitions between states
    Update(timeElapsed, input) {
      if (input._keys.forward || input._keys.backward) {
        if (!input._keys.shift) {
          this._parent.SetState('walk');  // Transition to walk if shift is not held
        }
        return;
      }
  
      this._parent.SetState('idle');  // Transition to idle if no forward or backward movement
    }
  };
  
  // State representing the player's "Idle" state
  class IdleState extends State {
    constructor(parent) {
      super(parent);
    }
  
    get Name() {
      return 'idle';  // The name of this state
    }
  
    // Enter the idle state, optionally transitioning from another state
    Enter(prevState) {
      const idleAction = this._parent._proxy._animations['idle'].action;
      if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        idleAction.time = 0.0;  // Reset time for the idle animation
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1.0);  // Set the time scale
        idleAction.setEffectiveWeight(1.0);  // Set the weight of the animation
        idleAction.crossFadeFrom(prevAction, 0.25, true);  // Crossfade from the previous action
        idleAction.play();  // Play the idle animation
      } else {
        idleAction.play();  // Play the idle animation if no previous state
      }
    }
  
    Exit() {}
  
    // Update method that checks for input and transitions between states
    Update(_, input) {
      if (input._keys.forward || input._keys.backward) {
        this._parent.SetState('walk');  // Transition to walk if movement keys are pressed
      } else if (input._keys.space) {
        this._parent.SetState('attack');  // Transition to attack if space is pressed
      }
    }
  };

  // Return the state classes for use
  return {
    State: State,
    AttackState: AttackState,
    IdleState: IdleState,
    WalkState: WalkState,
    RunState: RunState,
    DeathState: DeathState,
  };

})();
