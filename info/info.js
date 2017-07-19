const Storage = chrome.storage.local;
Storage.get('urls', (result) => {
  const arr = [];
  Object.keys(result.urls).forEach(url => {
    arr.push({
      'url': url,
      'value': result.urls[url],
    });
  }, this);
  arr.sort((a, b) => b.value - a.value);
  arr.forEach(e => {
    document.getElementById('info').innerHTML += '<p>' + e.url + '   ' + e.value + '</p>';
  }, this);
});