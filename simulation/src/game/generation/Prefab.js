/**
 * Represents a prefabricated structure with metadata for procedural generation.
 */
export default class Prefab {
  /**
   * @param {string} name - The unique name of the prefab.
   * @param {function} generator - The function that generates the Phaser game objects for the structure.
   * @param {object} size - The dimensions of the prefab.
   * @param {number} size.width - The width of the prefab in grid units.
   * @param {number} size.height - The height of the prefab in grid units.
   * @param {object[]} connectors - An array of connection points.
   * @param {string} connectors[].position - The position of the connector ('top', 'bottom', 'left', 'right').
   * @param {string} connectors[].type - The type of the connector ('door', 'hallway').
   */
  constructor(name, generator, size, connectors) {
    this.name = name;
    this.generator = generator;
    this.size = size;
    this.connectors = connectors;
  }
}
