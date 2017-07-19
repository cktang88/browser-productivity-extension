document.getElementById('statsbtn').onclick = ev => {
  const url = chrome.runtime.getURL('info/info.html');
  chrome.tabs.create({
    'url': url
  });
};

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}