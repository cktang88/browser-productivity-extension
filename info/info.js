/*
NOTE: can't use Vue:
Some environments, such as Google Chrome Apps, enforce Content Security Policy (CSP), 
which prohibits the use of new Function() for evaluating expressions.
*/

const Storage = chrome.storage.local;
const $ = document.getElementById.bind(document); // being lazy
const update = () => {
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
    // returns prettified domain
    let prettyDomain = (d) => {
      if (d.indexOf('.com') > 0 || d.indexOf('.org') > 0) // only for common endings
      {
        d = d.slice(0, d.length - 4); // remove ending
      }
      if (d.indexOf('.') === -1) // capitalize (only for one-word urls)
        d = d.charAt(0).toUpperCase() + d.slice(1);
      return d;
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
    $('totaltime').innerText = "Total: " + totaltime + " secs";

    let html = "";
    domains.forEach(e => {
      html += '<li>' + '<label id="domain">' + prettyDomain(e.domain) + '</label>   ' + e.totaltime;
      html += '<ul>';
      e.children.forEach(c => {
        html += '<li>' + c.url + '   ' + c.time + '</li>';
      })
      html += '</ul></li>';

    }, this);
    $('app').innerHTML = html;
  });
};

update();
setInterval(update, 5000); // update every 5 seconds

// reset
$('resetbtn').onclick = () => {
  alert('Will reset');
  Storage.set({
    'urls': {}
  }, () => {
    $('info').innerHTML = "";
    alert('All reset.');
  });
}