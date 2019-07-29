// ==UserScript==
// @name          hiyobi_viewer
// @namespace     skygarlics
// @version       190729
// @author        aksmf
// @description   image viewer for hiyobi
// @include       https://xn--9w3b15m8vo.asia/reader/*
// @version       1
// @grant         GM_xmlhttpRequest
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_deleteValue
// @grant         GM_listValues
// @grant         GM_getResourceText
// @grant         GM.getResourceUrl
// ==/UserScript==

/*
    TODO
    wheel function
*/

// interface
var cElement = function (tag, insert, property, func) {
    var _DIRECT = [
    'className',
    'innerHTML',
    'textContent'
    ];
    var element;
    if (!tag)
    element = document.createTextNode(property);
    else
    element = document.createElement(tag);
    if (insert) {
    var parent;
    var before = null;
    if (insert.constructor === Array) {
        var target = insert[1];
        if (typeof target === 'number') {
        parent = insert[0];
        before = parent.childNodes[target];
        } else {
            before = insert[0];
            parent = before.parentNode;
            if (target === 'next') {
                before = before.nextSibling;
            }
            if (target === 'prev') {
                before = before.previousSibling;
            }
        }
    } else {
        parent = insert;
    }
    parent.insertBefore(element, before);
    }
    if (!tag)
    return element;
    if (property) {
    if (typeof property === 'object') {
        for (var i in property) {
        if (property.hasOwnProperty(i)) {
            if (_DIRECT.contains(i))
            element[i] = property[i];
            else
            element.setAttribute(i, property[i]);
        }
        }
    } else {
        element.textContent = property;
    }
    }
    if (func) {
    element.addEventListener('click', func, false);
    }
    return element;
};


var addStyle = typeof GM_addStyle !== 'undefined' ? GM_addstyle :
function (css) {
    var parent = document.head || document.documentElement;
    var style = document.createElement('style');
    style.type = 'text/css';
    var textNode = document.createTextNode(css);
    style.appendChild(textNode);
    parent.appendChild(style);
};
/*
// fixed navbar
$("body > nav").addClass("fixed-top");
addStyle("#comicscroll img {padding-top:56px; margin-bottom:0px}")
*/

var toggleTimer = function () {
    console.log('toggleTimer called');
    var second = document.getElementById('pageTimer').value;
    if (second < 1 || isNaN(second)) {
      return;
    }
    toggleTimer.flag = toggleTimer.flag ? 0 : 1;
    if (toggleTimer.flag) {
      var pagerButton = document.getElementById('autoPager');
      pagerButton.firstChild.classList.add('icon_white');
      toggleTimer.interval = setInterval(nextPanel, second * 1000);
    } else {
      var pagerButton = document.getElementById('autoPager');
      pagerButton.firstChild.classList.remove('icon_white');
      clearInterval(toggleTimer.interval);
    }
};

var doWheel = function (e) {
    if ($('#comicImages').is(":hidden")) {
        return
    }
    let prev_scrollTop = window.scrollY;
    // let scrollTo = prev_scrollTop + e.deltaY;
    // comicImages.scrollTop = scrollTo;
    setTimeout(() => {
      if (window.scrollY == prev_scrollTop){
        if (e.deltaY > 0)
          nextPanel();
        else if (e.deltaY < 0)
          prevPanel();
      }
    }, 50);
  };

addStyle(".icon_white {color: rgba(255,255,255,1);}")

// add timer
var pager_html = '<li class="nav-item"><a class="nav-link" title="t key" id="autoPager"><span class="oi oi-clock"></span>타이머</a><input class="form-control" id="pageTimer" type="text" value="10"></li>'
$("#navcollap > ul.navbar-nav.mr-auto").append(pager_html);
addStyle("#autoPager {float: left}")
addStyle("#pageTimer {width:3rem; height:2rem; align-self:center; margin:calc((40px - 2rem) / 2)}")
$("#autoPager").on('click', toggleTimer);
$(document).bind('keydown','t',toggleTimer);
document.addEventListener('wheel', doWheel);