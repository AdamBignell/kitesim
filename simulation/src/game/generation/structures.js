import Structure from './Structure';
import Grid from './Grid';

function createSimplePlatform(width, height) {
  const grid = new Grid(width, height, 0);
  grid.fillRect(0, 0, width, height, 1);
  const snapPoints = new Map([
    ['top', [{ x: Math.floor(width / 2), y: 0 }]],
    ['bottom', [{ x: Math.floor(width / 2), y: height - 1 }]],
    ['left', [{ x: 0, y: Math.floor(height / 2) }]],
    ['right', [{ x: width - 1, y: Math.floor(height / 2) }]],
  ]);
  return new Structure(width, height, grid, snapPoints);
}

export const singleSmallPlatform = createSimplePlatform(2, 1);
export const singleMediumPlatform = createSimplePlatform(4, 1);
export const singleLargePlatform = createSimplePlatform(8, 1);

function createStaircase() {
  const width = 10;
  const height = 10;
  const grid = new Grid(width, height, 0);
  for (let i = 0; i < 5; i++) {
    grid.fillRect(i * 2, height - 1 - i * 2, 2, 1, 1);
  }
  const snapPoints = new Map([
    ['bottom', [{ x: 0, y: height - 1 }]],
    ['top', [{ x: width - 1, y: 0 }]],
  ]);
  return new Structure(width, height, grid, snapPoints);
}

export const bigStaircase = createStaircase();

function createFloatingIsland() {
  const width = 8;
  const height = 3;
  const grid = new Grid(width, height, 0);
  grid.fillRect(0, 0, width, height, 1);
  const snapPoints = new Map([
    ['top', [{ x: Math.floor(width / 2), y: 0 }]],
    ['bottom', [{ x: Math.floor(width / 2), y: height - 1 }]],
    ['left', [{ x: 0, y: Math.floor(height / 2) }]],
    ['right', [{ x: width - 1, y: Math.floor(height / 2) }]],
  ]);
  return new Structure(width, height, grid, snapPoints);
}

export const floatingIsland = createFloatingIsland();

function createEmptyChasm() {
    const width = 16;
    const height = 1;
    const grid = new Grid(width, height, 0);
    grid.fillRect(0,0, 4, 1, 1);
    grid.fillRect(width-4, 0, 4, 1, 1);

    const snapPoints = new Map([
        ['left', [{x: 0, y: 0}]],
        ['right', [{x: width-1, y: 0}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const emptyChasm = createEmptyChasm();

function createOverhang() {
    const width = 8;
    const height = 5;
    const grid = new Grid(width, height, 0);
    grid.fillRect(0, 0, width, 1, 1);
    grid.fillRect(0, 1, 1, height - 1, 1);

    const snapPoints = new Map([
        ['right', [{x: width-1, y: 0}]],
        ['bottom', [{x: 0, y: height-1}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const overhang = createOverhang();

function createVerticalStack() {
    const width = 3;
    const height = 12;
    const grid = new Grid(width, height, 0);
    for(let i=0; i<4; i++) {
        grid.fillRect(0, i*3, 3, 1, 1);
    }
    const snapPoints = new Map([
        ['top', [{x: 1, y: 0}]],
        ['bottom', [{x: 1, y: height-1}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const verticalStack = createVerticalStack();

function createHorizontalRow() {
    const width = 16;
    const height = 1;
    const grid = new Grid(width, height, 0);
    for(let i=0; i<4; i++) {
        grid.fillRect(i*4, 0, 3, 1, 1);
    }
    const snapPoints = new Map([
        ['left', [{x: 0, y: 0}]],
        ['right', [{x: width-1, y: 0}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const horizontalRow = createHorizontalRow();

function createSteppingStones() {
    const width = 10;
    const height = 6;
    const grid = new Grid(width, height, 0);
    for(let i=0; i<5; i++) {
        grid.setTile(i*2, height-1-i, 1);
    }
    const snapPoints = new Map([
        ['left', [{x:0, y: height-1}]],
        ['top', [{x:width-1, y: 0}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const steppingStones = createSteppingStones();

function createWideGap() {
    const width = 16;
    const height = 1;
    const grid = new Grid(width, height, 0);
    grid.fillRect(0, 0, 6, 1, 1);
    grid.fillRect(width-6, 0, 6, 1, 1);
    const snapPoints = new Map([
        ['left', [{x:0, y:0}]],
        ['right', [{x:width-1, y:0}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const wideGap = createWideGap();

function createPyramid() {
    const width = 9;
    const height = 5;
    const grid = new Grid(width, height, 0);
    for(let i=0; i<5; i++) {
        grid.fillRect(i, height-1-i, width-i*2, 1, 1);
    }
    const snapPoints = new Map([
        ['bottom', [{x:Math.floor(width/2), y: height-1}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const pyramid = createPyramid();

function createWallForJumping() {
    const width = 1;
    const height = 8;
    const grid = new Grid(width, height, 1);
    const snapPoints = new Map([
        ['bottom', [{x:0, y: height-1}]],
        ['top', [{x:0, y:0}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const wallForJumping = createWallForJumping();

function createFloatingBlockWithHole() {
    const width = 7;
    const height = 7;
    const grid = new Grid(width, height, 0);
    grid.fillRect(0,0,width,1,1);
    grid.fillRect(0,height-1,width,1,1);
    grid.fillRect(0,0,1,height,1);
    grid.fillRect(width-1,0,1,height,1);

    const snapPoints = new Map([
        ['left', [{x:0, y:Math.floor(height/2)}]],
        ['right', [{x:width-1, y:Math.floor(height/2)}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const floatingBlockWithHole = createFloatingBlockWithHole();

function createHighRoof() {
    const width = 16;
    const height = 1;
    const grid = new Grid(width, height, 1);
    const snapPoints = new Map([
        ['left', [{x:0, y:0}]],
        ['right', [{x:width-1, y:0}]]
    ]);
    return new Structure(width, height, grid, snapPoints);
}
export const highRoof = createHighRoof();

function createFiller() {
    const width = 1;
    const height = 1;
    const grid = new Grid(width, height, 1);
    const snapPoints = new Map();
    return new Structure(width, height, grid, snapPoints);
}
export const filler = createFiller();
