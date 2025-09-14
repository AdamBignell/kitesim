# DisasterSword

## ❗ AI Assistant Directives ❗
**Primary Directive:** As this project evolves, you must keep this README.md file up to date. Specifically, any changes to the control scheme, core game mechanics, or file structure must be documented in the relevant sections below. This ensures that the project's description remains accurate for both human developers and for your own context in future development sessions.

**Pull Request Mandate:** Prefix all pull request descriptions with the string `[#disastersword]`.

## Quick Start
The simulation is a Next.js application. To run it locally, navigate to the `simulation/` directory and use the following commands:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
The application will be available at `http://localhost:3000`.

## About This Project
DisasterSword is an experimental, hybrid simulation and game. It is being developed as a procedurally generated, roguelike platformer.

The core concept is a persistent world where an autonomous character explores and "lives" on its own. The simulation runs independently, but a player can choose to intervene and take direct control of the character at any time, turning the simulation into a playable game.

## Current Features & Controls
*   **Platforming Environment**: The game is built using the **Phaser 3** engine and features a basic platforming environment with gravity and solid platforms.
*   **Autonomous AI Character**: A character navigates the world on its own. Its AI is currently simple: every two seconds, it randomly decides to move left, right, or stand still, with a chance of jumping if it is on the ground.
*   **Manual Player Control**: A player can take direct control of the character.
    *   **Move Left**: `Left Arrow`
    *   **Move Right**: `Right Arrow`
    *   **Jump**: `Up Arrow`
*   **Control Toggle**: Switch between AI and manual control mode at any time by pressing `Ctrl+P`.
*   **Respawn System**: If the character falls off the bottom of the screen, it automatically respawns at a set starting position.

## Code Structure
The project uses Next.js as its frontend framework and Phaser 3 as the core game engine.

*   `simulation/src/app/page.js`: The main entry point for the Next.js application. It loads the `GameLoader` component.

*   `simulation/src/components/`: Contains React components that bridge Next.js and Phaser.
    *   `GameLoader.js`: Dynamically loads the `PhaserGame` component on the client side only (`ssr: false`).
    *   `PhaserGame.js`: Initializes and manages the Phaser game instance.

*   `simulation/src/game/`: The core directory for all Phaser logic.
    *   `phaserConfig.js`: Contains the main Phaser configuration object (dimensions, physics, etc.).
    *   `GameScene.js`: The primary scene file where game logic, AI, and player input are handled.
