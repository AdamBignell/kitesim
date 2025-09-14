import * as Phaser from 'phaser';

export default class LevelGenerator {
  constructor(scene) {
    this.scene = scene;
    this.templates = this._getChunkTemplates();
  }

  /**
   * The main public method to generate a level.
   * It sets up a grid and uses a constraint-based algorithm to fill it
   * with interconnected chunks, then draws the result.
   * @param {Phaser.Physics.Arcade.StaticGroup} platformsGroup - The group to add platforms to.
   */
  generate(platformsGroup) {
    const { width, height } = this.scene.scale;
    const GRID_COLS = 4;
    const GRID_ROWS = 3;
    const CHUNK_WIDTH = width / GRID_COLS;
    const CHUNK_HEIGHT = height / GRID_ROWS;

    // 1. Fill a logical grid with chunk types using constraint-solving.
    const logicalGrid = this._fillGrid(GRID_COLS, GRID_ROWS);

    // 2. Draw the actual platforms based on the logical grid.
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const chunkKey = logicalGrid[r][c];
        if (chunkKey && this.templates[chunkKey]) {
          const chunk = this.templates[chunkKey];
          const chunkX = c * CHUNK_WIDTH;
          const chunkY = r * CHUNK_HEIGHT;
          chunk.draw.call(this, platformsGroup, chunkX, chunkY, CHUNK_WIDTH, CHUNK_HEIGHT);
        }
      }
    }
  }

  /**
   * Fills a grid using a simplified Wave Function Collapse algorithm.
   * It ensures that adjacent chunks have matching exits.
   * @private
   */
  _fillGrid(cols, rows) {
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
    const allTemplateKeys = Object.keys(this.templates);

    const getOpposite = (side) => {
      if (side === 'top') return 'bottom';
      if (side === 'bottom') return 'top';
      if (side === 'left') return 'right';
      if (side === 'right') return 'left';
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let validTemplates = [...allTemplateKeys];

        // --- Check constraints from neighbors that are already placed ---

        // Check top neighbor
        if (r > 0 && grid[r - 1][c]) {
          const neighborExits = this.templates[grid[r - 1][c]].exits;
          validTemplates = validTemplates.filter(key =>
            neighborExits.includes('bottom') === this.templates[key].exits.includes('top')
          );
        }

        // Check left neighbor
        if (c > 0 && grid[r][c - 1]) {
          const neighborExits = this.templates[grid[r][c - 1]].exits;
          validTemplates = validTemplates.filter(key =>
            neighborExits.includes('right') === this.templates[key].exits.includes('left')
          );
        }

        // --- Special rule for the start room ---
        if (r === rows - 1 && c === 0) {
            grid[r][c] = 'START_ROOM';
        } else if (validTemplates.length > 0) {
            grid[r][c] = Phaser.Math.RND.pick(validTemplates);
        } else {
            // If no valid template, place a solid block
            grid[r][c] = 'SOLID';
        }
      }
    }
    return grid;
  }

  /**
   * Defines the library of all possible room chunks.
   * Each chunk has an array of exits ['top', 'right', 'bottom', 'left']
   * and a `draw` function.
   * @private
   */
  _getChunkTemplates() {
    return {
      'SOLID': {
        draw: this._drawSolidChunk,
        exits: []
      },
      'START_ROOM': {
        draw: this._drawFloorChunk,
        exits: ['top', 'right']
      },
      'VERTICAL_SHAFT': {
        draw: this._drawVerticalShaft,
        exits: ['top', 'bottom']
      },
      'HORIZONTAL_CORRIDOR': {
        draw: this._drawFloorChunk,
        exits: ['left', 'right']
      },
      'L_BEND_BOTTOM_RIGHT': {
        draw: this._drawLBendBottomRight,
        exits: ['bottom', 'right']
      },
      'T_JUNCTION_DOWN': {
        draw: this._drawTJunctionDown,
        exits: ['left', 'right', 'bottom']
      },
      'CROSS_ROOM': {
        draw: this._drawCrossRoom,
        exits: ['top', 'right', 'bottom', 'left']
      }
    };
  }

  // --- Drawing Functions for Individual Chunk Types ---

  _drawSolidChunk(platforms, x, y, w, h) {
    // A solid, impassable chunk
    platforms.create(x + w / 2, y + h / 2, null).setSize(w, h).setVisible(false).refreshBody();
  }

  _drawFloorChunk(platforms, x, y, w, h) {
    platforms.create(x + w / 2, y + h - 10, null).setSize(w, 20).setVisible(false).refreshBody();
  }

  _drawVerticalShaft(platforms, x, y, w, h) {
    platforms.create(x + 10, y + h / 2, null).setSize(20, h).setVisible(false).refreshBody();
    platforms.create(x + w - 10, y + h / 2, null).setSize(20, h).setVisible(false).refreshBody();
  }

  _drawLBendBottomRight(platforms, x, y, w, h) {
    platforms.create(x + w / 2, y + h - 10, null).setSize(w, 20).setVisible(false).refreshBody();
    platforms.create(x + 10, y + h / 2, null).setSize(20, h).setVisible(false).refreshBody();
  }

  _drawTJunctionDown(platforms, x, y, w, h) {
    platforms.create(x + w / 2, y + 10, null).setSize(w, 20).setVisible(false).refreshBody();
    platforms.create(x + w / 2, y + h / 2, null).setSize(20, h).setVisible(false).refreshBody();
  }

  _drawCrossRoom(platforms, x, y, w, h) {
    platforms.create(x + w / 2, y + h / 2, null).setSize(w * 0.4, 20).setVisible(false).refreshBody();
    platforms.create(x + w / 2, y + h / 2, null).setSize(20, h * 0.4).setVisible(false).refreshBody();
  }
}
