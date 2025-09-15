import LevelData from './LevelData';
import playerPhysicsProfile from './PlayerPhysicsProfile';

/**
 * @fileoverview This file contains the main LevelGenerator class, which
 * orchestrates the entire multi-stage procedural generation pipeline.
 */

class LevelGenerator {
    /**
     * @param {Object} config - The generator configuration object.
     * @param {Phaser.Scene} config.scene - The Phaser scene context.
     * @param {number} config.width - The desired width of the level in tiles.
     * @param {number} config.height - The desired height of the level in tiles.
     * @param {number} config.tileSize - The size of each tile in pixels.
     * @param {Object} config.chunkLibrary - A library of pre-authored level chunks.
     */
    constructor(config) {
        this.scene = config.scene;
        this.config = config;
        this.playerPhysics = playerPhysicsProfile;

        // A hardcoded chunk library. In a real system, this would be loaded from external files.
        // Each chunk has dimensions, entry/exit points (relative to chunk), and a 2D data grid.
        // 0 = empty, 1 = solid wall/floor
        const TILE_WALL = { type: 'WALL', tileIndex: 1, collides: true };
        this.config.chunkLibrary = {
            'easy_traversal': [{
                id: 'easy_flat_1',
                width: 15, height: 5,
                entry: { x: 0, y: 3 }, exit: { x: 14, y: 3 },
                data: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            }],
            'medium_jump': [{
                id: 'med_gap_1',
                width: 20, height: 7,
                entry: { x: 1, y: 5 }, exit: { x: 18, y: 5 },
                data: [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
                    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                ]
            }],
            'hard_wall_jump': [{
                id: 'hard_shaft_1',
                width: 10, height: 15,
                entry: { x: 1, y: 13 }, exit: { x: 8, y: 1 },
                data: [
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,1,1],
                    [0,0,0,0,0,0,0,0,1,1],
                    [0,0,0,0,0,0,0,0,0,0],
                    [1,1,0,0,0,0,0,0,0,0],
                    [1,1,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,1,1,0,0],
                    [0,0,0,0,0,0,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [0,0,1,1,0,0,0,0,0,0],
                    [0,0,1,1,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0],
                    [1,1,1,1,1,1,0,0,0,0],
                    [1,1,1,1,1,1,0,0,0,0],
                ]
            }],
        };
        // Add TILE_WALL definition to be accessible by other methods
        this.TILE_WALL = TILE_WALL;
    }

    /**
     * Main generation entry point. Executes the full pipeline.
     * @returns {LevelData} The finalized logical level data.
     */
    generate() {
        console.log("Starting level generation...");
        // Reset state for this generation pass
        this.preciseStartPosition = null;
        this.endGoalPosition = null;

        const levelData = new LevelData(this.config.width, this.config.height, this.config.tileSize);

        // STAGE 1 & 2: Generate and validate the macro-structure
        const macroGraph = this._generateMacroStructure(levelData);
        if (!macroGraph || Object.keys(macroGraph.nodes).length < 2) {
             console.error("Failed to generate a valid macro-structure. Retrying...");
             return this.generate();
        }
        const { path, isSolvable } = this._validatePathWithAStar(macroGraph);
        if (!isSolvable) {
            console.error("Generated macro-structure is not solvable. Retrying...");
            return this.generate(); // Simple retry logic
        }

        // STAGE 3: Define pacing and rhythm
        const rhythmSequence = this._defineRhythm(path);

        // STAGE 4: Instantiate and stitch chunks
        this._instantiateAndStitchChunks(levelData, rhythmSequence);

        // STAGE 5: Environmental finishing pass
        this._applyCellularAutomataFinish(levelData);

        // STAGE 6: Populate entities
        this._populateEntities(levelData, rhythmSequence);

        // Set start position based on the first chunk's entry point
        if (this.preciseStartPosition) {
            levelData.startPosition = {
                x: this.preciseStartPosition.x * this.config.tileSize + this.config.tileSize / 2,
                y: (this.preciseStartPosition.y - 2) * this.config.tileSize
            };
        } else {
            // Fallback start position if something went wrong
            levelData.startPosition = { x: 100, y: levelData.height * this.config.tileSize - 100 };
        }

        // Set end position based on the last chunk's exit point
        if (this.endGoalPosition) {
            levelData.endPosition = {
                x: this.endGoalPosition.x * this.config.tileSize,
                y: this.endGoalPosition.y * this.config.tileSize
            };
        }

        console.log("Level generation complete.");
        return levelData;
    }

    // --- Private Helper Methods for Each Stage ---

    /**
     * STAGE 1: Uses a modified Drunkard's Walk to create a high-level graph of zones.
     * @param {LevelData} levelData - The level data object to modify.
     * @returns {Object|null} A graph structure (e.g., adjacency list) of zones, or null if failed.
     */
    _generateMacroStructure(levelData) {
        console.log("Stage 1: Generating macro-structure with Drunkard's Walk...");

        const width = levelData.width;
        const height = levelData.height;
        const numZones = 15;
        const turnChance = 0.25;

        const graph = { nodes: {}, startNode: null, endNode: null };
        let grid = Array(height).fill(0).map(() => Array(width).fill(false));

        let walker = {
            x: Math.floor(width / 2),
            y: height - 5,
            dir: 'N'
        };

        const directions = {
            'N': { x: 0, y: -1 }, 'S': { x: 0, y: 1 }, 'E': { x: 1, y: 0 }, 'W': { x: -1, y: 0 }
        };
        const dirKeys = Object.keys(directions);
        let previousNode = null;

        for (let i = 0; i < numZones; i++) {
            const node = { id: i, x: walker.x, y: walker.y, neighbors: [] };
            graph.nodes[i] = node;
            if (i === 0) graph.startNode = node;
            graph.endNode = node;

            if (previousNode) {
                node.neighbors.push(previousNode.id);
                previousNode.neighbors.push(node.id);
            }
            previousNode = node;
            grid[walker.y][walker.x] = true;

            // Move the walker, with a limit to prevent infinite loops
            let moved = false;
            let tries = 0;
            while (!moved && tries < 50) {
                if (Math.random() < turnChance) {
                    walker.dir = dirKeys[Math.floor(Math.random() * dirKeys.length)];
                }

                const moveAmount = Math.floor(Math.random() * 10) + 5;
                let nx = walker.x;
                let ny = walker.y;
                for (let s = 0; s < moveAmount; s++) {
                    nx += directions[walker.dir].x;
                    ny += directions[walker.dir].y;
                }

                if (nx > 2 && nx < width - 2 && ny > 2 && ny < height - 2 && !grid[ny][nx]) {
                    walker.x = nx;
                    walker.y = ny;
                    moved = true;
                } else {
                    walker.dir = dirKeys[Math.floor(Math.random() * dirKeys.length)];
                    tries++;
                }
            }

            if (!moved) {
                console.warn("Walker got stuck. Terminating macro structure generation early.");
                break; // Exit the loop if the walker can't find a path
            }
        }

        return graph;
    }

    /**
     * STAGE 2: Runs A* on the macro-graph to ensure a path exists.
     * @param {Object} macroGraph - The graph from Stage 1.
     * @returns {{path: Array, isSolvable: boolean}} An object containing the path and solvability status.
     */
    _validatePathWithAStar(macroGraph) {
        console.log("Stage 2: Validating macro-structure with A*...");

        if (!macroGraph || !macroGraph.startNode || !macroGraph.endNode) {
            return { path: [], isSolvable: false };
        }

        const start = macroGraph.startNode;
        const goal = macroGraph.endNode;
        const nodes = macroGraph.nodes;

        const openSet = [start];
        const cameFrom = {};

        const gScore = {}; // Cost from start to current node
        Object.keys(nodes).forEach(id => gScore[id] = Infinity);
        gScore[start.id] = 0;

        const fScore = {}; // Total cost (gScore + heuristic)
        Object.keys(nodes).forEach(id => fScore[id] = Infinity);
        fScore[start.id] = this._heuristic(start, goal);

        while (openSet.length > 0) {
            // Find node in openSet with the lowest fScore
            let current = openSet.reduce((a, b) => fScore[a.id] < fScore[b.id] ? a : b);

            if (current.id === goal.id) {
                return { path: this._reconstructPath(cameFrom, current), isSolvable: true };
            }

            // Remove current from openSet
            openSet.splice(openSet.indexOf(current), 1);

            for (const neighborId of current.neighbors) {
                const neighbor = nodes[neighborId];
                const tentative_gScore = gScore[current.id] + this._distance(current, neighbor);

                if (tentative_gScore < gScore[neighbor.id]) {
                    cameFrom[neighbor.id] = current;
                    gScore[neighbor.id] = tentative_gScore;
                    fScore[neighbor.id] = gScore[neighbor.id] + this._heuristic(neighbor, goal);
                    if (!openSet.some(n => n.id === neighbor.id)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // No path found
        return { path: [], isSolvable: false };
    }

    // --- A* Helper Methods ---
    _heuristic(nodeA, nodeB) {
        // Manhattan distance on a grid
        return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
    }

    _distance(nodeA, nodeB) {
        // Actual distance between two nodes
        return Math.sqrt(Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2));
    }

    _reconstructPath(cameFrom, current) {
        const totalPath = [current];
        while (Object.keys(cameFrom).includes(current.id.toString())) {
            current = cameFrom[current.id];
            totalPath.unshift(current);
        }
        return totalPath;
    }

    /**
     * STAGE 3: Creates a sequence of challenge tags based on a difficulty curve.
     * @param {Array} criticalPath - The validated path of nodes from A*.
     * @returns {Array} An ordered array of challenge tags, one for each zone in the critical path.
     */
    _defineRhythm(criticalPath) {
        console.log("Stage 3: Defining level rhythm and pacing...");
        const pathLength = criticalPath.length;
        return criticalPath.map((node, i) => {
            // Difficulty curve: y = 0.2 + 0.6 * (x / pathLength) + 0.2 * Math.sin(x / 5)
            const base = 0.2;
            const linear = 0.6 * (i / pathLength);
            const sine = 0.2 * Math.sin((i / 5) * Math.PI * 2); // Use PI for better wave
            const difficulty = base + linear + sine;

            let tag;
            if (difficulty < 0.4) {
                tag = 'easy_traversal';
            } else if (difficulty < 0.75) {
                tag = 'medium_jump';
            } else {
                tag = 'hard_wall_jump';
            }

            return { zone: node, tag: tag, difficulty: difficulty };
        });
    }

    /**
     * STAGE 4: Places pre-authored chunks and connects them.
     * @param {LevelData} levelData - The level data object to populate.
     * @param {Array} rhythmSequence - The sequence of challenge tags.
     */
    _instantiateAndStitchChunks(levelData, rhythmSequence) {
        console.log("Stage 4: Instantiating and stitching chunks...");
        let lastChunkExit = null;

        rhythmSequence.forEach((item, index) => {
            const { zone, tag } = item;
            const availableChunks = this.config.chunkLibrary[tag];
            if (!availableChunks || availableChunks.length === 0) {
                console.warn(`No chunks found for tag: ${tag}`);
                return;
            }
            const chunk = availableChunks[Math.floor(Math.random() * availableChunks.length)];

            const chunkStartX = Math.floor(zone.x - chunk.width / 2);
            const chunkStartY = Math.floor(zone.y - chunk.height / 2);

            for (let y = 0; y < chunk.height; y++) {
                for (let x = 0; x < chunk.width; x++) {
                    const gridX = chunkStartX + x;
                    const gridY = chunkStartY + y;

                    if (gridY >= 0 && gridY < levelData.height && gridX >= 0 && gridX < levelData.width) {
                        if (chunk.data[y][x] === 1) {
                            levelData.grid[gridY][gridX] = { ...this.TILE_WALL, isStatic: true };
                        }
                    }
                }
            }

            const currentChunkEntry = {
                x: chunkStartX + chunk.entry.x,
                y: chunkStartY + chunk.entry.y
            };

            // Capture the precise start position from the first chunk's entry
            if (index === 0) {
                this.preciseStartPosition = { ...currentChunkEntry };
            }

            if (lastChunkExit) {
                this._stitchPoints(levelData, lastChunkExit, currentChunkEntry);
            }

            lastChunkExit = {
                x: chunkStartX + chunk.exit.x,
                y: chunkStartY + chunk.exit.y
            };

            // Capture the end goal position from the last chunk's exit
            if (index === rhythmSequence.length - 1) {
                this.endGoalPosition = { ...lastChunkExit };
            }
        });
    }

    _stitchPoints(levelData, pointA, pointB) {
        let x = pointA.x;
        let y = pointA.y;
        const staticWall = { ...this.TILE_WALL, isStatic: true };

        while (x !== pointB.x) {
            levelData.grid[y][x] = staticWall;
            if (y + 1 < levelData.height) {
                 levelData.grid[y+1][x] = staticWall;
            }
            x += (pointB.x > x) ? 1 : -1;
        }

        while (y !== pointB.y) {
            levelData.grid[y][x] = staticWall;
             if (x + 1 < levelData.width) {
                 levelData.grid[y][x+1] = staticWall;
            }
            y += (pointB.y > y) ? 1 : -1;
        }
    }

    _applyCellularAutomataFinish(levelData) {
        console.log("Stage 5: Applying Cellular Automata finishing pass...");
        const initialSeedChance = 0.45;
        const caIterations = 5;
        const birthThreshold = 4;
        const survivalThreshold = 3;

        // 1. Seed empty space with noise
        for (let y = 0; y < levelData.height; y++) {
            for (let x = 0; x < levelData.width; x++) {
                if (levelData.grid[y][x].type === 'EMPTY' && Math.random() < initialSeedChance) {
                    levelData.grid[y][x] = this.TILE_WALL;
                }
            }
        }

        // 2. Run CA simulation
        for (let i = 0; i < caIterations; i++) {
            levelData.grid = this._runCASimulationStep(levelData.grid, survivalThreshold, birthThreshold);
        }

        // 3. Remove all disconnected wall sections to clean up noise and floating blocks.
        const allWallBlobs = this._getAllWallBlobs(levelData.grid);
        let mainLandmassIndex = -1;

        if (this.preciseStartPosition) {
            const startX = this.preciseStartPosition.x;
            const startY = this.preciseStartPosition.y;

            // Find the blob that contains our starting platform. That's the main level.
            for (let i = 0; i < allWallBlobs.length; i++) {
                if (allWallBlobs[i].some(tile => tile.x === startX && tile.y === startY)) {
                    mainLandmassIndex = i;
                    break;
                }
            }
        }

        if (mainLandmassIndex !== -1) {
            const mainLandmass = allWallBlobs.splice(mainLandmassIndex, 1)[0];
            // Now allWallBlobs contains only the blobs to be removed.
            allWallBlobs.forEach(blob => {
                blob.forEach(tile => {
                    levelData.grid[tile.y][tile.x] = { type: 'EMPTY', tileIndex: -1, collides: false };
                });
            });
        }
    }

    /**
     * Helper for Stage 5 cleanup: Finds all contiguous blobs of wall tiles.
     */
    _getAllWallBlobs(grid) {
        const height = grid.length;
        const width = grid[0].length;
        const visited = Array(height).fill(null).map(() => Array(width).fill(false));
        const allBlobs = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x].type === 'WALL' && !visited[y][x]) {
                    const newBlob = [];
                    const queue = [{x, y}];
                    visited[y][x] = true;

                    while (queue.length > 0) {
                        const current = queue.shift();
                        newBlob.push(current);

                        const neighbors = [{x:0,y:1}, {x:0,y:-1}, {x:1,y:0}, {x:-1,y:0}];
                        for (const n of neighbors) {
                            const nx = current.x + n.x;
                            const ny = current.y + n.y;

                            if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                                !visited[ny][nx] && grid[ny][nx].type === 'WALL')
                            {
                                visited[ny][nx] = true;
                                queue.push({x: nx, y: ny});
                            }
                        }
                    }
                    allBlobs.push(newBlob);
                }
            }
        }
        return allBlobs;
    }


    /**
     * Helper for Stage 5: Runs a single step of a Cellular Automata simulation.
     */
    _runCASimulationStep(grid, survivalThreshold, birthThreshold) {
        const height = grid.length;
        const width = grid[0].length;
        let nextGrid = JSON.parse(JSON.stringify(grid));

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (grid[y][x].isStatic) continue;

                const neighbors = this._countAliveNeighbors(grid, x, y);
                const isWall = grid[y][x].type !== 'EMPTY';

                if (isWall) {
                    if (neighbors < survivalThreshold) {
                        nextGrid[y][x] = { type: 'EMPTY', tileIndex: -1, collides: false };
                    }
                } else {
                    if (neighbors > birthThreshold) {
                        nextGrid[y][x] = this.TILE_WALL;
                    }
                }
            }
        }
        return nextGrid;
    }

    /**
     * Helper for Stage 5: A flood-fill algorithm to find all accessible empty tiles.
     */
    _floodFill(x, y, grid, visited) {
        const queue = [{x, y}];
        const width = grid[0].length;
        const height = grid.length;

        while(queue.length > 0) {
            const {x: cx, y: cy} = queue.shift();

            if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
            if (visited[cy][cx]) continue;
            if (grid[cy][cx].type !== 'EMPTY') continue;

            visited[cy][cx] = true;

            queue.push({x: cx + 1, y: cy});
            queue.push({x: cx - 1, y: cy});
            queue.push({x: cx, y: cy + 1});
            queue.push({x: cx, y: cy - 1});
        }
    }

    /**
     * Helper for CA: Counts living neighbors around a cell.
     */
    _countAliveNeighbors(grid, x, y) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const nx = x + i;
                const ny = y + j;
                if (grid[ny] && grid[ny][nx] && grid[ny][nx].type !== 'EMPTY') {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * STAGE 6: Adds enemies, items, and special objects.
     * @param {LevelData} levelData - The nearly complete level data.
     * @param {Array} rhythmSequence - The sequence of challenge tags.
     */
    _populateEntities(levelData, rhythmSequence) {
        console.log("Stage 6: Populating level with entities...");
        // Add one-way platforms based on chunk properties
        rhythmSequence.forEach(item => {
            if (item.tag === 'medium_jump' && Math.random() > 0.5) {
                const zone = item.zone;
                // Place a one-way platform in the middle of the zone
                levelData.specialObjects.push({
                    type: 'ONE_WAY_PLATFORM',
                    x: zone.x * this.config.tileSize,
                    y: (zone.y - 3) * this.config.tileSize, // A bit above the zone anchor
                    tileKey: 'platform_oneway'
                });
            }
        });
    }
}

export default LevelGenerator;
