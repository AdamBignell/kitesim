import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto("http://localhost:3000")

        # Wait for the game canvas to be visible
        canvas = page.locator('canvas')
        await expect(canvas).to_be_visible(timeout=10000) # 10 seconds timeout

        # Give the game a moment to render the level
        await page.wait_for_timeout(2000)

        await page.screenshot(path="verification.png")

        await browser.close()

asyncio.run(main())
