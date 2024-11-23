import { entity } from "./entity.js";  // Importing the 'entity' module

// Immediately Invoked Function Expression (IIFE) to encapsulate the QuestComponent logic
export const quest_component = (() => {

  // Defining constants for the title and text of the quest
  const _TITLE = 'Welcome Adventurer!';
  const _TEXT = `Welcome to Honeywood adventurer, I see you're the chosen one and also the dragon born and whatever else, you're going to save the world! Also bring the rings back to mordor and defeat the evil dragon, and all the other things. But first, I must test you with some meaningless bullshit tasks that every rpg makes you do to waste time. Go kill like uh 30 ghosts and collect their eyeballs or something. Also go get my drycleaning and pick up my kids from daycare.`;

  // Defining the QuestComponent class, which extends the entity.Component class
  class QuestComponent extends entity.Component {
    constructor() {
      super();  // Call the parent class constructor

      // Get the HTML element with the ID 'quest-ui' to control its visibility
      const e = document.getElementById('quest-ui');
      e.style.visibility = 'hidden';  // Initially hide the quest UI
    }

    // Initialization method for the component
    InitComponent() {
      // Registering an event handler for 'input.picked' event
      // When the event is triggered, it calls the _OnPicked method with the message (m) as a parameter
      this._RegisterHandler('input.picked', (m) => this._OnPicked(m));
    }

    // Method to handle the 'input.picked' event
    // When this event occurs, it triggers a quest creation
    _OnPicked(msg) {
      // HARDCODE A QUEST: creating a new quest object with predefined values
      const quest = {
        id: 'foo',  // Assign a hardcoded ID for the quest
        title: _TITLE,  // Title for the quest
        text: _TEXT,  // Description text for the quest
      };
      // Add the newly created quest to the journal
      this._AddQuestToJournal(quest);
    }

    // Method to add a quest to the journal
    // It finds the 'UIController' component and calls its AddQuest method to display the quest
    _AddQuestToJournal(quest) {
      const ui = this.FindEntity('ui').GetComponent('UIController');  // Find the UIController component in the 'ui' entity
      ui.AddQuest(quest);  // Add the quest to the UI using the AddQuest method of UIController
    }
  };

  // Returning the QuestComponent class to be used externally
  return {
      QuestComponent: QuestComponent,
  };
})();
