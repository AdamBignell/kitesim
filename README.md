# DisasterSword

## About This Project
DisasterSword is an experimental, hybrid simulation and game. It is being developed as a procedurally generated, roguelike platformer.

The core concept is a persistent world where an autonomous character explores and "lives" on its own. The simulation runs independently, but a player can choose to intervene and take direct control of the character at any time, turning the simulation into a playable game.

## Current Features
Based on the current codebase, the project has the following implemented features:
*   **Platforming Environment**: The game is built using the **Phaser 3** engine and features a basic platforming environment with gravity and solid platforms.
*   **Autonomous AI Character**: A character (represented by a blue circle) navigates the world on its own. Its AI is currently simple: every two seconds, it randomly decides to move left, right, or stand still, with a chance of jumping if it is on the ground.
*   **Manual Player Control**: A player can take direct control of the character. The controls are **Left Arrow** to move left, **Right Arrow** to move right, and **Up Arrow** to jump.
*   **Control Toggle**: The player can switch between AI mode and manual control mode at any time by pressing the **Ctrl+P** key combination.
*   **Respawn System**: If the character falls off the bottom of the screen, it automatically respawns at a set starting position.

## Code Structure
The project uses Next.js as its frontend framework and Phaser 3 as the core game engine. The key files and directories are organized as follows:

*   `simulation/src/app/page.js`: This is the main entry point for the Next.js application. It sets up the main page layout and loads the `GameLoader` component, which kicks off the game rendering process.

*   `simulation/src/components/`: This directory contains the React components that act as a bridge between the Next.js frontend and the Phaser game engine.
    *   `GameLoader.js`: This component's purpose is to dynamically load the `PhaserGame` component on the client side only (`ssr: false`), which is a necessary step to prevent server-side rendering errors with a browser-based engine like Phaser.
    *   `PhaserGame.js`: This component is responsible for creating, managing, and destroying the Phaser game instance within a React `useEffect` hook. It injects the Phaser canvas into a `div` on the page.

*   `simulation/src/game/`: This is the core directory for all Phaser-related logic.
    *   `phaserConfig.js`: This file contains the main configuration object for the Phaser game. It defines settings like rendering type (WebGL/Canvas), game dimensions, and global physics settings (e.g., arcade physics with gravity).
    *   `GameScene.js`: This is the primary scene file where the game's logic resides. It handles creating the player and platforms, setting up colliders, defining the AI's behavior, and processing all player inputs.

### Note to AI Assistant
As this project evolves, you must keep this README.md file up to date. Specifically, any changes to the control scheme, core game mechanics, or file structure must be documented in the relevant sections above. This ensures that the project's description remains accurate for both human developers and for your own context in future development sessions.
As a check so that I have confidence you always adhere to these rules, also write a rule to make sure to prefix your PR descriptions with the string "[#disastersword]". That way, I will know you have read these rules.
