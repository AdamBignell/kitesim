import { Bezier } from 'bezier-js';

export default class SplinePathGenerator {
  /**
   * @param {import('./RhythmNodeCalculator').default} rhythmCalculator
   */
  constructor(rhythmCalculator) {
    this.rhythmCalculator = rhythmCalculator;
    this.path = this.createPath();
    this.nodes = this.generateRhythmNodes();
  }

  createPath() {
    // These points are in a "unit" space, not tile space. We'll scale them later.
    const points = [
        { x: 0, y: 0 },
        { x: 50, y: 5 },
        { x: 100, y: -5 },
        { x: 150, y: 10 },
        { x: 200, y: 0 },
        { x: 250, y: -15 },
        { x: 300, y: 0 },
        { x: 350, y: 20 },
        { x: 400, y: 0 },
    ];
    return new Bezier(points);
  }

  generateRhythmNodes() {
    const nodes = [];
    // Use a comfortable jump, scaled down for our unit space, as the step distance.
    const stepDistance = this.rhythmCalculator.calculateComfortableJump(0.7).horizontalDistance / 20;
    const pathLength = this.path.length();

    for (let d = 0; d < pathLength; d += stepDistance) {
      const t = this.path.get(d).t; // get t-value at distance d
      const point = this.path.get(t);
      nodes.push({
        x: point.x,
        y: point.y,
        type: 'platform' // For now, all nodes are simple platforms
      });
    }
    return nodes;
  }

  getPointAtWorldX(worldX) {
    const projection = this.path.project({ x: worldX, y: 0 });
    return { y: projection.y };
  }

  /**
   * Gets all rhythm nodes that fall within a specific chunk's boundaries.
   * @param {number} chunkX - The x-coordinate of the chunk.
   * @param {number} chunkSize - The size of the chunk in tiles.
   * @returns {object[]} An array of node objects.
   */
  getNodesInChunk(chunkX, chunkSize) {
    const chunkNodes = [];
    // Convert chunk tile coordinates to the spline's "unit" space
    const unitChunkStart = (chunkX * chunkSize) / 20;
    const unitChunkEnd = ((chunkX + 1) * chunkSize) / 20;

    for (const node of this.nodes) {
      if (node.x >= unitChunkStart && node.x < unitChunkEnd) {
        chunkNodes.push(node);
      }
    }
    return chunkNodes;
  }
}
