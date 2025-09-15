import * as Phaser from 'phaser';

export function bigStaircase(scene, platformsGroup) {
  const { width, height } = scene.scale;
  const stepWidth = 100;
  const stepHeight = 40;
  const numSteps = 5;

  for (let i = 0; i < numSteps; i++) {
    const x = width / 2 - (numSteps * stepWidth) / 2 + i * stepWidth;
    const y = height - (i + 1) * stepHeight;
    const step = scene.add.rectangle(x, y, stepWidth, 20, 0x000000);
    platformsGroup.add(step);
  }
}

export function floatingIsland(scene, platformsGroup) {
  const { width, height } = scene.scale;
  const islandWidth = 200;
  const islandHeight = 30;
  const x = Math.random() * (width - islandWidth);
  const y = height / 2 + (Math.random() - 0.5) * 200;

  const island = scene.add.rectangle(x + islandWidth / 2, y, islandWidth, islandHeight, 0x000000);
  platformsGroup.add(island);
}

export function emptyChasm(scene, platformsGroup) {
  const { width, height } = scene.scale;
  const chasmWidth = 200;
  const floorHeight = 20;

  const leftPlatformWidth = (width - chasmWidth) / 2;
  const rightPlatformWidth = (width - chasmWidth) / 2;

  const leftPlatform = scene.add.rectangle(leftPlatformWidth / 2, height - floorHeight / 2, leftPlatformWidth, floorHeight, 0x000000);
  const rightPlatform = scene.add.rectangle(width - rightPlatformWidth / 2, height - floorHeight / 2, rightPlatformWidth, floorHeight, 0x000000);

  platformsGroup.add(leftPlatform);
  platformsGroup.add(rightPlatform);
}

export function bridge(scene, platformsGroup) {
  const { width } = scene.scale;
  const segmentWidth = 50;
  const numSegments = 6;
  const y = 350;
  const totalWidth = numSegments * segmentWidth;
  const startX = (width - totalWidth) / 2;

  for (let i = 0; i < numSegments; i++) {
    const x = startX + i * segmentWidth;
    const segment = scene.add.rectangle(x, y, segmentWidth - 5, 10, 0x000000);
    platformsGroup.add(segment);
  }
}

export function overhang(scene, platformsGroup) {
  const { width, height } = scene.scale;
  const overhangWidth = 200;
  const overhangHeight = 20;
  const x = Math.random() > 0.5 ? 0 : width - overhangWidth;
  const y = height / 2 - 100;

  const overhang = scene.add.rectangle(x + overhangWidth / 2, y, overhangWidth, overhangHeight, 0x000000);
  platformsGroup.add(overhang);
}

// --- New Structures Batch 1 ---

export function singleSmallPlatform(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const platform = scene.add.rectangle(x, y, 50, 20, 0x000000);
    platformsGroup.add(platform);
}

export function singleMediumPlatform(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const platform = scene.add.rectangle(x, y, 100, 20, 0x000000);
    platformsGroup.add(platform);
}

export function singleLargePlatform(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const platform = scene.add.rectangle(x, y, 200, 20, 0x000000);
    platformsGroup.add(platform);
}

export function verticalStack(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const startY = height / 2;
    for (let i = 0; i < 4; i++) {
        const platform = scene.add.rectangle(x, startY + i * 60, 80, 20, 0x000000);
        platformsGroup.add(platform);
    }
}

export function horizontalRow(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const y = Math.random() * height;
    const startX = width / 4;
    for (let i = 0; i < 4; i++) {
        const platform = scene.add.rectangle(startX + i * 100, y, 80, 20, 0x000000);
        platformsGroup.add(platform);
    }
}

export function scatteredSmallPlatforms(scene, platformsGroup) {
    const { width, height } = scene.scale;
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const platform = scene.add.rectangle(x, y, 40, 20, 0x000000);
        platformsGroup.add(platform);
    }
}

export function steppingStones(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const y = height - 50;
    const startX = width / 2 - 150;
    for (let i = 0; i < 6; i++) {
        const platform = scene.add.rectangle(startX + i * 50, y - i * 10, 30, 20, 0x000000);
        platformsGroup.add(platform);
    }
}

export function wideGap(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const y = height - 100;
    const leftPlatform = scene.add.rectangle(width / 4, y, width / 2, 20, 0x000000);
    const rightPlatform = scene.add.rectangle(width * 3/4, y, width / 2, 20, 0x000000);
    platformsGroup.add(leftPlatform);
    platformsGroup.add(rightPlatform);
}

export function vShape(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < 4; i++) {
        const left = scene.add.rectangle(centerX - 20 - i*30, centerY + i*30, 80, 20, 0x000000);
        const right = scene.add.rectangle(centerX + 20 + i*30, centerY + i*30, 80, 20, 0x000000);
        platformsGroup.add(left);
        platformsGroup.add(right);
    }
}

export function uShape(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const centerX = width / 2;
    const bottomY = height - 50;
    const sideHeight = 100;
    const platformWidth = 20;

    const bottom = scene.add.rectangle(centerX, bottomY, 150, platformWidth, 0x000000);
    const left = scene.add.rectangle(centerX - 75, bottomY - sideHeight/2, platformWidth, sideHeight, 0x000000);
    const right = scene.add.rectangle(centerX + 75, bottomY - sideHeight/2, platformWidth, sideHeight, 0x000000);
    platformsGroup.add(bottom);
    platformsGroup.add(left);
    platformsGroup.add(right);
}

export function zigZag(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const startY = height - 50;
    let x = width / 2 - 100;
    for (let i = 0; i < 5; i++) {
        const platform = scene.add.rectangle(x, startY - i * 50, 100, 20, 0x000000);
        platformsGroup.add(platform);
        x = (i % 2 === 0) ? x + 100 : x - 100;
    }
}

export function pyramid(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const bottomY = height - 20;
    const platformWidth = 40;
    const platformHeight = 20;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = (width/2) - (row * platformWidth / 2) + (col * platformWidth);
            const y = bottomY - row * platformHeight;
            const platform = scene.add.rectangle(x, y, platformWidth, platformHeight, 0x000000);
            platformsGroup.add(platform);
        }
    }
}

export function wallForJumping(scene, platformsGroup) {
    const { height } = scene.scale;
    const x = 100;
    const y = height / 2;
    const wall = scene.add.rectangle(x, y, 20, 200, 0x000000);
    platformsGroup.add(wall);
}

export function floatingBlockWithHole(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const centerX = width/2;
    const centerY = height/2;
    const size = 150;
    const thickness = 20;
    const top = scene.add.rectangle(centerX, centerY - size/2, size, thickness, 0x000000);
    const bottom = scene.add.rectangle(centerX, centerY + size/2, size, thickness, 0x000000);
    const left = scene.add.rectangle(centerX - size/2, centerY, thickness, size, 0x000000);
    const right = scene.add.rectangle(centerX + size/2, centerY, thickness, size, 0x000000);
    platformsGroup.add(top);
    platformsGroup.add(bottom);
    platformsGroup.add(left);
    platformsGroup.add(right);
}

export function highRoof(scene, platformsGroup) {
    const { width } = scene.scale;
    const roof = scene.add.rectangle(width/2, 50, width/2, 20, 0x000000);
    platformsGroup.add(roof);
}

// --- New Structures Batch 2 ---

export function archway(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const centerX = width / 2;
    const bottomY = height - 100;
    const archHeight = 120;
    const archWidth = 100;
    const thickness = 20;

    const leftPillar = scene.add.rectangle(centerX - archWidth/2, bottomY + archHeight/2, thickness, archHeight, 0x000000);
    const rightPillar = scene.add.rectangle(centerX + archWidth/2, bottomY + archHeight/2, thickness, archHeight, 0x000000);
    const top = scene.add.rectangle(centerX, bottomY, archWidth, thickness, 0x000000);
    platformsGroup.add(leftPillar);
    platformsGroup.add(rightPillar);
    platformsGroup.add(top);
}

export function ruinedWall(scene, platformsGroup) {
    const { height } = scene.scale;
    const x = Math.random() * scene.scale.width;
    for(let i=0; i<4; i++) {
        const segment = scene.add.rectangle(x, height - 20 - i*20, 60 - i*10, 20, 0x000000);
        platformsGroup.add(segment);
    }
}

export function smallHut(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height - 50;
    const hutWidth = 100;
    const hutHeight = 60;
    const wall = scene.add.rectangle(x, y, hutWidth, hutHeight, 0x000000);
    const roof = scene.add.rectangle(x, y - hutHeight/2, hutWidth + 20, 20, 0x000000);
    platformsGroup.add(wall);
    platformsGroup.add(roof);
}

export function tower(scene, platformsGroup) {
    const { height } = scene.scale;
    const x = scene.scale.width - 100;
    const towerHeight = 300;
    const towerWidth = 80;
    const tower = scene.add.rectangle(x, height - towerHeight/2, towerWidth, towerHeight, 0x000000);
    platformsGroup.add(tower);
    for(let i=0; i<4; i++) {
        const platform = scene.add.rectangle(x, height - 60 - i*80, 120, 20, 0x000000);
        platformsGroup.add(platform);
    }
}

export function balcony(scene, platformsGroup) {
    const { height } = scene.scale;
    const x = 100;
    const y = height / 2;
    const wall = scene.add.rectangle(x, y, 20, 200, 0x000000);
    const floor = scene.add.rectangle(x + 60, y + 100, 100, 20, 0x000000);
    platformsGroup.add(wall);
    platformsGroup.add(floor);
}

export function chimney(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const shaftHeight = height;
    const shaftWidth = 100;
    const thickness = 20;
    const left = scene.add.rectangle(x - shaftWidth/2, shaftHeight/2, thickness, shaftHeight, 0x000000);
    const right = scene.add.rectangle(x + shaftWidth/2, shaftHeight/2, thickness, shaftHeight, 0x000000);
    platformsGroup.add(left);
    platformsGroup.add(right);
}

export function pipework(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x1 = width * 1/4;
    const y1 = height * 1/4;
    const x2 = width * 3/4;
    const y2 = height * 3/4;
    const pipe1 = scene.add.rectangle(x1, y1, 200, 20, 0x000000);
    const pipe2 = scene.add.rectangle(x2, y1, 20, 200, 0x000000);
    const pipe3 = scene.add.rectangle(x1, y2, 20, 200, 0x000000);
    const pipe4 = scene.add.rectangle(x2, y2, 200, 20, 0x000000);
    platformsGroup.add(pipe1);
    platformsGroup.add(pipe2);
    platformsGroup.add(pipe3);
    platformsGroup.add(pipe4);
}

export function crystalCluster(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < 5; i++) {
        const x = centerX + (Math.random() - 0.5) * 100;
        const y = centerY + (Math.random() - 0.5) * 100;
        const crystal = scene.add.rectangle(x, y, 20 + Math.random()*20, 40 + Math.random()*40, 0x000000);
        crystal.angle = (Math.random() - 0.5) * 45;
        platformsGroup.add(crystal);
    }
}

export function tree(scene, platformsGroup) {
    const { height } = scene.scale;
    const x = scene.scale.width / 2;
    const trunkHeight = 150;
    const trunk = scene.add.rectangle(x, height - trunkHeight/2, 30, trunkHeight, 0x000000);
    platformsGroup.add(trunk);
    const canopy = scene.add.rectangle(x, height-trunkHeight, 120, 80, 0x000000);
    platformsGroup.add(canopy);
}

export function cloudPlatform(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const y = height / 4;
    for (let i=0; i<3; i++) {
        const puff = scene.add.rectangle(x + i*30 - 30, y, 50, 30, 0x000000);
        platformsGroup.add(puff);
    }
}

export function floorSpikes(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const startX = width / 2 - 100;
    for (let i=0; i<10; i++) {
        const spike = scene.add.triangle(startX + i*20, height - 10, 0, 20, 10, 0, 20, 20, 0x000000);
        platformsGroup.add(spike);
    }
}

export function ceilingSpikes(scene, platformsGroup) {
    const { width } = scene.scale;
    const startX = width / 2 - 100;
    for (let i=0; i<10; i++) {
        const spike = scene.add.triangle(startX + i*20, 10, 0, 0, 10, 20, 20, 0, 0x000000);
        platformsGroup.add(spike);
    }
}

export function lavaPit(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const pit = scene.add.rectangle(width/2, height - 10, width/2, 20, 0xff0000);
    platformsGroup.add(pit);
}

export function crusher(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height / 2;
    const top = scene.add.rectangle(x, y - 50, 100, 100, 0x000000);
    const bottom = scene.add.rectangle(x, y + 50, 100, 100, 0x000000);
    platformsGroup.add(top);
    platformsGroup.add(bottom);
}

// --- New Structures Batch 3 ---

export function pillar(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const pillar = scene.add.rectangle(x, height/2, 30, height, 0x000000);
    platformsGroup.add(pillar);
}

export function seriesOfPillars(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const startX = width / 4;
    for (let i = 0; i < 4; i++) {
        const pillar = scene.add.rectangle(startX + i * 150, height/2, 30, height, 0x000000);
        platformsGroup.add(pillar);
    }
}

export function stalactite(scene, platformsGroup) {
    const { width } = scene.scale;
    const x = Math.random() * width;
    const stalactite = scene.add.triangle(x, 0, 0, 0, 15, 50, 30, 0, 0x000000);
    platformsGroup.add(stalactite);
}

export function stalagmite(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const stalagmite = scene.add.triangle(x, height, 0, 50, 15, 0, 30, 50, 0x000000);
    platformsGroup.add(stalagmite);
}

export function cage(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const centerX = width/2;
    const centerY = height/2;
    const size = 200;
    const spacing = 40;
    for (let i = 0; i < 6; i++) {
        const verticalBar = scene.add.rectangle(centerX - size/2 + i * spacing, centerY, 10, size, 0x000000);
        const horizontalBar = scene.add.rectangle(centerX, centerY - size/2 + i * spacing, size, 10, 0x000000);
        platformsGroup.add(verticalBar);
        platformsGroup.add(horizontalBar);
    }
}

export function throne(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height - 50;
    const seat = scene.add.rectangle(x, y, 80, 20, 0x000000);
    const back = scene.add.rectangle(x, y - 40, 20, 80, 0x000000);
    platformsGroup.add(seat);
    platformsGroup.add(back);
}

export function simpleHouse(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height - 80;
    const base = scene.add.rectangle(x, y, 150, 100, 0x000000);
    const roof = scene.add.triangle(x, y-50, -80, 0, 0, -50, 80, 0, 0x000000);
    platformsGroup.add(base);
    platformsGroup.add(roof);
}

export function waterfall(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    for (let i = 0; i < 15; i++) {
        const drop = scene.add.rectangle(x + (Math.random() - 0.5) * 40, i * 40, 30, 15, 0x0000ff);
        platformsGroup.add(drop);
    }
}

export function canyon(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const gap = 200;
    const left = scene.add.rectangle(width/4, height/2, width/2 - gap/2, height, 0x000000);
    const right = scene.add.rectangle(width*3/4, height/2, width/2 - gap/2, height, 0x000000);
    platformsGroup.add(left);
    platformsGroup.add(right);
}

export function templeEntrance(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height - 100;
    const base = scene.add.rectangle(x, y, 250, 20, 0x000000);
    const leftPillar = scene.add.rectangle(x - 100, y - 50, 20, 100, 0x000000);
    const rightPillar = scene.add.rectangle(x + 100, y - 50, 20, 100, 0x000000);
    const lintel = scene.add.rectangle(x, y - 100, 250, 20, 0x000000);
    platformsGroup.add(base);
    platformsGroup.add(leftPillar);
    platformsGroup.add(rightPillar);
    platformsGroup.add(lintel);
}

export function bunker(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height - 40;
    const bunker = scene.add.rectangle(x, y, 200, 80, 0x000000);
    platformsGroup.add(bunker);
}

export function smallAlcove(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height - 50;
    const wall = scene.add.rectangle(x, y, 200, 20, 0x000000);
    const back = scene.add.rectangle(x, y - 30, 20, 60, 0x000000);
    platformsGroup.add(wall);
    platformsGroup.add(back);
}

export function sawblade(scene, platformsGroup) {
    const { width, height } = scene.scale;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const blade = scene.add.circle(x, y, 40, 0x000000);
    platformsGroup.add(blade);
}

export function crumblingBridge(scene, platformsGroup) {
    const { width } = scene.scale;
    const segmentWidth = 50;
    const numSegments = 8;
    const y = 350;
    const totalWidth = numSegments * segmentWidth;
    const startX = (width - totalWidth) / 2;

    for (let i = 0; i < numSegments; i++) {
        if (Math.random() > 0.3) {
            const x = startX + i * segmentWidth;
            const segment = scene.add.rectangle(x, y, segmentWidth - 5, 10, 0x000000);
            platformsGroup.add(segment);
        }
    }
}
