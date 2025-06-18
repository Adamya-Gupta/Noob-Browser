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
let isDarkMode = localStorage.getItem('darkMode') === 'true' || false;
const homepageUrl = './homepage.html';

// Initialize dark mode
if (isDarkMode) {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️';
}

// Load saved theme color
const savedColor = localStorage.getItem('themeColor');
if (savedColor) {
  colorPicker.value = savedColor;
  applyThemeColor(savedColor);
}

// Theme toggle
themeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark', isDarkMode);
  themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  localStorage.setItem('darkMode', isDarkMode.toString());
});

// Color picker
colorPicker.addEventListener("input", e => {
  const color = e.target.value;
  applyThemeColor(color);
  localStorage.setItem('themeColor', color);
});

function applyThemeColor(color) {
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
}

// Save tabs to localStorage
function saveTabs() {
  const tabsData = tabs.map(tab => ({
    title: tab.title,
    url: tab.url,
    favicon: tab.favicon,
    content: tab.content || null
  }));
  localStorage.setItem('browserTabs', JSON.stringify(tabsData));
  localStorage.setItem('currentTab', currentTab.toString());
}

// Load tabs from localStorage
function loadTabs() {
  const savedTabs = localStorage.getItem('browserTabs');
  const savedCurrentTab = localStorage.getItem('currentTab');
  
  if (savedTabs) {
    try {
      const tabsData = JSON.parse(savedTabs);
      if (tabsData.length > 0) {
        tabs = tabsData.map(tabData => ({
          title: tabData.title || 'New Tab',
          url: tabData.url || homepageUrl,
          favicon: tabData.favicon || null,
          content: tabData.content || null
        }));
        currentTab = parseInt(savedCurrentTab) || 0;
        if (currentTab >= tabs.length) currentTab = 0;
        return true;
      }
    } catch (e) {
      console.error('Error loading tabs:', e);
    }
  }
  return false;
}

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
  
  // Store current content before navigating
  if (tabs[currentTab] && webview.src) {
    tabs[currentTab].content = webview.src;
  }
  
  webview.src = u;
  tabs[currentTab].url = u;
  updateTabTitle(currentTab, 'Loading...');
  saveTabs();
}

function updateTabTitle(index, title) {
  tabs[index].title = title;
  renderTabs();
  saveTabs();
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
  if (webview.canGoBack && webview.canGoBack()) {
    webview.goBack();
  }
});

forward.addEventListener("click", () => {
  if (webview.canGoForward && webview.canGoForward()) {
    webview.goForward();
  }
});

reload.addEventListener("click", () => {
  if (webview.reload) {
    webview.reload();
  } else {
    webview.src = webview.src;
  }
});

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
  updateNavigationButtons();
});

webview.addEventListener("did-stop-loading", () => {
  loadingIndicator.classList.remove('active');
  updateNavigationButtons();
});

webview.addEventListener("did-navigate", e => {
  urlIn.value = e.url;
  tabs[currentTab].url = e.url;
  saveTabs();
});

webview.addEventListener("did-navigate-in-page", e => {
  urlIn.value = e.url;
  tabs[currentTab].url = e.url;
  saveTabs();
});

webview.addEventListener("page-title-updated", e => {
  updateTabTitle(currentTab, e.title || 'New Tab');
});

webview.addEventListener("page-favicon-updated", e => {
  if (e.favicons && e.favicons.length > 0) {
    tabs[currentTab].favicon = e.favicons[0];
    renderTabs();
    saveTabs();
  }
});

// Listen for messages from homepage
window.addEventListener('message', (event) => {
  if (event.data.type === 'navigate' && event.data.url) {
    loadURL(event.data.url);
  }
});

function updateNavigationButtons() {
  if (webview.canGoBack && webview.canGoForward) {
    back.disabled = !webview.canGoBack();
    forward.disabled = !webview.canGoForward();
  }
}

// Tab management
function createTab() {
  tabs.push({ 
    title: 'New Tab', 
    url: homepageUrl, 
    favicon: null,
    content: null
  });
  switchTab(tabs.length - 1);
  saveTabs();
  urlIn.focus();
}

function switchTab(i) {
  // Store current webview content
  if (tabs[currentTab] && webview.src && webview.src !== homepageUrl) {
    tabs[currentTab].content = webview.src;
  }
  
  currentTab = i;
  const tab = tabs[i];
  
  // Set URL input
  if (tab.url === homepageUrl) {
    urlIn.value = '';
  } else {
    urlIn.value = tab.url;
  }
  
  // Load content (either stored content or URL)
  const contentToLoad = tab.content || tab.url || homepageUrl;
  webview.src = contentToLoad;
  
  renderTabs();
  saveTabs();
}

function deleteTab(i, e) {
  if (e) e.stopPropagation();
  
  if (tabs.length === 1) {
    // Don't close the last tab, just reset it
    tabs[0] = { title: 'New Tab', url: homepageUrl, favicon: null, content: null };
    switchTab(0);
    saveTabs();
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
  saveTabs();
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

// Initialize browser
function initializeBrowser() {
  if (!loadTabs()) {
    // No saved tabs, create default tab
    createTab();
  } else {
    // Load saved tabs
    renderTabs();
    switchTab(currentTab);
  }
}

// Enhanced keyboard shortcuts
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
        if (webview.reload) {
          webview.reload();
        } else {
          webview.src = webview.src;
        }
        break;
      case 'l':
        e.preventDefault();
        urlIn.select();
        break;
      case 'd':
        e.preventDefault();
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark', isDarkMode);
        themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('darkMode', isDarkMode.toString());
        break;
      case 'n':
        e.preventDefault();
        if (typeof api !== 'undefined' && api.newWindow) {
          api.newWindow();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentTab > 0) {
          switchTab(currentTab - 1);
        } else {
          switchTab(tabs.length - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentTab < tabs.length - 1) {
          switchTab(currentTab + 1);
        } else {
          switchTab(0);
        }
        break;
      case '=':
      case '+':
        e.preventDefault();
        if (webview.setZoomFactor) {
          const currentZoom = webview.getZoomFactor();
          webview.setZoomFactor(Math.min(currentZoom + 0.1, 3));
        }
        break;
      case '-':
        e.preventDefault();
        if (webview.setZoomFactor) {
          const currentZoom = webview.getZoomFactor();
          webview.setZoomFactor(Math.max(currentZoom - 0.1, 0.5));
        }
        break;
      case '0':
        e.preventDefault();
        if (webview.setZoomFactor) {
          webview.setZoomFactor(1);
        }
        break;
      case 'f':
        e.preventDefault();
        if (webview.findInPage) {
          const query = prompt('Find in page:');
          if (query) {
            webview.findInPage(query);
          }
        }
        break;
    }
  }
  
  // Alt key shortcuts
  if (e.altKey) {
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (webview.canGoBack && webview.canGoBack()) {
          webview.goBack();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (webview.canGoForward && webview.canGoForward()) {
          webview.goForward();
        }
        break;
    }
  }
});

// Tab switching with numbers (Ctrl+1, Ctrl+2, etc.)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    const tabIndex = parseInt(e.key) - 1;
    if (tabIndex < tabs.length) {
      switchTab(tabIndex);
    }
  }
});

// Handle page beforeunload to save tabs
window.addEventListener('beforeunload', () => {
  saveTabs();
});

// Initialize the browser
initializeBrowser();