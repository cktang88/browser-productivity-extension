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

function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  const queryInfo = {
    active: true,
    currentWindow: true
  };

  const cleanUrl = url => {
    console.assert(typeof url == 'string', 'tab.url should be a string');
    // clean up url
    let end = url.indexOf('?'); // remove ? and # url appendings
    if (end == -1)
      end = url.length;
    if (url.indexOf('#') > -1)
      end = Math.min(end, url.indexOf('#'));
    let start = url.indexOf('://'); // count http/https as same site
    if (start == -1)
      start = 0;
    if (start > 0)
      start += 3; // remove '://'
    return url.slice(start, end).trim();
  }

  chrome.tabs.query(queryInfo, tabs => {
    const tab = tabs[0];
    // tab object: https://developer.chrome.com/extensions/tabs#type-Tab
    callback(cleanUrl(tab.url));
  });
}
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // only act if url changed
  if (!changeInfo.url)
    return;

  // clean url a bit
  getCurrentTabUrl(url => {
    storeUrl(url);
    // alert('stored url.');
  });
  // do stuff with that url here....
});

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
    urls[url] += 1; // update times visited site
    console.log(urls[url]); // show popup // testing only
    // alert(urls[url]);
    Storage.set({
      'urls': urls
    }, () => {
      // Notify that we saved.
      console.log('Url data updated');
    });
  });
}