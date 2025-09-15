from playwright.sync_api import sync_playwright
import logging

logging.basicConfig(level=logging.INFO)

def run():
    with sync_playwright() as p:
        logging.info("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        logging.info("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        logging.info("Waiting for canvas...")
        page.wait_for_selector("canvas")
        logging.info("Taking screenshot...")
        page.screenshot(path="../jules-scratch/verification/screenshot.png")
        logging.info("Screenshot saved to ../jules-scratch/verification/screenshot.png")
        browser.close()
        logging.info("Browser closed.")

if __name__ == "__main__":
    run()
