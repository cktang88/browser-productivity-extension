// receiving message from content-script
// alert('Background script started');
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  alert('Background script: Message received from content script');
  console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension");
  if (request.greeting == "hello")
    sendResponse({
      data: "useless hello."
    });

  // attempt to store url
  if (request.url) {
    storeUrl(url);
    sendResponse({
      data: 'url received',
    })
  }
});

const getCurrentTabUrl = (tabId) => chrome.tabs.get(tabId, tab => {
  cur_url = tab.url || undefined;
});

let cur_url = undefined; // current tab url
chrome.tabs.onActivated.addListener(function (activeinfo) {
  // handles when user switches tabs

  getCurrentTabUrl(activeinfo.tabId); // if url not ready, onUpdated() will update it later
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // handles when user changes url in current tab
  // only act if url changed
  if (changeInfo.url)
    getCurrentTabUrl(tabId);
});

// save every 5 seconds --> optimize later (see local storage performance)
// idea: whenever active tab change or exit browser, save total time of "cur_url"
// TODO: ONLY ADD 1. ON ACTIVE TAB 2. WHEN BROWSER FOCUSED
// see https://stackoverflow.com/questions/2574204/detect-browser-focus-out-of-focus-via-google-chrome-extension
const numSecs = 5;
// clean url a bit
const cleanUrl = url => {
  console.assert(typeof url == 'string', 'tab.url should be a string');
  // remove front-parts
  url = url.replace('https://', '').replace('http://', '').replace('www.', '').trim();
  return url.split(/[?#]/)[0]; // remove ? and # url query appendings
}
setInterval(() => {
  if (cur_url)
    storeUrl(cleanUrl(cur_url));
}, numSecs * 1000);


/* stores url info persistently in localstorage */
const storeUrl = url => {
  console.log(url);
  // synced using chrome sync
  /* Even if a user disables syncing, storage.sync will still work. 
  In this case, it will behave identically to storage.local. */

  // You can store objects/arrays directly with the new Storage API
  // with local storage raw, you have to store key-value pairs

  const Storage = chrome.storage.local; // chrome.storage.sync OR chrome.storage.local
  // urls object (associative array)
  Storage.get('urls', (result) => {
    // the input argument is ALWAYS an object containing the queried keys
    let urls = result.urls || {};
    if (!urls[url])
      urls[url] = 0;
    urls[url] += numSecs; // match
    // console.log(urls[url]);
    Storage.set({
      'urls': urls
    }, () => {
      // Notify that we saved.
      // console.log('Url data updated');
    });
  });
}