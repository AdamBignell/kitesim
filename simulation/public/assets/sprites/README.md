# How to Add New Sprite Sheets

This directory contains the sprite sheet images for the game. Follow these instructions to add your own custom sprites.

## 1. Sprite Sheet Specifications

Before you start creating, it's important to have a consistent set of standards for your sprite sheets. This will make the process of adding them to the game much smoother.

### Frame Dimensions

For human characters, especially those who will be holding weapons, we recommend a frame size of **64x64 pixels**. This provides enough space for character details and held items, like swords or wands, without being excessively large.

*   **Standard Character:** 64x64 pixels
*   **Larger Characters/Bosses:** You might consider 128x128 pixels.

**Important:** Every frame in your sprite sheet must have the exact same dimensions.

### Sprite Sheet Layout

Your sprite sheet should be a single **PNG** file with a transparent background. The frames of your animation should be laid out in a grid, starting from the top-left corner. The game will read the frames from left to right, and then top to bottom.

For example, an 8-frame animation on a sheet with 4 frames per row would look like this:

```
[Frame 0] [Frame 1] [Frame 2] [Frame 3]
[Frame 4] [Frame 5] [Frame 6] [Frame 7]
```

### Animation Cycle Recommendations

Here are some guidelines for creating smooth and believable animations for common character actions.

#### Idle Animation (4 frames)

The idle animation is what plays when the character is standing still. It should be a subtle loop that makes the character feel alive.

*   **Frame Count:** 4 frames is usually sufficient.
*   **What it should look like:** A gentle up-and-down breathing motion, a slight bounce, or the character shifting their weight.

#### Walking Animation (8 frames)

A good walking animation is key to a believable character.

*   **Frame Count:** 8 frames provides a very smooth and natural-looking walk cycle.
*   **What it should look like:** An 8-frame walk cycle typically captures the key poses of a step: contact, down (recoil), passing, and up (high point). With 8 frames, you can create a full cycle for one leg, then mirror it or create a separate one for the other leg, resulting in a complete two-step animation.

#### Running / Sprinting Animation (6-8 frames)

A running animation should be more dynamic and energetic than a walk.

*   **Frame Count:** 6 to 8 frames. A slightly lower frame count (like 6) can sometimes feel faster and more frantic.
*   **What it should look like:** Exaggerated arm and leg movements. The character should lean forward more, and there should be a clear "airborne" pose where both feet are off the ground.

## 2. How to Add a New Sprite Sheet to the Game

To add a new sprite sheet and its corresponding animation to the game, you need to modify the `simulation/src/game/GameScene.js` file.

### Step 1: Place the Sprite Sheet File

Place your new sprite sheet file (e.g., `player_walk.png`) into this directory (`simulation/public/assets/sprites`).

### Step 2: Load the Sprite Sheet in `preload()`

In the `preload()` function in `GameScene.js`, use `this.load.spritesheet()` to load your new image. You'll need to specify the `frameWidth` and `frameHeight` that you decided on earlier (e.g., 64x64).

For example, to replace the placeholder `walk` sprite:

```javascript
// In preload()

// This...
this.load.svg('walk', 'assets/sprites/walk.svg', { width: 32, height: 32 });

// ...becomes this:
this.load.spritesheet('walk', 'assets/sprites/walk.png', { frameWidth: 64, frameHeight: 64 });
```

If you are adding a completely new animation (e.g., an attack), just add a new line:

```javascript
this.load.spritesheet('attack', 'assets/sprites/attack.png', { frameWidth: 64, frameHeight: 64 });
```

### Step 3: Create the Animation in `create()`

In the `create()` function, find the `this.anims.create()` blocks. This is where you define how the frames from your sprite sheet are turned into a playable animation.

To update an existing animation, like `walk`, you'll need to tell it which frames to use from your new sprite sheet. The `frames` property uses `this.anims.generateFrameNumbers()` to specify a range of frames.

For our 8-frame walking animation, the change would look like this:

```javascript
// In create()

// This...
this.anims.create({
  key: 'walk',
  frames: [{ key: 'walk', frame: 0 }],
  frameRate: 1,
  repeat: -1
});

// ...becomes this:
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 7 }), // Use frames 0 through 7
  frameRate: 10, // Adjust this to control animation speed
  repeat: -1     // -1 means loop forever
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
