from playwright.sync_api import sync_playwright, Page, expect

def verify_terrain_generation(page: Page):
    """
    This script verifies that the new spline-based terrain is being rendered.
    """
    # 1. Navigate to the application.
    # Assuming the dev server is on port 3000, which is standard for Next.js.
    page.goto("http://localhost:3000", timeout=60000)

    # 2. Wait for the game canvas to be ready.
    # The Phaser game is rendered within a canvas element. We'll wait for it to be visible.
    canvas = page.locator("canvas")
    expect(canvas).to_be_visible(timeout=30000) # Wait up to 30s for the game to load

    # 3. Give the game a moment to stabilize and generate the initial chunk.
    # The terrain and player should appear within this time.
    page.wait_for_timeout(5000) # 5 seconds

    # 4. Take a screenshot for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")

# Boilerplate to run the script in a self-contained way.
if __name__ == "__main__":
    with sync_playwright() as p:
        # Using chromium, ensuring it runs in headless mode.
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_terrain_generation(page)
            print("Verification script completed successfully.")
        except Exception as e:
            print(f"An error occurred during verification: {e}")
        finally:
            browser.close()
