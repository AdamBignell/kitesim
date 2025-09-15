from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game
        page.goto("http://localhost:3000")

        # Wait for the game canvas to be visible
        canvas = page.locator('canvas').first
        expect(canvas).to_be_visible(timeout=30000) # Wait up to 30 seconds

        # Give the game a moment to render the scene
        page.wait_for_timeout(2000)

        # Take a screenshot
        import os
        # Get the absolute path to the project root
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        screenshot_path = os.path.join(project_root, 'jules-scratch', 'verification', 'spawn_verification.png')
        page.screenshot(path=screenshot_path)

        browser.close()

if __name__ == "__main__":
    run_verification()
