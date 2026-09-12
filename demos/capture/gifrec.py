"""README demo GIF capture (demos/connectors.gif, demos/copy-paste-demo.gif).

Same setup as shoot.py, then:
  e2e-tests/venv/bin/python demos/capture/gifrec.py connectors
  e2e-tests/venv/bin/python demos/capture/gifrec.py copy-paste
Frames are screenshotted while the interaction is scripted (6 fps, >= 60
frames) and encoded with a per-GIF palette at 838x428.
"""
import sys, time, os, json, shutil, subprocess
S=os.environ.get("S", os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('ZOOM','0.7'); os.environ.setdefault('DX','60'); os.environ.setdefault('DY','10')
from shoot import make_driver, calibrate, load, W, H
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
NAME = sys.argv[1]
FR = f"{S}/frames_{NAME}"; shutil.rmtree(FR, ignore_errors=True); os.makedirs(FR)
d = make_driver(); calibrate(d); load(d)
# Headless Chrome denies navigator.clipboard without a permission grant the
# plain Remote driver can't issue; an in-memory shim keeps the app's own
# copy/paste code path (visuals identical).
d.execute_script("Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:t=>{window.__clip=t; return Promise.resolve();}, readText:()=>Promise.resolve(window.__clip||'')}})")
frames = []
def snap(n=1):
    for _ in range(n):
        p = f"{FR}/{len(frames):03d}.png"; d.save_screenshot(p); frames.append(p)
pos = [W//2 - 300, 20]  # current pointer (CSS px), starts parked on the title
def move_abs(x, y, steps=6):
    body = d.find_element(By.TAG_NAME, "body")
    for i in range(1, steps+1):
        cx = pos[0] + (x-pos[0])*i/steps; cy = pos[1] + (y-pos[1])*i/steps
        ActionChains(d).move_to_element_with_offset(body, int(cx - W/2), int(cy - H/2)).perform()
        snap()
    pos[0], pos[1] = x, y
def click(): ActionChains(d).click().perform(); time.sleep(0.25); snap(2)
def rclick(): ActionChains(d).context_click().perform(); time.sleep(0.3); snap(2)
def node_pos(name):
    return d.execute_script("""const n=arguments[0]; const el=[...document.querySelectorAll('.isenax-container *')].find(e=>e.childElementCount===0 && e.textContent.trim()===n); const lr=el.getBoundingClientRect(); const lx=lr.x+lr.width/2, ly=lr.y+lr.height/2;
      let best=null; for (const img of document.querySelectorAll('.isenax-container img')) { const r=img.getBoundingClientRect(); const x=r.x+r.width/2, y=r.y+r.height/2; const dd=Math.hypot(x-lx, y-ly-40); if(!best||dd<best[2]) best=[x,y,dd]; } return [Math.round(best[0]), Math.round(best[1])];""", name)
def button_pos(label):
    return d.execute_script("const b=document.querySelector(`button[aria-label*='${arguments[0]}']`); const r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)]", label)
def menu_item_pos(text):
    return d.execute_script("const el=[...document.querySelectorAll('li, [role=menuitem], button')].find(e=>e.textContent.trim().startsWith(arguments[0])); if(!el) return null; const r=el.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)]", text)

def center_on(names, dy=0):
    pts=[node_pos(n) for n in names]; mx=sum(p[0] for p in pts)/len(pts); my=sum(p[1] for p in pts)/len(pts)
    canvas=d.find_element(By.CLASS_NAME,"isenax-container").rect; cx=canvas['x']+canvas['width']/2; cy=canvas['y']+canvas['height']/2
    from shoot import STORE_JS
    d.execute_script(STORE_JS.replace('return st;','{const c=st.scroll.position; st.actions.setScroll({position:{x:c.x+arguments[0], y:c.y+arguments[1]}, offset:{x:0,y:0}}); return 1;}'), cx-mx, cy-my+dy); time.sleep(0.5)
center_on(["Order Service","Payment DB"] if NAME=="connectors" else ["Auth Service","Payment Service","Order Service"], dy=20)
snap(3)
if NAME == "connectors":
    move_abs(*button_pos("Connector")); click()
    for _ in range(3):
        move_abs(*node_pos("Order Service")); click()
        move_abs(*node_pos("Payment DB")); click()
    move_abs(W//2 - 300, 20); snap(4)
elif NAME == "copy-paste":
    for target, dest in [("Auth Service", (W//2 + 250, H - 60)), ("Payment Service", (W//2 + 90, H - 40))]:
        move_abs(*node_pos(target)); rclick()
        mp = menu_item_pos("Copy Node"); assert mp, "no Copy Node menu item"
        move_abs(*mp, steps=4); click()
        move_abs(*dest); snap(2)
        ActionChains(d).key_down(Keys.COMMAND).send_keys('v').key_up(Keys.COMMAND).perform(); time.sleep(0.4); snap(3)
    move_abs(W//2 - 300, 20); snap(4)
print("frames:", len(frames), "items now:", len(d.find_elements(By.CSS_SELECTOR, ".isenax-container img")), "polylines:", d.execute_script("return document.querySelectorAll('.isenax-container polyline').length"))
d.quit()
out = f"{S}/{"copy-paste-demo" if NAME == "copy-paste" else NAME}.gif"
subprocess.run(["ffmpeg","-v","error","-y","-framerate","6","-i",f"{FR}/%03d.png","-vf","scale=838:428:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle","-loop","0",out], check=True)
print("gif:", out, os.path.getsize(out)//1024, "KB")
