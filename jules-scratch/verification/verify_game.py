from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Wait for the game canvas to be visible
    canvas = page.locator('canvas').first
    expect(canvas).to_be_visible(timeout=30000)

    # Give the game a moment to render something
    page.wait_for_timeout(2000)

    # Ensure the directory exists
    output_dir = "/app/jules-scratch/verification"
    os.makedirs(output_dir, exist_ok=True)

    page.screenshot(path=os.path.join(output_dir, "verification.png"))
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
