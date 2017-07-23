/*
NOTE: can't use Vue:
Some environments, such as Google Chrome Apps, enforce Content Security Policy (CSP), 
which prohibits the use of new Function() for evaluating expressions.
*/

const Storage = chrome.storage.local;
Storage.get('urls', (result) => {
  let arr = [];
  Object.keys(result.urls).forEach(url => {
    arr.push({
      'url': url,
      'time': result.urls[url],
    });
  }, this);

  // gets domain of a url
  let getdomain = (url) => {
    const k = url.indexOf('/');
    if (k > 0) {
      url = url.slice(0, k);
    }
    return url;
  }


  let domains = arr.map(e => ({
    'domain': getdomain(e.url),
    'totaltime': 0,
    'children': []
  }));
  // filter for unique domains
  domains = domains.filter((e, i) => domains.findIndex(e2 => e.domain === e2.domain) === i);

  // group urls into domains
  arr.forEach((e, i) => {
    const domain = domains[domains.findIndex(e2 => e2.domain === getdomain(e.url))];
    // put into proper domain
    domain.children.push(e);
    // sum time up for each domain
    domain.totaltime += e.time;
  });

  // sort domains highest to lowest time spent
  domains.sort((a, b) => b.totaltime - a.totaltime);

  // sum time of all domains
  const totaltime = domains.reduce((sum, e, ind) => sum + e.totaltime, 0);
  document.getElementById('totaltime').innerText = "Total: " + totaltime + " secs";


  domains.forEach(e => {
    let html = '<li>' + '<b>' + e.domain + '</b>   ' + e.totaltime;
    html += '<ul>';
    e.children.forEach(c => {
      html += '<li>' + c.url + '   ' + c.time + '</li>';
    })

    html += '</ul></li>';
    document.getElementById('info').innerHTML += html;
  }, this);
});

// reset
document.getElementById('resetbtn').onclick = () => {
  alert('Will reset');
  Storage.set({
    'urls': {}
  }, () => {
    alert('All reset.');
  });
}