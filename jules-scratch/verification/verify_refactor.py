import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            print("Navigating to http://localhost:3000 to verify the refactor...")
            await page.goto("http://localhost:3000", timeout=20000)

            # 1. Verify Arcade Mode
            print("Waiting for Arcade mode canvas...")
            canvas = page.locator("#phaser-container canvas")
            await expect(canvas).to_be_visible(timeout=20000)
            await page.wait_for_timeout(3000) # Allow time for rendering
            await page.screenshot(path="/app/jules-scratch/verification/refactor_arcade_mode.png")
            print("Successfully captured screenshot of refactored Arcade mode.")

            # 2. Switch to and verify Matter Mode
            print("Switching to Matter mode...")
            matter_button = page.get_by_role("button", name="Matter")
            await expect(matter_button).to_be_visible()
            await matter_button.click()

            print("Waiting for Matter mode canvas...")
            await expect(canvas).to_be_visible(timeout=20000)
            await page.wait_for_timeout(3000) # Allow time for rendering
            await page.screenshot(path="/app/jules-scratch/verification/refactor_matter_mode.png")
            print("Successfully captured screenshot of refactored Matter mode.")

            print("\nRefactor verification successful! Both modes are functional.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())