// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  const queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, tabs => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    const tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    const url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl(url => {

    renderStatus(url); // display in popup

    // synced using chrome sync
    /* Even if a user disables syncing, storage.sync will still work. 
    In this case, it will behave identically to storage.local. */
    const Storage = chrome.storage.local;
    // urls object (associative array)
    Storage.get('urls', (result) => {
      // the input argument is ALWAYS an object containing the queried keys
      // You can store objects/arrays directly with the new Storage API
      // with local storage raw, you have to store key-value pairs
      let urls = result.urls || {};
      if(!urls[url])
        urls[url] = 0;
      urls[url] += 1; // update times visited site
      console.log(urls[url]); // show popup // testing only
      renderStatus(urls[url])
      Storage.set({'urls': urls}, () => {
        // Notify that we saved.
        console.log('Url data updated');
      });
    });
    // use chrome.storage.local for local storage

  }, errorMessage => {
    renderStatus('Error: ' + errorMessage);
  });
});