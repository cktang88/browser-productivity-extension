let current_url = undefined; // current tab url
const saveInterval = 5; // seconds

const updateTab = (tabId) => 
  chrome.tabs.get(tabId, tab => {
    current_url = tab.url || undefined;
  });

// handles when user switches tabs
chrome.tabs.onActivated.addListener(function (activeinfo) {
  updateTab(activeinfo.tabId); // if url not ready, onUpdated() will update it later
});
u
// handles when user changes url in current tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  let urlChanged = changeInfo.url;
  
  if (urlChanged)
    updateTab(tabId);
});

// clean url a bit
const cleanUrl = url => {
  console.assert(typeof url == 'string', 'tab.url should be a string');

  // remove front-parts
  protocol = url.split('://')[0]
  url = url.split('://')[1]
  
  // remove www and ? and # url query appendings
  url = url.replace('www.', '').trim();
  url = url.split(/[?#]/)[0];

  return url;
}

setInterval(() => {
  chrome.windows.getCurrent(function (browser) {
    // only save if window focused
    /*
    can't use onFocusChanged() 
    b/c isn't triggered when user navigates to different application
    */
    if (current_url && browser.focused)
      storeUrl(cleanUrl(current_url));
  })
}, saveInterval * 1000);


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
    urls[url] += saveInterval; // match
    // console.log(urls[url]);
    Storage.set({
      'urls': urls
    }, () => {
      // Notify that we saved.
      // console.log('Url data updated');
    });
  });
}