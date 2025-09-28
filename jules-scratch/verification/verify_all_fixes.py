import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the simulation
    page.goto("http://localhost:3000")

    # Wait for the game to load and switch to Matter mode
    canvas = page.locator('canvas').first
    expect(canvas).to_be_visible(timeout=30000)
    page.get_by_role("button", name="Matter").click()
    time.sleep(2) # Wait for scene to reload

    # 1. Verify Possess/Release and Idle Animation
    possess_button = page.locator('button:has-text("Possess")')
    expect(possess_button).to_be_visible()
    page.screenshot(path="jules-scratch/verification/01_idle_start.png")

    possess_button.click()
    release_button = page.locator('button:has-text("Release")')
    expect(release_button).to_be_visible()

    # 2. Verify Walking Animation
    page.keyboard.press('ArrowRight')
    time.sleep(1) # Walk for a bit
    page.screenshot(path="jules-scratch/verification/02_walking.png")
    page.keyboard.up('ArrowRight')
    time.sleep(0.5)

    # 3. Verify Jump Animation and Replenishment
    # First jump
    page.keyboard.press('Space')
    time.sleep(0.5) # In the air
    page.screenshot(path="jules-scratch/verification/03_jumping.png")
    time.sleep(2) # Land

    # Second jump (verifies replenishment)
    page.keyboard.press('Space')
    time.sleep(0.5)
    page.screenshot(path="jules-scratch/verification/04_second_jump.png")

    # 4. Release control
    release_button.click()
    expect(possess_button).to_be_visible()

    browser.close()

with sync_playwright() as playwright:
    run(playwright)