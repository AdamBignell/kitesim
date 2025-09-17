from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Wait for the h2 element with the text "Disaster Sword" to be visible
        h2 = page.locator('h2', has_text='Disaster Sword')
        expect(h2).to_be_visible()

        page.screenshot(path="/app/jules-scratch/verification/screenshot.png")
        browser.close()

run()
