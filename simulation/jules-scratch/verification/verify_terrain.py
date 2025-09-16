import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # 1. Navigate to the game.
            await page.goto("http://localhost:3000")

            # 2. Wait for the game canvas to be visible.
            canvas = page.locator("canvas")
            await expect(canvas).to_be_visible(timeout=20000) # Increased timeout for initial load

            # Give the game a moment to settle
            await page.wait_for_timeout(1000)

            # 3. Take a screenshot of the initial state to see the smooth terrain
            await page.screenshot(path="simulation/jules-scratch/verification/initial_terrain.png")

            # 4. Click the "Possess" button to take control of the player.
            possess_button = page.get_by_role("button", name="🌀 Possess")
            await expect(possess_button).to_be_visible()
            await possess_button.click()

            # 5. Move the player to the right to test auto-stepping.
            await page.keyboard.down("ArrowRight")
            await page.wait_for_timeout(2000) # Hold the key for 2 seconds
            await page.keyboard.up("ArrowRight")

            # 6. Take a final screenshot showing the player on the new terrain.
            await page.screenshot(path="simulation/jules-scratch/verification/verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Take a screenshot on error to help debug
            await page.screenshot(path="simulation/jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
