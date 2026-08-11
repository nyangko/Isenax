"""E2E test: place multiple nodes, then undo/redo through them."""
import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains


SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots")


def get_base_url():
    return os.getenv("ISENAX_TEST_URL", "http://localhost:3000")


def get_webdriver_url():
    return os.getenv("WEBDRIVER_URL", "http://localhost:4444")


@pytest.fixture(scope="function")
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    d = webdriver.Remote(
        command_executor=get_webdriver_url(),
        options=chrome_options,
    )
    d.implicitly_wait(10)
    yield d
    d.quit()


def save_screenshot(driver, name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    driver.save_screenshot(path)
    return path


def dismiss_modals(driver):
    """Dismiss all modals, dialogs, and tip popups."""
    try:
        driver.execute_script("""
            // Close MUI dialogs
            const dialogs = document.querySelectorAll('[role="dialog"], [class*="MuiDialog"]');
            dialogs.forEach(d => {
                const closeBtn = d.querySelector('button');
                if (closeBtn) closeBtn.click();
            });
            // Close tip popups (X buttons)
            const closeIcons = document.querySelectorAll('[data-testid="CloseIcon"], [data-testid="ClearIcon"]');
            closeIcons.forEach(icon => {
                const btn = icon.closest('button');
                if (btn) btn.click();
            });
            // Close anything with a close/dismiss aria-label
            document.querySelectorAll('button').forEach(btn => {
                const label = (btn.getAttribute('aria-label') || '').toLowerCase();
                if (label.includes('close') || label.includes('dismiss')) btn.click();
            });
        """)
        time.sleep(0.5)
        # Second pass to catch the lazy loading modal that may appear later
        driver.execute_script("""
            const dialogs = document.querySelectorAll('[role="dialog"], [class*="MuiDialog"]');
            dialogs.forEach(d => {
                const btns = d.querySelectorAll('button');
                btns.forEach(b => { if (b.textContent.trim() === '×' || b.querySelector('svg')) b.click(); });
            });
        """)
        time.sleep(0.3)
    except Exception:
        pass


def count_canvas_images(driver):
    return driver.execute_script("""
        const c = document.querySelector('.isenax-container');
        if (!c) return 0;
        return c.querySelectorAll('img').length;
    """)


def get_model_items_count(driver):
    """Get model items count via React fiber store discovery."""
    return driver.execute_script("""
        var root = document.getElementById("root");
        var ck = Object.keys(root).find(function(k) { return k.startsWith("__reactContainer"); });
        if (!ck) return -1;
        var fiber = root[ck], queue = [fiber], v = 0;
        while (queue.length > 0 && v < 3000) {
            var n = queue.shift(); if (!n) continue; v++;
            if (n.pendingProps && n.pendingProps.value &&
                typeof n.pendingProps.value === "object" && n.pendingProps.value !== null &&
                typeof n.pendingProps.value.getState === "function") {
                try {
                    var st = n.pendingProps.value.getState();
                    if (st && st.views !== undefined && st.items !== undefined) {
                        return (st.items || []).length;
                    }
                } catch(e) {}
            }
            if (n.child) queue.push(n.child);
            if (n.sibling) queue.push(n.sibling);
        }
        return -1;
    """)


def place_node_at(driver, x_offset, y_offset):
    """Select icon and place at a specific canvas offset."""
    # Click "Add Item (N)" button
    add_btn = driver.find_element(By.CSS_SELECTOR, "button[aria-label*='Add Item']")
    add_btn.click()

    # Placing a node now opens the docked Layers panel (in its Edit tab) to
    # host the icon picker, instead of a standalone floating panel -- that's
    # an extra mount + tab-switch render cycle, so poll for the category
    # button instead of trusting a fixed sleep.
    deadline = time.time() + 5
    category_btn = None
    while category_btn is None and time.time() < deadline:
        category_btn = driver.execute_script("""
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent.trim().toUpperCase();
                if (text.includes('ISOFLOW') && !text.includes('IMPORT')) return btn;
            }
            return null;
        """)
        if category_btn is None:
            time.sleep(0.2)
    if category_btn is None:
        return False
    # JS-dispatched click rather than a real WebDriver click: the panel this
    # button lives in is still animating in (MUI transition), and a real
    # click gets intercepted by the transitioning Paper underneath it.
    driver.execute_script("arguments[0].click();", category_btn)

    # Wait for the expanded icon grid (many small-thumbnail buttons) rather
    # than grabbing the first "button > img" match -- a previously-selected
    # node's own "change icon" preview button in the Layers panel's Edit tab
    # matches that same shape and can still be on screen for a moment.
    deadline = time.time() + 5
    icon_count = 0
    while icon_count < 4 and time.time() < deadline:
        icon_count = driver.execute_script("""
            let n = 0;
            document.querySelectorAll('button').forEach(btn => {
                const img = btn.querySelector('img');
                if (img && img.naturalWidth > 0 && img.naturalWidth <= 100) n++;
            });
            return n;
        """)
        if icon_count < 4:
            time.sleep(0.2)

    first_icon_btn = driver.execute_script("""
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            const img = btn.querySelector('img');
            if (img && img.naturalWidth > 0 && img.naturalWidth <= 100) return btn;
        }
        return null;
    """)
    if first_icon_btn is None:
        return False

    ActionChains(driver).click(first_icon_btn).perform()
    time.sleep(0.5)

    # Placing an item selects it, which docks the Layers panel over the
    # right ~360px of the canvas (see LayersPanel/UiOverlay) -- close it so
    # later placements' click offsets can't land on the panel instead of
    # the canvas.
    driver.execute_script("""
        const closeBtn = document.querySelector('[data-testid="layers-panel-close"]');
        if (closeBtn) closeBtn.click();
    """)

    # Click on canvas at specific offset
    canvas = driver.find_element(By.CLASS_NAME, "isenax-container")
    ActionChains(driver).move_to_element_with_offset(canvas, x_offset, y_offset).click().perform()
    time.sleep(1)
    return True


def click_undo(driver):
    btn = driver.execute_script("""
        return document.querySelector("button[aria-label*='Undo']");
    """)
    if btn:
        btn.click()
        time.sleep(1)
        return True
    return False


def click_redo(driver):
    btn = driver.execute_script("""
        return document.querySelector("button[aria-label*='Redo']");
    """)
    if btn:
        btn.click()
        time.sleep(1)
        return True
    return False


def test_multi_node_undo_redo(driver):
    """Place 3 nodes, undo all 3, redo all 3, then undo 2 and place a new one (forking history)."""
    base_url = get_base_url()

    print(f"\n1. Loading app at {base_url}")
    driver.get(base_url)
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CLASS_NAME, "isenax-container"))
    )
    time.sleep(2)
    dismiss_modals(driver)
    time.sleep(0.5)

    baseline_imgs = count_canvas_images(driver)
    print(f"   Baseline images: {baseline_imgs}")

    # --- Place 3 nodes at different positions ---
    positions = [(300, 300), (500, 300), (700, 300)]
    for i, (x, y) in enumerate(positions):
        print(f"\n2.{i+1}. Placing node {i+1} at ({x}, {y})...")
        assert place_node_at(driver, x, y), f"Failed to place node {i+1}"
        imgs = count_canvas_images(driver)
        items = get_model_items_count(driver)
        print(f"     Images: {imgs}, Model items: {items}")
        assert items == i + 1, f"Expected {i+1} model items, got {items}"

    save_screenshot(driver, "multi_01_three_nodes")
    after_3 = count_canvas_images(driver)
    items_3 = get_model_items_count(driver)
    print(f"\n   After 3 nodes: images={after_3}, items={items_3}")
    assert items_3 == 3

    # --- Undo all 3 nodes one by one ---
    print("\n3. Undoing all 3 nodes...")
    for i in range(3):
        click_undo(driver)
        imgs = count_canvas_images(driver)
        items = get_model_items_count(driver)
        expected = 2 - i
        print(f"   After undo {i+1}: images={imgs}, items={items} (expected {expected})")
        assert items == expected, f"After undo {i+1}: expected {expected} items, got {items}"

    save_screenshot(driver, "multi_02_all_undone")
    assert get_model_items_count(driver) == 0, "Expected 0 items after undoing all 3"
    print("   All 3 nodes undone.")

    # --- Redo all 3 nodes one by one ---
    print("\n4. Redoing all 3 nodes...")
    for i in range(3):
        click_redo(driver)
        imgs = count_canvas_images(driver)
        items = get_model_items_count(driver)
        expected = i + 1
        print(f"   After redo {i+1}: images={imgs}, items={items} (expected {expected})")
        assert items == expected, f"After redo {i+1}: expected {expected} items, got {items}"

    save_screenshot(driver, "multi_03_all_redone")
    assert get_model_items_count(driver) == 3, "Expected 3 items after redoing all"
    print("   All 3 nodes redone.")

    # --- Undo 2, then place a new node (fork history) ---
    print("\n5. Undoing 2 nodes to fork history...")
    click_undo(driver)
    click_undo(driver)
    items = get_model_items_count(driver)
    print(f"   After 2 undos: items={items} (expected 1)")
    assert items == 1, f"Expected 1 item after 2 undos, got {items}"

    # Check redo is available before fork
    can_redo = driver.execute_script("""
        var root = document.getElementById("root");
        var ck = Object.keys(root).find(function(k) { return k.startsWith("__reactContainer"); });
        if (!ck) return null;
        var fiber = root[ck], queue = [fiber], v = 0;
        while (queue.length > 0 && v < 3000) {
            var n = queue.shift(); if (!n) continue; v++;
            if (n.pendingProps && n.pendingProps.value &&
                typeof n.pendingProps.value === "object" && n.pendingProps.value !== null &&
                typeof n.pendingProps.value.getState === "function") {
                try {
                    var st = n.pendingProps.value.getState();
                    if (st && st.views !== undefined && st.items !== undefined && st.history) {
                        return st.history.future.length > 0;
                    }
                } catch(e) {}
            }
            if (n.child) queue.push(n.child);
            if (n.sibling) queue.push(n.sibling);
        }
        return null;
    """)
    print(f"   canRedo before fork: {can_redo}")
    assert can_redo, "Should be able to redo before forking"

    print("   Placing new node to fork history...")
    assert place_node_at(driver, 400, 300), "Failed to place fork node"
    items = get_model_items_count(driver)
    print(f"   After fork placement: items={items} (expected 2)")
    assert items == 2, f"Expected 2 items after fork placement, got {items}"

    # Redo should now be impossible (future was cleared by new action)
    can_redo = driver.execute_script("""
        var root = document.getElementById("root");
        var ck = Object.keys(root).find(function(k) { return k.startsWith("__reactContainer"); });
        if (!ck) return null;
        var fiber = root[ck], queue = [fiber], v = 0;
        while (queue.length > 0 && v < 3000) {
            var n = queue.shift(); if (!n) continue; v++;
            if (n.pendingProps && n.pendingProps.value &&
                typeof n.pendingProps.value === "object" && n.pendingProps.value !== null &&
                typeof n.pendingProps.value.getState === "function") {
                try {
                    var st = n.pendingProps.value.getState();
                    if (st && st.views !== undefined && st.items !== undefined && st.history) {
                        return st.history.future.length > 0;
                    }
                } catch(e) {}
            }
            if (n.child) queue.push(n.child);
            if (n.sibling) queue.push(n.sibling);
        }
        return null;
    """)
    print(f"   canRedo after fork: {can_redo}")
    assert not can_redo, "Should NOT be able to redo after forking history"

    save_screenshot(driver, "multi_04_forked")

    # --- Undo the fork node ---
    print("\n6. Undoing the fork node...")
    click_undo(driver)
    items = get_model_items_count(driver)
    print(f"   After undo fork: items={items} (expected 1)")
    assert items == 1, f"Expected 1 item after undoing fork, got {items}"

    # --- Redo the fork node ---
    print("   Redoing the fork node...")
    click_redo(driver)
    items = get_model_items_count(driver)
    print(f"   After redo fork: items={items} (expected 2)")
    assert items == 2, f"Expected 2 item after redoing fork, got {items}"

    save_screenshot(driver, "multi_05_final")
    print("\n   SUCCESS: Multi-node undo/redo with history forking works!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
