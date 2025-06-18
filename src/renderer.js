import './index.css';

const back = document.getElementById("back-button");
const forward = document.getElementById("forward-button");
const reload = document.getElementById("reload-button");
const searchBtn = document.getElementById("search-button");
const newWindow = document.getElementById("new-window-button");
const newTabBtn = document.getElementById("new-tab-button");
const goBtn = document.getElementById("go");
const urlIn = document.getElementById("url-input");
const webview = document.getElementById("webview");
const tabsContainer = document.getElementById("tabs-container");
const colorPicker = document.getElementById("color-picker");

let tabs = [], currentTab = 0;

// Color picker
colorPicker.addEventListener("input", e => {
  const c = e.target.value;
  document.body.style.backgroundColor = c;
  document.querySelector("#top-bar").style.backgroundColor = c;
  document.querySelector("#tabs-container").style.backgroundColor = c;
});

// Tab structure: { title, url, favicon }

function handleUrl() {
  let u = urlIn.value.trim();
  if (!u) return;
  u = (/^https?:\/\//).test(u) ? u : `https://${u}`;
  loadURL(u);
}

function loadURL(u) {
  webview.src = u;
  tabs[currentTab].url = u;
}

// Address bar
urlIn.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleUrl();
  }
});
goBtn.addEventListener("click", e => {
  e.preventDefault();
  handleUrl();
});

// Webview navigation
back.addEventListener("click", () => webview.goBack());
forward.addEventListener("click", () => webview.goForward());
reload.addEventListener("click", () => webview.reload());
searchBtn.addEventListener("click", () => loadURL("https://www.google.com"));
newWindow.addEventListener("click", () => api.newWindow());
newTabBtn.addEventListener("click", createTab);

// Webview events
webview.addEventListener("did-navigate", e => {
  urlIn.value = e.url;
  tabs[currentTab].url = e.url;
});
webview.addEventListener("page-favicon-updated", e => {
  tabs[currentTab].favicon = e.favicons[0];
  renderTabs();
});

// Create a new tab
function createTab() {
  tabs.push({ title: `Tab ${tabs.length + 1}`, url: "about:blank", favicon: null });
  switchTab(tabs.length - 1);
}

// Switch tab
function switchTab(i) {
  currentTab = i;
  urlIn.value = tabs[i].url;
  webview.src = tabs[i].url;
  renderTabs();
}

// Delete tab
function deleteTab(i) {
  tabs.splice(i, 1);
  if (tabs.length === 0) createTab();
  if (currentTab >= i) currentTab = Math.max(0, currentTab - 1);
  switchTab(currentTab);
}

// Render tabs
function renderTabs() {
  tabsContainer.innerHTML = "";
  tabs.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = `tab ${i === currentTab ? 'active' : ''}`;
    div.dataset.index = i;
    div.addEventListener("click", () => switchTab(i));

    if (t.favicon) {
      const img = document.createElement("img");
      img.src = t.favicon;
      img.className = "favicon";
      div.appendChild(img);
    }

    const span = document.createElement("span");
    span.textContent = t.title;
    div.appendChild(span);

    const close = document.createElement("span");
    close.innerHTML = "&times;";
    close.className = "close-tab";
    close.addEventListener("click", e => {
      e.stopPropagation();
      deleteTab(i);
    });
    div.appendChild(close);

    tabsContainer.appendChild(div);
  });
}

// Init
createTab();
renderTabs();
