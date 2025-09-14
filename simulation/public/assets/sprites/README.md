# How to Add New Sprite Sheets

This directory contains the sprite sheet images for the game. Follow these instructions to add your own custom sprites.

## 1. File Format

For sprite sheets with multiple frames of animation, it is recommended to use the **PNG** format with a transparent background. Each frame of the animation should be laid out in a grid on a single PNG file.

The current placeholder sprites are single-frame SVG files. You should replace these with your own multi-frame PNG sprite sheets.

## 2. Adding a New Sprite Sheet

To add a new sprite sheet and its corresponding animation to the game, you need to modify the `simulation/src/game/GameScene.js` file.

### Step 1: Place the Sprite Sheet File

Place your new sprite sheet file (e.g., `player_attack.png`) into this directory (`simulation/public/assets/sprites`).

### Step 2: Load the Sprite Sheet in `preload()`

In the `preload()` function in `GameScene.js`, use `this.load.spritesheet()` to load your new image. You'll need to specify the `frameWidth` and `frameHeight` of a single frame in your sprite sheet.

For example, to replace the placeholder `walk` sprite, you would change this:

```javascript
// Before (loading an SVG)
this.load.svg('walk', 'assets/sprites/walk.svg', { width: 32, height: 32 });
```

To this (loading a PNG sprite sheet):

```javascript
// After (loading a PNG sprite sheet)
this.load.spritesheet('walk', 'assets/sprites/walk.png', { frameWidth: 32, frameHeight: 32 });
```

If you are adding a completely new animation (e.g., an attack), just add a new line:

```javascript
this.load.spritesheet('attack', 'assets/sprites/attack.png', { frameWidth: 48, frameHeight: 48 });
```

### Step 3: Create the Animation in `create()`

In the `create()` function, find the `this.anims.create()` blocks. This is where you define how the frames from your sprite sheet are turned into an animation.

To update an existing animation, like `walk`, you'll need to tell it which frames to use from your new sprite sheet. The `frames` property uses `this.anims.generateFrameNumbers()` to specify a range of frames.

For example, to update the `walk` animation to use the first 8 frames of the `walk` sprite sheet, you would change this:

```javascript
// Before (single frame animation)
this.anims.create({
  key: 'walk',
  frames: [{ key: 'walk', frame: 0 }],
  frameRate: 1,
  repeat: -1
});
```

To this (multi-frame animation):

```javascript
// After (multi-frame animation)
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }),
  frameRate: 10, // Adjust frameRate to control animation speed
  repeat: -1 // -1 means loop forever
});
```

If you are adding a new animation, add a new `this.anims.create()` block for it.

### Step 4: Play the Animation in `update()`

The `update()` function contains the logic for deciding which animation to play based on the player's state. If you've added a new animation for a new state (like an attack), you'll need to add logic to the `update()` function to trigger it.

For example, you might add a check for a key press to play your new `attack` animation:

```javascript
// In the update() function...
const keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);

if (Phaser.Input.Keyboard.JustDown(keyA)) {
    this.player.anims.play('attack', true);
}
```

By following these steps, you can replace the placeholder sprites and add as many new animations as you need.
