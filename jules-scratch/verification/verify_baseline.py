import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # 1. Navigate to the running application.
            await page.goto("http://localhost:3000")

            # 2. Wait for the Phaser canvas to appear to ensure the game has loaded.
            canvas = page.locator("#phaser-container canvas")
            await expect(canvas).to_be_visible(timeout=20000)

            # Give the game a moment to render the initial scene
            await page.wait_for_timeout(3000)

            # 3. Take a screenshot of the default Arcade mode.
            await page.screenshot(path="/app/jules-scratch/verification/baseline_arcade_mode.png")
            print("Successfully captured screenshot of baseline Arcade mode.")

            # 4. Find and click the "Matter" button in the debug menu.
            matter_button = page.get_by_role("button", name="Matter")
            await expect(matter_button).to_be_visible()
            await matter_button.click()
            print("Switched to Matter mode.")

            # 5. Wait for the game to reload by waiting for the canvas to be re-attached.
            await expect(canvas).to_be_visible(timeout=20000)

            # Give the game a moment to render the Matter.js scene
            await page.wait_for_timeout(3000)

            # 6. Take a screenshot of the Matter mode.
            await page.screenshot(path="/app/jules-scratch/verification/baseline_matter_mode.png")
            print("Successfully captured screenshot of baseline Matter mode.")

            print("\nBaseline verification successful!")

        except Exception as e:
            print(f"An error occurred during baseline verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())