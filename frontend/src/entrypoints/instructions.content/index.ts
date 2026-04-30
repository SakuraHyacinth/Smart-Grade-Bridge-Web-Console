import './style.css';
import bridgeLogo from '@/assets/bridge.png'

const selector = '#menu';

import newAccessToken from '@/assets/newAccessToken.png';
import popupToken from '@/assets/popupToken.png';
import extensionButton from '@/assets/extensionButton.png';

// add nav item
function addInstructionsNav(target: HTMLElement) {
  if (document.getElementById('smartbridge-nav')) return;

  const li = document.createElement("li");
  li.id = "smartbridge-nav";
  li.style = "padding: 0.3rem 0";

  const link = document.createElement("a");
  link.href = "#";
  link.className = "ic-app-header-menu-list-link";

  const icon = document.createElement("div");
  icon.className = "menu-item-icon-container";
  // icon.textContent = "";
  
  const logo = document.createElement("img");
  logo.src = bridgeLogo;

  const text = document.createElement("div");
  text.className = "menu-item__text";
  text.textContent = "SmartBridge";
  icon.appendChild(logo);
  link.appendChild(icon);
  link.appendChild(text);
  li.appendChild(link);

  link.addEventListener("click", (e) => {
    e.preventDefault();
    toggleInstructionsPanel();
    
  });

  target.prepend(li);
}


// panel logic
function toggleInstructionsPanel() {
  let panel = document.getElementById("smartbridge-instructions");

  // if exists return
  if (panel) {
    panel.remove();
    return;
  }

  panel = document.createElement("div");
  panel.id = "smartbridge-instructions";
  panel.className = "smartbridge-panel";

  

panel.innerHTML = `
  <button id="close-panel">✕</button>
  <h3>SmartBridge</h3>

  <p>1. Open your Canvas profile settings</p>
  <button id="fetch-api-key">Open Settings</button>

  <p>2. Scroll to "Approved Integrations"</p>
  <img src="${newAccessToken}" class="smartbridge-img" />

  <p>3. Click "+ New Access Token"</p>
  <p>4. Enter purpose as "SmartBridge" (expiration optional)</p>
  <p>5. Click "Generate Token"</p>
  <p>6. Copy the token immediately</p>
  <p>7. Open SmartBridge extension popup</p>
  <img src="${extensionButton}" class="smartbridge-img" />
  <p>8. Paste token into textbox</p>
  <img src="${popupToken}" class="smartbridge-img" />
`;

  document.body.appendChild(panel);
  const closeBtn = panel.querySelector("#close-panel");

closeBtn?.addEventListener("click", () => {
  panel.remove();
});

  // attach event AFTER innerHTML
  const button = panel.querySelector("#fetch-api-key");
  button?.addEventListener("click", () => {
    window.open("https://csusm.test.instructure.com/profile/settings", "_blank");
  });
}


export default defineContentScript({
  matches: ['*://csusm.test.instructure.com/*', '*://csusm.test.instructure.com/'],

  main() {
    console.log("Instructions script loaded");

    const nav = document.querySelector<HTMLElement>(selector);

    if (nav) {
      console.log("Instruction content has immediately loaded!")
      addInstructionsNav(nav);
    } else {
      const observer = new MutationObserver(() => {
        const nav = document.querySelector<HTMLElement>(selector);

        if (nav) {
          console.log("selector was found")
          addInstructionsNav(nav);
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
      if (window.location.pathname.includes("/profile/settings")) {
    toggleInstructionsPanel();
  }

  },
});