import { entity } from './entity.js';  // Importing the 'entity' module to extend the base functionality

export const ui_controller = (() => {

  // UIController class that inherits from entity.Component
  class UIController extends entity.Component {
    constructor(params) {
      super();  // Call the constructor of the parent class 'entity.Component'
      this._params = params;  // Store the parameters for UI controller
      this._quests = {};  // Initialize an empty object to store quests
    }

    // Method to initialize the UI components and event listeners
    InitComponent() {
      // Set up references to the icon bar elements in the HTML
      this._iconBar = {
        stats: document.getElementById('icon-bar-stats'),
        inventory: document.getElementById('icon-bar-inventory'),
        quests: document.getElementById('icon-bar-quests'),
      };

      // Set up references to the main UI elements in the HTML
      this._ui = {
        inventory: document.getElementById('inventory'),
        stats: document.getElementById('stats'),
        quests: document.getElementById('quest-journal'),
      };

      // Assign click event handlers to icon bar elements
      this._iconBar.inventory.onclick = (m) => { this._OnInventoryClicked(m); };
      this._iconBar.stats.onclick = (m) => { this._OnStatsClicked(m); };
      this._iconBar.quests.onclick = (m) => { this._OnQuestsClicked(m); };

      // Hide all UI elements initially
      this._HideUI();
    }

    // Method to add a new quest to the UI
    AddQuest(quest) {
      // If the quest ID already exists, don't add it again
      if (quest.id in this._quests) {
        return;
      }

      // Create a new div element for the quest entry
      const e = document.createElement('DIV');
      e.className = 'quest-entry';  // Set the CSS class
      e.id = 'quest-entry-' + quest.id;  // Set the ID of the div
      e.innerText = quest.title;  // Set the title of the quest as the inner text
      e.onclick = (evt) => { 
        // On clicking the quest entry, select the quest
        this._OnQuestSelected(e.id); 
      };

      // Append the newly created quest entry to the quest journal in the UI
      document.getElementById('quest-journal').appendChild(e);

      // Store the quest in the quests object
      this._quests[quest.id] = quest;

      // Select the newly added quest
      this._OnQuestSelected(quest.id);
    }

    // Method to handle the selection of a quest
    _OnQuestSelected(id) {
      // Retrieve the quest based on the given ID
      const quest = this._quests[id];

      // Make the quest UI visible
      const e = document.getElementById('quest-ui');
      e.style.visibility = '';

      // Set the quest description and title
      const text = document.getElementById('quest-text');
      text.innerText = quest.text;

      const title = document.getElementById('quest-text-title');
      title.innerText = quest.title;
    }

    // Method to hide all UI elements
    _HideUI() {
      this._ui.inventory.style.visibility = 'hidden';
      this._ui.stats.style.visibility = 'hidden';
      this._ui.quests.style.visibility = 'hidden';
    }
    
    // Method to handle the click event for the 'quests' icon in the icon bar
    _OnQuestsClicked(msg) {
      const visibility = this._ui.quests.style.visibility;
      this._HideUI();  // Hide all UI elements
      this._ui.quests.style.visibility = (visibility ? '' : 'hidden');  // Toggle the visibility of the quest journal
    }

    // Method to handle the click event for the 'stats' icon in the icon bar
    _OnStatsClicked(msg) {
      const visibility = this._ui.stats.style.visibility;
      this._HideUI();  // Hide all UI elements
      this._ui.stats.style.visibility = (visibility ? '' : 'hidden');  // Toggle the visibility of the stats UI
    }

    // Method to handle the click event for the 'inventory' icon in the icon bar
    _OnInventoryClicked(msg) {
      const visibility = this._ui.inventory.style.visibility;
      this._HideUI();  // Hide all UI elements
      this._ui.inventory.style.visibility = (visibility ? '' : 'hidden');  // Toggle the visibility of the inventory UI
    }

    // Update method, can be used for dynamic updates but is currently empty
    Update(timeInSeconds) {
    }
  };

  // Return the UIController class as part of the public API
  return {
    UIController: UIController,
  };

})();
