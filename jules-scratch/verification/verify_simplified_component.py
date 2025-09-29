import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            print("Navigating to http://localhost:3000 to test the simplified component...")
            await page.goto("http://localhost:3000", timeout=20000)

            print("Waiting for the canvas to appear...")
            canvas = page.locator("#phaser-container canvas")
            await expect(canvas).to_be_visible(timeout=20000)

            await page.wait_for_timeout(3000) # Allow time for rendering
            await page.screenshot(path="/app/jules-scratch/verification/simplified_component_works.png")
            print("SUCCESS! The simplified component has rendered the canvas.")
            print("Screenshot saved to /app/jules-scratch/verification/simplified_component_works.png")

        except Exception as e:
            print(f"FAILURE: The simplified component did not render the canvas.")
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())