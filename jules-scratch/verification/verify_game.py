import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:3000")

        # Wait for the first Phaser canvas to be ready
        await expect(page.locator("#phaser-container canvas").first).to_be_visible(timeout=15000)

        # Now, wait for the button and click it. Using get_by_text as an alternative locator.
        possess_button = page.get_by_text("🌀 Possess")
        await expect(possess_button).to_be_enabled(timeout=5000)
        await possess_button.click()

        # Wait for the game to be ready for input
        await page.wait_for_timeout(1000)

        # Sprint to the right to test speed
        await page.keyboard.down("Shift")
        await page.keyboard.down("ArrowRight")
        await page.wait_for_timeout(500) # Sprint for 0.5s
        await page.keyboard.up("ArrowRight")
        await page.keyboard.up("Shift")

        # Move to a corner on the left
        await page.keyboard.down("ArrowLeft")
        await page.wait_for_timeout(1000) # Move left for 1s to ensure we hit a wall

        # We should now be against the left wall. Press into it to test the fix.
        # Screenshot will be taken while pressing into the wall.
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await page.keyboard.up("ArrowLeft")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
