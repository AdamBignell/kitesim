import Grid from './Grid';

/**
 * Represents a room composed of prefabricated structures.
 */
export default class Room {
  /**
   * @param {number} width - The width of the room in grid units.
   * @param {number} height - The height of the room in grid units.
   * @param {Prefab[]} prefabs - An array of available prefabs to use for generation.
   */
  constructor(width, height, prefabs) {
    this.width = width;
    this.height = height;
    this.prefabs = prefabs;
    this.grid = new Grid(width, height, null);
  }

  /**
   * Generates a layout for the room by placing prefabs in the grid.
   * This is a simple random placement strategy for now.
   */
  generateLayout() {
    // Shuffle the prefabs to get a random order
    const shuffledPrefabs = [...this.prefabs].sort(() => 0.5 - Math.random());

    for (const prefab of shuffledPrefabs) {
      const { width: prefabWidth, height: prefabHeight } = prefab.size;

      // Try to place the prefab at a random position
      for (let i = 0; i < 10; i++) { // Try 10 times
        const x = Math.floor(Math.random() * (this.width - prefabWidth));
        const y = Math.floor(Math.random() * (this.height - prefabHeight));

        if (this.canPlace(prefab, x, y)) {
          this.place(prefab, x, y);
          break;
        }
      }
    }
  }

  /**
   * Checks if a prefab can be placed at the specified position.
   * @param {Prefab} prefab - The prefab to place.
   * @param {number} x - The x-coordinate to place the prefab at.
   * @param {number} y - The y-coordinate to place the prefab at.
   * @returns {boolean} - True if the prefab can be placed, false otherwise.
   */
  canPlace(prefab, x, y) {
    const { width: prefabWidth, height: prefabHeight } = prefab.size;

    // Check if the area is empty
    for (let i = 0; i < prefabHeight; i++) {
      for (let j = 0; j < prefabWidth; j++) {
        if (this.grid.getTile(x + j, y + i) !== null) {
          return false; // The space is already occupied
        }
      }
    }

    return true;
  }

  /**
   * Places a prefab at the specified position.
   * @param {Prefab} prefab - The prefab to place.
   * @param {number} x - The x-coordinate to place the prefab at.
   * @param {number} y - The y-coordinate to place the prefab at.
   */
  place(prefab, x, y) {
    const { width: prefabWidth, height: prefabHeight } = prefab.size;

    for (let i = 0; i < prefabHeight; i++) {
      for (let j = 0; j < prefabWidth; j++) {
        this.grid.setTile(x + j, y + i, prefab);
      }
    }
  }

  /**
   * Renders the room by calling the generator function of each placed prefab.
   * @param {Phaser.Scene} scene - The Phaser scene to render the room in.
   * @param {Phaser.Physics.Arcade.StaticGroup} platformsGroup - The group to add the platforms to.
   */
  render(scene, platformsGroup) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const prefab = this.grid.getTile(x, y);
        if (prefab) {
          // To avoid calling the generator multiple times for the same prefab,
          // we only call it for the top-left corner of the prefab.
          if (this.grid.getTile(x - 1, y) !== prefab && this.grid.getTile(x, y - 1) !== prefab) {
            prefab.generator(scene, platformsGroup);
          }
        }
      }
    }
  }
}
