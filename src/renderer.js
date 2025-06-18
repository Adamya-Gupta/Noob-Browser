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
const themeToggle = document.getElementById("theme-toggle");
const loadingIndicator = document.getElementById("loading-indicator");

let tabs = [], currentTab = 0;
let isDarkMode = false; // Changed from localStorage since it's not supported

// Initialize dark mode
if (isDarkMode) {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️';
}

// Theme toggle
themeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark', isDarkMode);
  themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
});

// Color picker
colorPicker.addEventListener("input", e => {
  const color = e.target.value;
  document.documentElement.style.setProperty('--accent-color', color);
  
  // Update button colors
  const goButton = document.getElementById('go');
  goButton.style.backgroundColor = color;
  
  // Update active tab border color
  const style = document.createElement('style');
  style.textContent = `
    .tab.active { border-color: ${color} !important; }
    #url-input:focus { border-color: ${color} !important; box-shadow: 0 0 0 3px ${color}1a !important; }
  `;
  document.head.appendChild(style);
});

function handleUrl() {
  let u = urlIn.value.trim();
  if (!u) return;
  
  // Check if it's a search query or URL
  if (!u.includes('.') && !u.startsWith('http')) {
    u = `https://www.google.com/search?q=${encodeURIComponent(u)}`;
  } else if (!(/^https?:\/\//).test(u)) {
    u = `https://${u}`;
  }
  
  loadURL(u);
}

function loadURL(u) {
  loadingIndicator.classList.add('active');
  webview.src = u;
  tabs[currentTab].url = u;
  updateTabTitle(currentTab, 'Loading...');
}

function updateTabTitle(index, title) {
  tabs[index].title = title;
  renderTabs();
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

// Navigation buttons
back.addEventListener("click", () => {
  if (webview.canGoBack()) webview.goBack();
});

forward.addEventListener("click", () => {
  if (webview.canGoForward()) webview.goForward();
});

reload.addEventListener("click", () => webview.reload());
searchBtn.addEventListener("click", () => loadURL("https://www.google.com"));
newTabBtn.addEventListener("click", createTab);
newWindow.addEventListener("click", () => {
  if (typeof api !== 'undefined' && api.newWindow) {
    api.newWindow();
  }
});

// Webview events
webview.addEventListener("did-start-loading", () => {
  loadingIndicator.classList.add('active');
  back.disabled = !webview.canGoBack();
  forward.disabled = !webview.canGoForward();
});

webview.addEventListener("did-stop-loading", () => {
  loadingIndicator.classList.remove('active');
  back.disabled = !webview.canGoBack();
  forward.disabled = !webview.canGoForward();
});

webview.addEventListener("did-navigate", e => {
  urlIn.value = e.url;
  tabs[currentTab].url = e.url;
});

webview.addEventListener("did-navigate-in-page", e => {
  urlIn.value = e.url;
  tabs[currentTab].url = e.url;
});

webview.addEventListener("page-title-updated", e => {
  updateTabTitle(currentTab, e.title || 'New Tab');
});

webview.addEventListener("page-favicon-updated", e => {
  if (e.favicons && e.favicons.length > 0) {
    tabs[currentTab].favicon = e.favicons[0];
    renderTabs();
  }
});

// Tab management
function createTab() {
  const tabNumber = tabs.length + 1;
  tabs.push({ 
    title: `New Tab`, 
    url: "", 
    favicon: null 
  });
  switchTab(tabs.length - 1);
  urlIn.focus();
}

function switchTab(i) {
  currentTab = i;
  const tab = tabs[i];
  urlIn.value = tab.url === 'about:blank' ? '' : tab.url;
  webview.src = tab.url;
  renderTabs();
}

function deleteTab(i, e) {
  if (e) e.stopPropagation();
  
  if (tabs.length === 1) {
    // Don't close the last tab, just reset it
    tabs[0] = { title: 'New Tab', url: 'about:blank', favicon: null };
    switchTab(0);
    return;
  }
  
  tabs.splice(i, 1);
  if (currentTab >= i && currentTab > 0) {
    currentTab--;
  }
  if (currentTab >= tabs.length) {
    currentTab = tabs.length - 1;
  }
  switchTab(currentTab);
}

function renderTabs() {
  // Clear existing tabs (but keep the + button)
  const existingTabs = tabsContainer.querySelectorAll('.tab');
  existingTabs.forEach(tab => tab.remove());

  tabs.forEach((tab, i) => {
    const tabElement = document.createElement("div");
    tabElement.className = `tab ${i === currentTab ? 'active' : ''}`;
    tabElement.addEventListener("click", () => switchTab(i));

    if (tab.favicon) {
      const favicon = document.createElement("img");
      favicon.src = tab.favicon;
      favicon.className = "favicon";
      favicon.onerror = () => favicon.style.display = 'none';
      tabElement.appendChild(favicon);
    }

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title || 'New Tab';
    title.title = tab.title || 'New Tab';
    tabElement.appendChild(title);

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "×";
    closeBtn.className = "close-tab";
    closeBtn.title = "Close tab";
    closeBtn.addEventListener("click", (e) => deleteTab(i, e));
    tabElement.appendChild(closeBtn);

    // Insert before the + button
    tabsContainer.insertBefore(tabElement, newTabBtn);
  });
}

// Initialize with one tab
if (tabs.length === 0) {
  createTab();
}
renderTabs();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 't':
        e.preventDefault();
        createTab();
        break;
      case 'w':
        e.preventDefault();
        deleteTab(currentTab);
        break;
      case 'r':
        e.preventDefault();
        webview.reload();
        break;
      case 'l':
        e.preventDefault();
        urlIn.select();
        break;
    }
  }
});