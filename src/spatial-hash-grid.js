import {math} from './math.js'; // Importing the math module for mathematical operations.

export const spatial_hash_grid = (() => {

  // Define the SpatialHashGrid class
  class SpatialHashGrid {
    constructor(bounds, dimensions) {
      const [x, y] = dimensions;
      // Initialize the grid with empty cells (null)
      this._cells = [...Array(x)].map(_ => [...Array(y)].map(_ => (null)));
      this._dimensions = dimensions; // Store grid dimensions
      this._bounds = bounds; // Store the boundary of the grid
      this._queryIds = 0; // Initialize a query id for tracking queries
    }
  
    // Function to calculate the cell index for a given position
    _GetCellIndex(position) {
      // Calculate the normalized x and y coordinates within the bounds
      const x = math.sat((position[0] - this._bounds[0][0]) / (
          this._bounds[1][0] - this._bounds[0][0]));
      const y = math.sat((position[1] - this._bounds[0][1]) / (
          this._bounds[1][1] - this._bounds[0][1]));
  
      // Convert normalized coordinates to grid cell indices
      const xIndex = Math.floor(x * (this._dimensions[0] - 1));
      const yIndex = Math.floor(y * (this._dimensions[1] - 1));
  
      return [xIndex, yIndex]; // Return the cell index as [x, y]
    }
  
    // Function to add a new client to the grid
    NewClient(position, dimensions) {
      const client = {
        position: position, // Position of the client
        dimensions: dimensions, // Dimensions of the client (e.g., width, height)
        _cells: {
          min: null, // Minimum cell index the client occupies
          max: null, // Maximum cell index the client occupies
          nodes: null, // Nodes (linked list) for managing cells
        },
        _queryId: -1, // Initialize the query id for the client
      };
  
      this._Insert(client); // Insert the client into the grid
  
      return client; // Return the newly created client
    }
  
    // Function to update an existing client's position in the grid
    UpdateClient(client) {
      const [x, y] = client.position;
      const [w, h] = client.dimensions;
  
      // Calculate the cell indices for the bounding box of the client
      const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
      const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);
  
      // Check if the client's cell indices have changed, if not, do nothing
      if (client._cells.min[0] == i1[0] &&
          client._cells.min[1] == i1[1] &&
          client._cells.max[0] == i2[0] &&
          client._cells.max[1] == i2[1]) {
        return;
      }
  
      this.Remove(client); // Remove the client from the previous cells
      this._Insert(client); // Reinsert the client with updated position
    }
  
    // Function to find nearby clients based on a given position and bounding box
    FindNear(position, bounds) {
      const [x, y] = position;
      const [w, h] = bounds;
  
      // Calculate the cell indices for the bounding box
      const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
      const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);
  
      const clients = []; // Array to store found clients
      const queryId = this._queryIds++; // Increment query id for this search
  
      // Iterate through the cells within the bounding box
      for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
        for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
          let head = this._cells[x][y]; // Get the head node of the linked list in the cell
  
          // Traverse the linked list and collect unique clients based on queryId
          while (head) {
            const v = head.client;
            head = head.next;
  
            if (v._queryId != queryId) {
              v._queryId = queryId; // Mark the client as visited in this query
              clients.push(v); // Add client to the list
            }
          }
        }
      }
      return clients; // Return the list of clients found nearby
    }
  
    // Function to insert a client into the grid
    _Insert(client) {
      const [x, y] = client.position;
      const [w, h] = client.dimensions;
  
      // Calculate the cell indices for the bounding box of the client
      const i1 = this._GetCellIndex([x - w / 2, y - h / 2]);
      const i2 = this._GetCellIndex([x + w / 2, y + h / 2]);
  
      const nodes = []; // Array to store nodes for managing cells
  
      // Iterate through the grid cells the client occupies and insert the client
      for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
        nodes.push([]); // Initialize an array for each x cell
  
        for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
          const xi = x - i1[0];
  
          const head = {
            next: null,
            prev: null,
            client: client, // Store the client in the node
          };
  
          nodes[xi].push(head); // Add the node to the array of nodes
  
          head.next = this._cells[x][y]; // Link the new node to the existing list
          if (this._cells[x][y]) {
            this._cells[x][y].prev = head; // Update the previous node's pointer
          }
  
          this._cells[x][y] = head; // Set the new head node for the cell
        }
      }
  
      // Store the min/max cell indices and nodes in the client
      client._cells.min = i1;
      client._cells.max = i2;
      client._cells.nodes = nodes;
    }
  
    // Function to remove a client from the grid
    Remove(client) {
      const i1 = client._cells.min;
      const i2 = client._cells.max;
  
      // Iterate through the cells the client occupies and unlink it from the list
      for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
        for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
          const xi = x - i1[0];
          const yi = y - i1[1];
          const node = client._cells.nodes[xi][yi];
  
          // Unlink the node from the linked list in the cell
          if (node.next) {
            node.next.prev = node.prev;
          }
          if (node.prev) {
            node.prev.next = node.next;
          }
  
          if (!node.prev) {
            this._cells[x][y] = node.next; // Update the head node of the cell
          }
        }
      }
  
      // Clear the client's cell references
      client._cells.min = null;
      client._cells.max = null;
      client._cells.nodes = null;
    }
  }

  // Return the SpatialHashGrid class for external use
  return {
    SpatialHashGrid: SpatialHashGrid,
  };

})();
