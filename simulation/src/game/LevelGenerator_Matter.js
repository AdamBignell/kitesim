import * as Phaser from 'phaser';
import { createNoise2D } from 'simplex-noise';
import * as Structures from './generation/structures';
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

  generateChunk(chunkX, chunkY, chunkSize, tileSize) {
    const chunkWorldX = chunkX * chunkSize * tileSize;
    const chunkWorldY = 0;
    const chunkHeightPixels = this.scene.scale.height;

    const chunkWidthPixels = chunkSize * tileSize;

    const surfaceVertices = [];
    const terrainNoiseScale = 150;
    const terrainAmplitude = 4 * tileSize;
    const worldCenterY = this.scene.scale.height / 1.5;
    const step = 16;

    for (let x = 0; x <= chunkWidthPixels; x += step) {
      const worldX = chunkWorldX + x;
      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20);
      const splineHeight = splinePoint.y * tileSize / 10;
      const noiseValue = this.noise(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;
      const terrainHeight = worldCenterY + splineHeight + noiseOffset;
      surfaceVertices.push({ x: worldX, y: terrainHeight });
    }

    const groundPolygon = [
      ...surfaceVertices,
      { x: chunkWorldX + chunkWidthPixels, y: chunkWorldY + chunkHeightPixels },
      { x: chunkWorldX, y: chunkWorldY + chunkHeightPixels }
    ];

    const bounds = Phaser.Geom.Polygon.GetAABB(new Phaser.Geom.Polygon(groundPolygon));
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const terrainBody = this.scene.matter.add.fromVertices(centerX, centerY, groundPolygon, { isStatic: true });

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x228B22, 1);
    graphics.fillPoints(groundPolygon);

    const container = this.scene.add.container(0, 0, [graphics]);
    container.setData('matterBody', terrainBody);
    container.destroy = function() {
        graphics.destroy();
        this.scene.matter.world.remove(this.getData('matterBody'));
        Phaser.GameObjects.Container.prototype.destroy.call(this);
    };

    return { platforms: container };
  }

  generateInitialChunkAndSpawnPoint(chunkSize, tileSize) {
    const chunkWidthPixels = chunkSize * tileSize;
    const chunkHeightPixels = this.scene.scale.height;

    const surfaceVertices = [];
    const terrainNoiseScale = 150;
    const terrainAmplitude = 4 * tileSize;
    const worldCenterY = this.scene.scale.height / 1.5;
    const step = 16;

    for (let x = 0; x <= chunkWidthPixels; x += step) {
      const worldX = x;
      const splinePoint = this.pathGenerator.getPointAtWorldX(worldX / 20);
      const splineHeight = splinePoint.y * tileSize / 10;
      const noiseValue = this.noise(worldX / terrainNoiseScale, 0);
      const noiseOffset = noiseValue * terrainAmplitude;
      const terrainHeight = worldCenterY + splineHeight + noiseOffset;
      surfaceVertices.push({ x: worldX, y: terrainHeight });
    }

    const safeZoneTileX = 3;
    const searchWorldX = safeZoneTileX * tileSize;
    let groundY = worldCenterY;
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
        y: groundY - (tileSize * 3)
    };

    const groundPolygon = [
      ...surfaceVertices,
      { x: chunkWidthPixels, y: chunkHeightPixels },
      { x: 0, y: chunkHeightPixels }
    ];

    const bounds = Phaser.Geom.Polygon.GetAABB(new Phaser.Geom.Polygon(groundPolygon));
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const terrainBody = this.scene.matter.add.fromVertices(centerX, centerY, groundPolygon, { isStatic: true });

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x228B22, 1);
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
