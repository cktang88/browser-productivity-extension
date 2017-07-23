/*
NOTE: can't use Vue:
Some environments, such as Google Chrome Apps, enforce Content Security Policy (CSP), 
which prohibits the use of new Function() for evaluating expressions.
*/

const $ = { // shortcuts
  get: document.getElementById.bind(document),
  make: document.createElement.bind(document),
}

let domains = [];
let old_domains = []; // used to keep state
const Storage = chrome.storage.local;
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

    domains = arr.map(e => ({
      'domain': getdomain(e.url),
      'totaltime': 0,
      'children': [],
      'maximized': false
    }));
    // filter for unique domains
    domains = domains.filter((e, i) => domains.findIndex(e2 => e.domain === e2.domain) === i);

    domains.forEach((e, i) => {
      // no guarantee that index of old_domain corresponds to same domain as this index (i)
      const oldindex = old_domains.findIndex(old => old.domain == e.domain) // need to match name
      if (oldindex != -1)
        e.maximized = old_domains[oldindex].maximized; // set to true when maximized, preserves state
    });

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

    // sort children for each domain
    domains.forEach(e => {
      e.children.sort((a, b) => b.time - a.time);
    })

    // sum time of all domains
    const totaltime = domains.reduce((sum, e, ind) => sum + e.totaltime, 0);
    $.get('totaltime').innerText = "Total: " + format(totaltime);

    // clear
    $.get('app').innerHTML = '';

    domains.forEach((e, i) => {
      const item = $.make('li');

      const d = $.make('label');
      d.className = 'domain';
      d.id = 'domain_' + i; // every domain has unique id
      d.innerText = prettyDomain(e.domain);
      d.innerText += e.maximized ? ' [-]' : ' [+]';
      item.append(d);

      const t = $.make('span');
      t.innerText = format(e.totaltime);
      item.append(t);

      if (e.maximized) { // preserves maximized state
        addDomainChildrenToDOM(item, e);
      }

      $.get('app').appendChild(item);
    }, this);

    old_domains = domains;
  });
};

// global click delegation
document.body.onclick = (e) => {
  let el = e.target;
  const index = el.id.split('_')[1];
  const domain = domains[index];
  // toggle expand/collapse
  if (el.className == 'domain') {
    // update +/- icons
    el.innerText = el.innerText.split('[')[0] + (domain.maximized ? '[+]' : '[-]');

    // update children
    el = el.parentNode; // get <li> element
    if (el.childNodes.length == 3) {
      // remove last child, fastest see https://stackoverflow.com/a/3955238/6702495
      el.removeChild(el.lastChild); // removes the <ul> element
      domain.maximized = false; // update state
    } else {
      addDomainChildrenToDOM(el, domains[index]);
      domain.maximized = true; // update state
    }
  }
}

// doesnt work
document.body.onmouseover = (e) => {
  let el = e.target;
  el.setAttribute('text-decoration', 'underline');
}

// self-explanatory
function addDomainChildrenToDOM(parent, domain) {
  const list = $.make('ul');
  domain.children.forEach(c => {
    const item = $.make('li');
    item.innerText = `${c.url}   ${format(c.time)}`;
    list.appendChild(item);
  });
  parent.appendChild(list);
}

update();
setInterval(update, 5000); // update every 5 seconds

let format = (secs) => {
  // minutes, 1 decimal place
  return Math.round(secs / 60 * 10) / 10 + ' mins';
}

// reset
$.get('resetbtn').onclick = () => {
  alert('Will reset');
  Storage.set({
    'urls': {}
  }, () => {
    $.get('app').innerHTML = '';
    alert('All reset.');
  });
}