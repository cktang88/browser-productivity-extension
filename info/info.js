/*
NOTE: can't use Vue:
Some environments, such as Google Chrome Apps, enforce Content Security Policy (CSP), 
which prohibits the use of new Function() for evaluating expressions.
*/

const $ = (str) => { // jquery syntax shortcuts
  const len = str.length;
  switch (str[0]) {
    case '<': // create dom element
      if (str[len - 1] == '>')
        return document.createElement(str.slice(1, len - 1));
      break;
    default: // select dom element
      const nodes = document.querySelectorAll(str);
      return nodes.length > 1 ? nodes : nodes[0]; // returns 1 elem, or list of elements
  }
}
$.empty = (str) => {
  $(str).innerHTML = '';
}

// format time, 1 decimal place
let format = (secs) => {
  const mins = Math.round(secs / 60 * 10) / 10;
  if (mins < 60) {
    return `${mins} mins`;
  } else {
    const hrs = Math.round(mins / 60 * 10) / 10;
    return `${hrs} hr` + (hrs > 1 ? 's' : '');
  }
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
      'name': getdomain(e.url),
      'totaltime': 0,
      'children': [],
      'expanded': false
    }));
    // filter for unique domains
    domains = domains.filter((e, i) => domains.findIndex(e2 => e.name === e2.name) === i);

    domains.forEach((e, i) => {
      // no guarantee that index of old_domain corresponds to same domain as this index (i)
      const oldindex = old_domains.findIndex(old => old.name == e.name) // need to match name
      if (oldindex != -1)
        e.expanded = old_domains[oldindex].expanded; // set to true when expanded, preserves state
    });

    // group urls into domains
    arr.forEach((e, i) => {
      const domain = domains[domains.findIndex(e2 => e2.name === getdomain(e.url))];
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
    $('#totaltime').innerText = "Total: " + format(totaltime);

    // clear
    $('#app').innerHTML = '';

    domains.forEach((e, i) => {
      const item = $('<li>');

      // domain name
      const d = $('<label>');
      d.className = 'domain';
      d.id = 'domain_' + i; // every domain has unique id
      d.innerText = prettyDomain(e.name);
      d.innerText += e.expanded ? ' [-]' : ' [+]';
      item.append(d);

      // time spent
      const t = $('<span>');
      t.innerText = format(e.totaltime);
      item.append(t);

      // add children
      const list = $('<ul>');
      e.children.forEach(c => {
        const k = $('<li>');
        k.innerText = `${c.url}   ${format(c.time)}`;
        list.appendChild(k);
      });
      list.style.display = e.expanded ? 'block' : 'none'; // preserves expanded state
      item.append(list);

      $('#app').appendChild(item);
    }, this);

    old_domains = domains;
  });
};

// global click delegation
$('body').onclick = (e) => {
  let el = e.target;
  const index = el.id.split('_')[1];
  const domain = domains[index];
  // toggle expand/collapse
  if (el.className != 'domain')
    return;
  // update +/- icons
  el.innerText = el.innerText.split('[')[0] + (domain.expanded ? '[+]' : '[-]');
  // update children view
  el = el.parentNode; // get <li> element
  domain.expanded = !domain.expanded;
  el.lastChild.style.display = domain.expanded ? 'block' : 'none';
}

// doesnt work
$('body').onmouseover = (e) => {
  let el = e.target;
  el.setAttribute('text-decoration', 'underline');
}

update();
setInterval(update, 5000); // update every 5 seconds

// reset
$('#resetbtn').onclick = () => {
  alert('Will reset');
  Storage.set({
    'urls': {}
  }, () => {
    $('#app').innerHTML = '';
    alert('All reset.');
  });
}