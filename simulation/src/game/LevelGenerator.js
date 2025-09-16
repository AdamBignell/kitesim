import * as Phaser from 'phaser';
import { createNoise2D } from 'simplex-noise';
// Grid and GreedyMesher are no longer needed
// import Grid from './generation/Grid';
// import GreedyMesher from './generation/GreedyMesher';
import * as Structures from './generation/structures';
import { createFloor } from './generation/MegaStructure';
import PlayerCapabilitiesProfile from './generation/PlayerCapabilitiesProfile';
import SplinePathGenerator from './generation/SplinePathGenerator';
import RhythmNodeCalculator from './generation/RhythmNodeCalculator';

export default class LevelGenerator {
  constructor(scene, pcp) {
    this.scene = scene;
    this.structures = Object.values(Structures);
    this.pcp = pcp;
    this.noise = createNoise2D();
    const rhythmCalculator = new RhythmNodeCalculator(pcp);
    this.pathGenerator = new SplinePathGenerator(rhythmCalculator);
  }

  // --- NEW generateChunk ---
  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkWorldX = chunkX * chunkSize * tileSize;
    // Using scene height for vertical bounds is more robust for a scrolling world
    const chunkWorldY = 0; // Top of the world
    const chunkHeightPixels = this.scene.scale.height * 2; // Make it tall enough

    const chunkWidthPixels = chunkSize * tileSize;


    // --- Vertex Generation ---
    const surfaceVertices = [];
    const terrainNoiseScale = 50;
    const terrainAmplitude = 15 * tileSize; // Amplitude in pixels
    const worldCenterY = this.scene.scale.height / 1.5; // Base height in pixels
    const step = 32; // Generate a vertex every 32 pixels (one tile)

    for (let x = 0; x <= chunkWidthPixels; x += step) {
      const worldX = chunkWorldX + x;

      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20);
      const splineHeight = splinePoint.y * tileSize / 10; // Adjust spline scale

      const noiseValue = this.noise(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;

      const terrainHeight = worldCenterY + splineHeight + noiseOffset;
      surfaceVertices.push({ x: worldX, y: terrainHeight });
    }

    // --- Create Polygon Shape ---
    const groundPolygon = [
      ...surfaceVertices,
      { x: chunkWorldX + chunkWidthPixels, y: chunkWorldY + chunkHeightPixels },
      { x: chunkWorldX, y: chunkWorldY + chunkHeightPixels }
    ];

    // --- Create Matter Body ---
    const terrainBody = this.scene.matter.add.fromVertices(0, 0, groundPolygon, { isStatic: true });


    // --- Visuals ---
    // The container will hold the graphics and a reference to the Matter body
    // This makes cleanup easier when the chunk is unloaded.
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x228B22, 1); // ForestGreen
    graphics.fillPoints(groundPolygon);

    const container = this.scene.add.container(0, 0, [graphics]);
    container.setData('matterBody', terrainBody);
    // Override the container's destroy method to also remove the Matter body
    container.destroy = function() {
        graphics.destroy();
        // 'this' refers to the container instance
        this.scene.matter.world.remove(this.getData('matterBody'));
        // Call original destroy method
        Phaser.GameObjects.Container.prototype.destroy.call(this);
    };


    return { platforms: container };
  }


  // --- NEW generateInitialChunkAndSpawnPoint ---
  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkX = 0;
    const chunkWidthPixels = chunkSize * tileSize;
    const chunkHeightPixels = this.scene.scale.height * 2;

    // --- Vertex Generation ---
    const surfaceVertices = [];
    const terrainNoiseScale = 50;
    const terrainAmplitude = 15 * tileSize;
    const worldCenterY = this.scene.scale.height / 1.5;
    const step = 32;

    for (let x = 0; x <= chunkWidthPixels; x += step) {
      const worldX = x; // For initial chunk, worldX is same as local x

      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20);
      const splineHeight = splinePoint.y * tileSize / 10;

      const noiseValue = this.noise(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;

      const terrainHeight = worldCenterY + splineHeight + noiseOffset;
      surfaceVertices.push({ x: worldX, y: terrainHeight });
    }

    // --- Find Spawn Point ---
    const safeZoneTileX = 3; // ~3rd tile in
    const searchWorldX = safeZoneTileX * tileSize;
    let groundY = worldCenterY; // fallback

    // Find the terrain height at our desired spawn X by finding the closest vertex
    let closestVertex = surfaceVertices[0];
    let minDistance = Infinity;
    for(const vertex of surfaceVertices) {
        const distance = Math.abs(vertex.x - searchWorldX);
        if (distance < minDistance) {
            minDistance = distance;
            closestVertex = vertex;
        }
    }
    groundY = closestVertex.y;

    const spawnPoint = {
        x: searchWorldX,
        y: groundY - (tileSize * 3) // Spawn 3 tiles above the ground
    };


    // --- Create Polygon Shape ---
    const groundPolygon = [
      ...surfaceVertices,
      { x: chunkWidthPixels, y: chunkHeightPixels },
      { x: 0, y: chunkHeightPixels }
    ];

    // --- Create Matter Body ---
    const terrainBody = this.scene.matter.add.fromVertices(0, 0, groundPolygon, { isStatic: true });


    // --- Visuals ---
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x228B22, 1); // ForestGreen
    graphics.fillPoints(groundPolygon);

    const container = this.scene.add.container(0, 0, [graphics]);
    container.setData('matterBody', terrainBody);
    container.destroy = function() {
        graphics.destroy();
        this.scene.matter.world.remove(this.getData('matterBody'));
        Phaser.GameObjects.Container.prototype.destroy.call(this);
    };

    return { platforms: container, spawnPoint };
  }
}
