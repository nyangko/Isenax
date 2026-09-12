"""README screenshot capture (assets/screenshot.jpg).

Usage (from repo root, with e2e-tests/venv):
  pnpm run build:app
  cp demos/capture/demo-diagram.json packages/isenax-app/build/demo.json
  npx serve -s packages/isenax-app/build -l 3100 &   # app under test
  chromedriver --port=4444 &                          # matching your Chrome
  e2e-tests/venv/bin/python demos/capture/shoot.py    # -> screenshot.png (1676x856, DPR 2)
  ffmpeg -i demos/capture/screenshot.png -q:v 2 assets/screenshot.jpg
Regenerate the diagram with gen_demo.py <out.json> if the layout changes.
"""
import sys, time, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'e2e-tests', 'tests'))
from test_multi_node_undo import dismiss_modals
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
S=os.environ.get("S", os.path.dirname(os.path.abspath(__file__))); W,H = 838, 428
def make_driver(dpr=2):
    o = Options()
    for a in ["--headless=new","--no-sandbox","--disable-dev-shm-usage",f"--window-size={W},{H+150}",f"--force-device-scale-factor={dpr}","--hide-scrollbars","--lang=en-US"]: o.add_argument(a)
    d = webdriver.Remote("http://localhost:4444", options=o); d.implicitly_wait(2)
    try:
        d.execute_cdp_cmd('Browser.grantPermissions', {'origin': 'http://localhost:3100', 'permissions': ['clipboardReadWrite', 'clipboardSanitizedWrite']})
        print("clipboard permission granted")
    except Exception as e:
        print("cdp grant failed:", str(e)[:120])
    return d
def calibrate(d):
    for _ in range(4):
        iw, ih = d.execute_script("return [innerWidth, innerHeight]")
        if (iw, ih) == (W, H): break
        ww, wh = d.get_window_size()['width'], d.get_window_size()['height']
        d.set_window_size(ww + (W-iw), wh + (H-ih)); time.sleep(0.3)
    return d.execute_script("return [innerWidth, innerHeight, devicePixelRatio]")
def load(d, json_url="/demo.json"):
    d.get("http://localhost:3100/")
    WebDriverWait(d, 15).until(EC.presence_of_element_located((By.CLASS_NAME, "isenax-container")))
    d.execute_async_script("""const cb=arguments[arguments.length-1]; fetch(arguments[0]).then(r=>r.json()).then(data=>{
        const id='demo-microservices'; const rec={id, name: data.title, lastModified: new Date().toISOString(), size: JSON.stringify(data).length, data};
        const req=indexedDB.open('isenax',1); req.onupgradeneeded=e=>{const db=e.target.result; if(!db.objectStoreNames.contains('diagrams')) db.createObjectStore('diagrams',{keyPath:'id'})};
        req.onsuccess=e=>{const db=e.target.result; const tx=db.transaction('diagrams','readwrite'); tx.objectStore('diagrams').put(rec); tx.oncomplete=()=>{
        localStorage.setItem('isenax-last-opened', id);
        localStorage.setItem('isenax-last-opened-data', JSON.stringify(data));
        ['isenax_child_view_nav_hint_dismissed','isenax_connector_hint_dismissed','isenax_connector_reroute_hint_dismissed','isenax_import_hint_dismissed','isenax_lasso_hint_dismissed','isenax-lazy-loading-welcome-dismissed'].forEach(k=>localStorage.setItem(k,'true')); localStorage.setItem('isenax-show-drag-hint','false');
        localStorage.setItem('isenax-history-seen-version','v99.0.0'); cb(1)}}})""", json_url)
    d.get("http://localhost:3100/")
    WebDriverWait(d, 15).until(EC.presence_of_element_located((By.CLASS_NAME, "isenax-container")))
    time.sleep(2.5); dismiss_modals(d); time.sleep(0.5)
    fit(d, zoom=float(os.environ.get('ZOOM','0.38')), dx=int(os.environ.get('DX','60')), dy=int(os.environ.get('DY','10'))); park(d)
STORE_JS = """var r=document.getElementById('root');var k=Object.keys(r).find(k=>k.startsWith('__reactContainer'));var q=[r[k]],v=0;while(q.length&&v<3000){var n=q.shift();if(!n)continue;v++;var val=n.pendingProps&&n.pendingProps.value;if(val&&typeof val==='object'&&typeof val.getState==='function'){try{var st=val.getState();if(st&&st.mode&&st.zoom!==undefined)return st;}catch(e){}}if(n.child)q.push(n.child);if(n.sibling)q.push(n.sibling);}return null"""
def fit(d, zoom=None, dx=0, dy=0):
    d.execute_script("document.querySelector(\"button[aria-label='Fit to screen']\").click()"); time.sleep(0.6)
    if zoom is not None:
        d.execute_script(STORE_JS.replace('return st;','{const c=st.scroll.position; const z=st.zoom; st.actions.setScroll({position:{x:c.x*arguments[0]/z+arguments[1], y:c.y*arguments[0]/z+arguments[2]}, offset:{x:0,y:0}}); st.actions.setZoom(arguments[0]); return 1;}'), zoom, dx, dy); time.sleep(0.6)
def park(d):
    # pointer on the title text (no tooltip, no cursor tile on the canvas)
    ActionChains(d).move_to_element_with_offset(d.find_element(By.TAG_NAME,"body"), -W//2+130, -H//2+20).perform(); time.sleep(0.4)
if __name__ == "__main__":
    d = make_driver(); print("viewport", calibrate(d)); load(d)
    print("items on canvas:", len(d.find_elements(By.CSS_SELECTOR, ".isenax-container img")), "title:", d.execute_script("return document.title"))
    d.save_screenshot(f"{S}/screenshot.png")
    print(json.dumps(d.execute_script("""return [...document.querySelectorAll('.isenax-container img')].map((img,i)=>{const r=img.getBoundingClientRect(); return [i, Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)]})""")))
    print(json.dumps(d.execute_script("""const names=['Client','API Gateway','Auth Service','Order Service','Payment Service','Event Queue','Notification Service','Order DB','Payment DB']; return names.map(n=>{const el=[...document.querySelectorAll('.isenax-container *')].find(e=>e.childElementCount===0 && e.textContent.trim()===n); if(!el) return [n,null]; const r=el.getBoundingClientRect(); return [n, Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)]})""")))
    d.quit(); print("saved")
