import './index.css';

const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");
const reloadButton = document.getElementById("reload-button");
const searchButton = document.getElementById("search-button");
const newWindowButton = document.getElementById("new-window-button");
const newTabButton = document.getElementById("new-tab-button");
const goButton = document.getElementById("go");
const urlInputField = document.getElementById("url-input");
const webview = document.getElementById("webview");
const tabsContainer = document.getElementById("tabs-container");

const colorPicker = document.getElementById("color-picker");
colorPicker.addEventListener("input", (event) => {
    const selectedColor = event.target.value;
    document.body.style.backgroundColor = selectedColor;
    document.querySelector("#browser-tools").style.backgroundColor = selectedColor;
    document.querySelector("#tabs-container").style.backgroundColor = selectedColor;
})

let tabs = [];
let currentTabIndex = 0;

function handleUrl(){
    let url = "";
    const inputUrl = urlInputField.value;
    if(inputUrl.startsWith("http://") || inputUrl.startsWith("https://")){
        url=inputUrl;
    }
    else{
        url="http://"+inputUrl;
    }
    webview.src = url;
    tabs[currentTabIndex].url=url;
}
urlInputField.addEventListener("keydown",(event)=>{
    if(event.key ==="Enter"){
        event.preventDefault();
        handleUrl();
    }
});

goButton.addEventListener("click", (event) => {
  event.preventDefault();
  handleUrl();
});