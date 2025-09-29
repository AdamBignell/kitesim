import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Define a handler to capture and print all console messages.
        def log_console_message(msg):
            print(f"Browser Console [{msg.type}]: {msg.text}")

        # Attach the listener for the 'console' event.
        page.on("console", log_console_message)

        try:
            print("Navigating to http://localhost:3000...")
            print("Listening for console messages...")
            # Navigate to the page. The .catch() block I added should now
            # print an error message to the console.
            await page.goto("http://localhost:3000", timeout=15000)

            print("Navigation successful. Waiting for any delayed messages...")
            await page.wait_for_timeout(5000)
            print("Script finished. Review console output for errors.")

        except Exception as e:
            print(f"\n--- A Playwright error occurred ---")
            print(f"{e}")
            print("This could mean the server crashed. Review console output.")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())