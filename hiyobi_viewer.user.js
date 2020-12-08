// ==UserScript==
// @name          hiyobi_viewer
// @namespace     skygarlics
// @version       201208
// @author        aksmf
// @description   image viewer for hiyobi
// @include       https://hiyobi.me/reader/*
// @version       1
// @require       https://code.jquery.com/jquery-3.2.1.min.js
// @require       https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js
// @resource      bt https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css
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
*/

var update_check = false;
var API_URL = null;
var CDN_URL = null;

var images = {};
var display = 1;
var curPanel;
var number_of_images;
var comicImages;
var goofy_enabled = false;
var single_displayed = true;

var host_regex = /^(.+)\/\/(.+?)\/(.+)/g;
var host = host_regex.exec(document.location)[2];
if (host === 'hiyobi.me') {
  API_URL = 'https://api.hiyobi.me';
  CDN_URL = 'https://cdn.hiyobi.me'
  BASE_LEN = "https://hiyobi.me/reader/".length;
} else {
  alert("Host unavailable!\nHOST: "+host);
}


// remove original events.
document.onkeydown = null;
document.onkeyup = null;

// style functions
var clearStyle = function () {
  for (var i = document.styleSheets.length - 1; i >= 0; i--) {
    document.styleSheets[i].disabled = true;
  }
  var arAllElements = (typeof document.all != 'undefined') ?
  document.all : document.getElementsByTagName('*');
  for (var i = arAllElements.length - 1; i >= 0; i--) {
    var elmOne = arAllElements[i];
    if (elmOne.nodeName.toUpperCase() == 'LINK') {
      // remove <style> elements defined in the page <head>
      elmOne.remove();
    }
  }
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

// GM_getResourceText is deprecated in Greasemonkey4
var addStyleFromResource = async function asdf (res) {
  if (typeof GM_getResourceText !== 'undefined'){
    var bt_css = GM_getResourceText(res);
		addStyle(bt_css);
  } else {
    var fileName = await GM.getResourceUrl(res);
  	var head = document.head;
	  var link = document.createElement("link");
	  link.type = "text/css";
	  link.rel = "stylesheet";
	  link.href = fileName;
	  head.appendChild(link);
  }
}

var disable = function (elem) {
  elem.parent().addClass('disabled');
  elem.children().removeClass('icon_white');
};

var enable = function (elem) {
  elem.parent().removeClass('disabled');
  elem.children().addClass('icon_white');
};


// Viewer styles
var viewer_style =
  "html, body {height: 100%;}"+
  "body {background: #171717; font-size: 15px; font-weight:bold; background-color: #171717 !important; color: #999; height: 100%; overflow: hidden;}"+
  "h1 {color: #fff;}"+
  "body .modal {color: #333;}"+
  ".nav>li>a {padding: 15px 10px}"+

  "#comicImages {height: calc(100% - 50px); overflow: auto; text-align: center; white-space:nowrap;}"+
  "#comicImages .centerer {display: inline-block; vertical-align: middle; height: 100%;}"+
  "#imageDragger {pointer-events: none; cursor: default; position: fixed; margin-bottom: 25px; z-index: 1; width: 30%; height: calc(100% - 50px - 25px); left: 35%; display: flex; align-items: center; justify-content: center; text-decoration:none;}"+

  // fitBoth
  ".fitBoth img {display: inline-block; vertical-align: middle; max-width: 100%; max-height:100%}"+
  //".spread1 .fitVeritcal img {max-width: 100%;}"+
  ".spread2 .fitBoth img {max-width: 50%;}"+

  // fitVertical styles
  ".fitVertical img {display: inline-block; vertical-align: middle; max-height:100%}"+
  //".spread1 .fitVeritcal img {max-width: 100%;}"+
  ".spread2 .fitVertical img {max-width: 50%;}"+

  // fitHorizontal styles
  ".fitHorizontal img {display: inline-block; vertical-align: middle; max-width:100%}"+
  //".spread1 .fitHorizontal img {max-width: 100%;}"+
  ".spread2 .fitHorizontal img {max-width:50%;}"+

  "#preload {display: none;}.img-url {display: none;}"+
  "a:hover {cursor: pointer; text-decoration: none;}"+
  "a:visited, a:active {color: inherit;}"+
  ".disabled > a:hover { background-color: transpsrent; background-image: none; color: #333333 !important; cursor: default; text-decoration: none;}"+
  ".disabled > a {color: #333333 !important;}:-moz-full-screen {background: #000 none repeat scroll 0 0;}"+
  ".icon_white {color: white;}"+
  ".imageBtn, .imageBtn:hover {position: fixed; margin-bottom: 25px; z-index: 1; width: calc(35% - 25px); height: calc(100% - 50px - 25px); font-size: 30px; color: rgba(255, 255, 255, 0.3); display: flex; align-items: center; justify-content: center; text-decoration:none;}"+
  "#leftBtn {margin-left: 25px; left: 0px;}"+
  "#rightBtn {margin-right: 25px; right: 0px;}"+

  // dropdown styles
  "#interfaceNav {margin: 0px; border: 0px;}"+
  ".dropdown-menu {text-align: left;}"+
  ".dropdown-menu span {text-align: center; display: inline-block; min-width: 18px}"+
  ".inverse-dropdown {background-color: #222 !important; border-color: #080808 !important;}"+
  ".inverse-dropdown > li > a {color: #999999 !important}"+
  ".inverse-dropdown > li > a:hover {color: #fff !important; background-color: #000 !important;}"+

  "#autoPager {display: inline}"+
  "#pageTimer {margin: 15px 15px 15px 3px; border: 0px; height: 18px; width: 46px;}"+
  "#pageChanger {display: inline}"+
  ".input-medium {margin: 15px 15px 15px 3px; height: 20px; width: 58px;}"+
  "#single-page-select {width: 60px}"+
  "#two-page-select {width: 60px}"+

  "@media (min-width: 768px) {"+
    ".navbar .navbar-nav {display: inline-block; float: none; vertical-align: top;}"+
    ".navbar .navbar-collapse {text-align: center;}"+
  "}";


// Image rendering option. needs ID to render swap
var renderType = 0;
var parent = document.head || document.documentElement;
var style = document.createElement('style');
style.type = 'text/css';
var renderStyle = document.createTextNode('');
renderStyle.id = 'renderStyle';
style.appendChild(renderStyle);
parent.appendChild(style);


// imagehight styles when fullscreen
var fullscreen_style = "div:-webkit-full-screen {background-color: black;}"+
  "div:-moz-full-screen {background-color: black;}"+
  "div:-ms-fullscreen {background-color: black;}"+
  "div:fullscreen {background-color: black;}"+
  ".fitVertical:-webkit-full-screen img {max-height: 100% !important;}"+
  ".fitVertical:-moz-full-screen img {max-height: 100% !important;}"+
  ".fitVertical:-ms-fullscreen img {max-height: 100% !important;}"+
  ".fitVertical:fullscreen img {max-height: 100% !important;}";


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

var addNavBar = function () {
  var html =
  '<nav id="interfaceNav"class="navbar navbar-inverse navbar-static-top">'+
    '<div class="container-fluid">'+
      '<div class="navbar-header">'+
        '<a class="navbar-brand" id="galleryInfo">Gallery</a>' +
        '<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#collapseNavbar"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span> </button>'+
      '</div>'+
      '<div class="collapse navbar-collapse" id="collapseNavbar">' +
        '<ul id="funcs" class="nav navbar-nav">' +
          '<li><a title="Left arrow or j" id="nextPanel"><span class="icon_white">&#11164;</span> Next</a></li>'+
          '<li><a title="Right arrow or k" id="prevPanel"><span class="icon_white">&#11166;</span> Prev</a></li>'+
          '<li><a title="Enter or Space" id="fullscreen"><span>&#9974;</span> Fullscreen</a></li>'+
          '<li><a title="t key" id="autoPager"><span>▶</span>Slideshow</a><input id="pageTimer" type="text" value="10"></li>'+
          '<li><a title="g key" id="pageChanger"<span>#</span>  Page</a>'+
            '<select class="input-medium" id="single-page-select"></select>'+
            '<select class="input-medium" id="two-page-select"></select>'+
          '</li>'+
          '<li class="dropdown">'+
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">Options<span class="caret"></span></a>'+
            '<ul class="inverse-dropdown dropdown-menu">'+
              '<li><a title="r" id="reload"><span>&#10227;</span> Reload</a></li>'+
              // To button's text indicate current state, its text content is previous state
              '<li><a title="b" class="fitBtn" id="fitBoth"><span>┃</span> Fit Vertical</a></li>' +
              '<li><a title="v" class="fitBtn" id="fitVertical"><span>━</span> Fit Horizontal</a></li>' +
              '<li><a title="h" class="fitBtn" id="fitHorizontal"><span>╋</span> Fit Both</a></li>' +
              '<li><a title="f" id="fullSpread"><span>🕮</span> Full Spread</a></li>' +
              '<li><a title="s" id="singlePage"><span>🗍</span> Single Page</a></li>' +
              '<li><a title="rendering" id="renderingChanger"><span>🖽</span> Rendering</a></li>' +
            '</ul>'+
          '</li>'+
        '</ul>'+
      '</div>'+
    '</div>'+
  '</nav>';
  document.body.innerHTML += html;
};

var addImgFrame = function () {
  html =
  '<div id="comicImages" class="fitVertical" tabindex="1">' +
  '<a id="leftBtn" class="imageBtn">&#11164;</a>' +
  // '<a id="imageDragger"></a>'+
  '<a id="rightBtn" class="imageBtn">&#11166;</a>' +
  '<div class="centerer"></div>'+
  '</div>' +
  '<div id="preload"></div>';
  document.body.innerHTML += html;
};

// prevent dropdown from close
$('.dropdown-menu').on('click', function(e) {
  e.stopPropagation();
});

///////////////////////////////////////////////////////////////////

// code from koreapyj/dcinside_lite
Array.prototype.contains = function (needle) {
  for (var i = 0; i < this.length; i++) if (this[i] === needle) return true;
  return false;
};
var xmlhttpRequest = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest :
function (details) {
  var bfloc = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.ontimeout = function () {
    details.ontimeout();
  };
  xmlhttp.onreadystatechange = function () {
    var responseState = {
      responseXML: (xmlhttp.readyState === 4 ? xmlhttp.responseXML : ''),
      responseText: (xmlhttp.readyState === 4 ? xmlhttp.responseText : ''),
      readyState: xmlhttp.readyState,
      responseHeaders: (xmlhttp.readyState === 4 ? xmlhttp.getAllResponseHeaders()  : ''),
      status: (xmlhttp.readyState === 4 ? xmlhttp.status : 0),
      statusText: (xmlhttp.readyState === 4 ? xmlhttp.statusText : '')
    };
    if (details.onreadystatechange) {
      details.onreadystatechange(responseState);
    }
    if (xmlhttp.readyState === 4) {
      if (details.onload && xmlhttp.status >= 200 && xmlhttp.status < 300) {
        details.onload(responseState);
      }
      if (details.onerror && (xmlhttp.status < 200 || xmlhttp.status >= 300)) {
        details.onerror(responseState);
      }
    }
  };
  try {
    xmlhttp.open(details.method, details.url);
  } catch (e) {
    if (details.onerror) {
      details.onerror({
        responseXML: '',
        responseText: '',
        readyState: 4,
        responseHeaders: '',
        status: 403,
        statusText: 'Forbidden'
      });
    }
    return;
  }
  if (details.headers) {
    for (var prop in details.headers) {
      if (details.headers.hasOwnProperty(prop)) {
        if (['origin',
        'referer'].indexOf(prop.toLowerCase()) == - 1)
        xmlhttp.setRequestHeader(prop, details.headers[prop]);
         else {
          bfloc = location.toString();
          history.pushState(bfloc, '로드 중...', details.headers[prop]);
        }
      }
    }
  }
  try
  {
    xmlhttp.send((typeof (details.data) !== 'undefined') ? details.data : null);
  }
  catch (e)
  {
    if (details.onerror) {
      details.onerror({
        responseXML: '',
        responseText: '',
        readyState: 4,
        responseHeaders: '',
        status: 403,
        statusText: 'Forbidden'
      });
    }
    return;
  }
  if (bfloc !== null)
  history.pushState(bfloc, bfloc, bfloc);
};

var simpleRequest = function (url, callback, method, headers, data, error) {
  var details = {
    method: method ? method : 'GET',
    url: url,
    timeout: 10000,
    ontimeout: function (e) {
      error(e);
    }
  };
  if (callback) {
    details.onload = function (response) {
      callback(response);
    };
  }
  if (headers) {
    details.headers = headers;
    for (var prop in details.headers) {
      if (details.headers.hasOwnProperty(prop)) {
        if (prop.toLowerCase() == 'content-type' && details.headers[prop].match(/multipart\/form-data/)) {
          details.binary = true;
        }
      }
    }
  }
  if (data) {
    details.data = data;
  }
  if (error) {
    details.onerror = error;
  }
  xmlhttpRequest(details);
};

///////////////////
// Api functions //
///////////////////

var user_lang = function () {
  var userLang = navigator.language || navigator.userLanguage;
  return userLang.toLowerCase();
};
var is_english = function () {
  var userLang = user_lang();
  return /^en/.test(userLang);
};
var is_japanese = function () {
  var userLang = user_lang();
  return /^ja/.test(userLang);
};
function eachWord(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

var parseHTML = function (response) {
  var doc = document.implementation.createHTMLDocument('temp');
  doc.documentElement.innerHTML = response.responseText;
  return doc;
};

var getGalleryID = function() {
  return document.location['href'].slice(BASE_LEN).split('#')[0];
}

var getGdata = function(id, callback) {
  var req_url = CDN_URL + '/json/' + id + '_list.json';
  console.log('request to ' + req_url);
  simpleRequest(req_url,
                callback,
                'GET');
}


//////////////////////////////////////

var renderChange = function () {
  renderType = (renderType + 1) % 3;
  // var renderStyle = document.getElementById('renderStyle');
  if (renderType === 0) {
      renderStyle.textContent = 'img {image-rendering: optimizeQuality; image-rendering: -webkit-optimize-contrast;}';
      document.getElementById('renderingChanger').innerHTML = '<span>🖽</span> optimized';
  }
  if (renderType === 1) {
      renderStyle.textContent = 'img {image-rendering: auto;}';
      document.getElementById('renderingChanger').innerHTML = '<span>🖽</span> auto';
  }
  if (renderType === 2) {
      renderStyle.textContent = 'img {image-rendering: -moz-crisp-edges; image-rendering: pixelated;}';
      document.getElementById('renderingChanger').innerHTML = '<span>🖽</span> pixelated';
  }
};

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


// original page changers
var singlePageChange_ = function (sel) {
  // console.log('singlePageChange called');
  var val = sel.value;
  enable($('#prevPanel'));
  enable($('#nextPanel'));
  if (val == 1) {
    disable($('#prevPanel'));
  } else if (val == number_of_images) {
    disable($('#nextPanel'));
  }
  curPanel = val;
  goofy_enabled = true;
  window.location.hash = val;
  goofy_enabled = false;
  //drawPanel();
  $('#single-page-select').trigger('blur');
};

var singlePageChange = function (){
  //console.log('singlePageChange called');
  singlePageChange_(document.getElementById('single-page-select'));
};

var twoPageChange_ = function (sel) {
  //console.log('twoPageChange called');
  var val = sel.value;
  enable($("#prevPanel"));
  enable($("#nextPanel"));
  if (val == 1) {
    disable($('#prevPanel'));
  } else if (val == number_of_images) {
    disable($('#nextPanel'));
  }
  curPanel = val;
  goofy_enabled = true;
  window.location.hash = val;
  goofy_enabled = false;
  $("#two-page-select").trigger("blur");
};

var twoPageChange = function () {
  //consle.log('twoPageChange called');
  twoPageChange_(document.getElementById('two-page-select'));
};


// image drag functions

var curDown = false;
var prevX, prevY;

var imgDrag = function (e) {
  if (curDown) {
    if (e.pageX > 0) {
      comicImages.scrollLeft += prevX - e.pageX;
      prevX = e.pageX;
    }
    if (e.pageY > 0) {
      comicImages.scrollTop += prevY - e.pageY;
      prevY = e.pageY;
    }
  }
};

var imgDragStart = function (e) {
  prevX = e.pageX;
  prevY = e.pageY;
  curDown = true;
};

var imgDragEnd = function (e) {
  curDown = false;
};

var doWheel = function (e) {
  let prev_scrollTop = comicImages.scrollTop;
  // let scrollTo = prev_scrollTop + e.deltaY;
  // comicImages.scrollTop = scrollTo;
  setTimeout(() => {
    if (comicImages.scrollTop == prev_scrollTop){
      if (e.deltaY > 0)
        nextPanel();
      else if (e.deltaY < 0)
        prevPanel();
    }
  }, 50);
};

var toggleTimer = function () {
  //console.log('toggleTimer called');
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

var doHotkey = function (e) {
  var key = e.keyCode;
  switch (key) {
    case 74:
      //alert('J paressed');
      nextPanel();
      break;
    case 81:
      //alert('Q pressed');
      nextPanel();
      break;
    case 37:
      //alert('LEFT pressed');
      nextPanel();
      break;
    case 75:
      //alert('K pressed');
      prevPanel();
      break;
    case 69:
      //alert('E pressed');
      prevPanel();
      break;
    case 39:
      //alert('RIGHT pressed')
      prevPanel();
      break;
    case 66:
      //alert('B pressed')
      fitBoth();
      break;
    case 86:
      //alert('V pressed')
      fitVertical();
      break;
    case 72:
      //alert('H pressed')
      fitHorizontal();
      break;
    case 70:
      //alert('F pressed')
      fullSpread();
      break;
    case 83:
      //alert('S pressed')
      singleSpread();
      break;
    case 13:
      //alert('ENTER pressed')
      fullscreen();
      break;
    case 32:
      //alert('SPACE pressed')
      fullscreen();
      break;
    case 84:
      //alert('T pressed');
      toggleTimer();
      break;
    case 82:
      //alert('R pressed');
      reloadImg();
      break;
    }
};

var createDropdown = function () {
  for (var i = 1; i <= number_of_images; i++) {
    var option = $('<option>', {
      html: '' + i,
      value: i
    });
    $('#single-page-select').append(option);
  }
  for (var i = 1; i <= number_of_images; i++) {
    var option = $('<option>', {
      html: '' + i,
      value: i
    });
    $('#two-page-select').append(option);
  }
};


var updateDropdown = function (num) {
  if (num == 1){
    $("#single-page-select option:selected").prop("selected", false);
    $("#single-page-select option").each(function() {
      if ($(this).val() == curPanel) {
        $(this).prop("selected", true);
        goofy_enabled = true;
        window.location.hash = curPanel;
        goofy_enabled = false;
        //$(this).parent().trigger("change");
      }
    });
  } else if (num == 2) {
    //var re = /^(\d+)-(\d*)$/;
    $("#two-page-select option:selected").prop("selected", false);
    $("#two-page-select option").each(function() {
      if ($(this).val() == curPanel) {
        $(this).prop("selected", true);
        goofy_enabled = true;
        window.location.hash = curPanel;
        goofy_enabled = false;
        //$(this).parent().trigger("change");
      }
    });
  }
};

var reloadImg = function () {
  drawPanel();
};

// original drawPanel()
var drawPanel = function () {
  // console.log('drawPanel_ called display:' + display);
  $('#preload').empty();
  // $('#comicImages').empty();
  var imgs = comicImages.getElementsByTagName('img');
  while (imgs.length > 0) {
    comicImages.removeChild(imgs[0]);
  }
  // var img_len = imgs.length;
  //for (var idx = 0; idx < img_len; idx++) {
  //  comicImages.removeChild(imgs[0]);
  //}
  $('body').removeClass();
  $('body').addClass('spread1');
  if (display == 2) {
    if (curPanel > 1 && Number(curPanel) < Number(number_of_images) && images[curPanel].width <= images[curPanel].height && images[curPanel - 1].width <= images[curPanel - 1].height) {
      // display curPanel + curPanel - 1. except panel 1
      var image = $('<img />', {
        src: images[curPanel].path,
        //onclick: 'nextPanel()'
      });
      $('#comicImages').append(image);
      image = $('<img />', {
        src: images[curPanel - 1].path,
        //onclick: 'prevPanel()'
      });
      $('#comicImages').append(image);
      $('body').removeClass();
      $('body').addClass('spread2');
      if (parseInt(curPanel) + 1 < number_of_images) {
        var image = $('<img />', {
          src: images[parseInt(curPanel) + 1].path
        });
        $('#preload').append(image);
      }
      if (parseInt(curPanel) + 2 < number_of_images) {
        var image = $('<img />', {
          src: images[parseInt(curPanel) + 2].path
        });
        $('#preload').append(image);
      }
      single_displayed = false;
    } else if (Number(curPanel) <= Number(number_of_images)) {
      // curPanel==1 or width > height. display one panel
      if (Number(curPanel) < Number(number_of_images)) {
        var image = $('<img />', {
          src: images[curPanel].path
        });
        $('#preload').append(image);
      }
      if (Number(curPanel) + 1 < Number(number_of_images)) {
        image = $('<img />', {
          src: images[parseInt(curPanel) + 1].path
        });
        $('#preload').append(image);
      }
      image = $('<img />', {
        src: images[Number(curPanel) - 1].path,
        //onclick: 'nextPanel()'
      });
      $('#comicImages').append(image);
      single_displayed = true;
    } else {
      // console.log('ERROR');
    }
  } else {
  // display == 1
    if (Number(curPanel) < Number(number_of_images)) {
      image = $('<img />', {
        src: images[curPanel].path
      });
      $('#preload').append(image);
    }
    if (parseInt(curPanel) + 1 < number_of_images) {
      image = $('<img />', {
        src: images[parseInt(curPanel) + 1].path
      });
      $('#preload').append(image);
    }
    var image = $('<img />', {
      src: images[Number(curPanel) - 1].path,
    });
    $('#comicImages').append(image);
  }
  document.getElementById('leftBtn').addEventListener('click', nextPanel);
  document.getElementById('rightBtn').addEventListener('click', prevPanel);
  $('#comicImages').scrollTop(0);
  $('body').scrollTop(0);
  // $('#comicImages').focusWithoutScrolling();
};

var hashChanged = function () {
  // console.log('hashChanged called');
  if (goofy_enabled) return;
  var hash = location.hash;
  if (hash) {
    hash = Number(hash.replace('#', ''));
    if (display == 2 && !isNaN(hash) && hash <= number_of_images && hash > 0) {
      curPanel = hash;
      fullSpread();
    } else if (display == 1 && !isNaN(hash) && hash <= number_of_images && hash > 0) {
      curPanel = hash;
      singleSpread();
    } else {
      console.log('error');
      fullSpread();
    }
  } else {
    //fullSpread();
    singleSpread();
  }
  if (Number(curPanel) == 1) {
    disable($('#prevPanel'));
  }
  if (Number(curPanel) >= number_of_images) {
    disable($('#nextPanel'));
  }
};

var filterInt = function (value) {
  if(/^(\-|\+)?([0-9]+)$/.test(value))
    return Number(value);
  return NaN;
};

var goPanel = function () {
  let target = filterInt(prompt('target page'));
  if (isNaN(target) || (target < 0)|| (target > number_of_images))
    return;
  panelChange(target);
};

var panelChange = function (target) {
  if (display == 1) {
    $('#single-page-select').prop('selectedIndex', target - 1);
    singlePageChange();
  } else {
    $('#two-page-select').prop('selectedIndex', target - 1);
    twoPageChange();
  }
};

var prevPanel = function () {
  // console.log('prevPanel called');
  curPanel = parseInt(curPanel);
  if (display == 1) {
    if (curPanel > 1) {
      panelChange(curPanel - 1);
    }
  } else {
    if (curPanel > 1) {
      if ((curPanel > 2) && (images[curPanel - 2].width <= images[curPanel - 2].height)) {
        panelChange(curPanel - 2);
      } else {
        panelChange(curPanel - 1);
      }
    }
  }
  // $('#comicImages').focusWithoutScrolling();
  $('body').scrollTop(0);
};

var nextPanel = function () {
  // console.log('nextPanel called');
  curPanel = parseInt(curPanel);
  if (display == 1) {
    if (curPanel < number_of_images) {
      panelChange(curPanel + 1);
    }
  } else {
    if (curPanel < number_of_images) {
      if ((curPanel + 1 < number_of_images) && !(single_displayed)) {
        panelChange(curPanel + 2);
      } else {
        panelChange(curPanel + 1);
      }
    }
  }
  // $('#comicImages').focusWithoutScrolling();
  $('body').scrollTop(0);
};

var fullSpread = function () {
  //console.log('fullSpread called');
  $('#singlePage').parent().show();
  $('#fullSpread').parent().hide();
  $('#single-page-select').hide();
  $('#two-page-select').show();
  $('#singlePage').show();
  updateDropdown(2);
  spread(2);
};

var singleSpread = function () {
  //console.log('singleSpread called');
  $('#singlePage').parent().hide();
  $('#fullSpread').parent().show();
  $('#two-page-select').hide();
  $('#single-page-select').show();
  $('#fullSpread').show();
  updateDropdown(1);
  spread(1);
};

var spread = function (num) {
  $('body').removeClass('spread' + display);
  display = num;
  $('body').addClass('spread' + display);
  if (display == 2) {
    /* original logic
    var found = false;
    var pattern = curPanel + '-';
    var () = $('#two-page-select option').each(function  {
      if ($(this).val().search(pattern) > - 1) {
        found = true;
      }
    });
    if (!found) {
      --curPanel;
    }
    */
  }
  drawPanel();
};

var resetFit = function () {
  $('#comicImages').removeClass();
  $('.fitBtn').parent().hide();
};

var fitBoth = function () {
  // console.log('fitboth called');
  resetFit();
  $('#comicImages').addClass('fitBoth');
  $('#fitHorizontal').parent().show();
  $('body').scrollTop(0);
};

var fitHorizontal = function () {
  // console.log('fitHorizontal called');
  resetFit();
  $('#comicImages').addClass('fitHorizontal');
  $('#fitVertical').parent().show();
  $('body').scrollTop(0);
};

var fitVertical = function () {
  // console.log('fitVertical called');
  resetFit();
  $('#comicImages').addClass('fitVertical');
  $('#fitBoth').parent().show();
  $('body').scrollTop(0);
};

var fullscreen = function () {
  var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
    (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
    (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
    (document.msFullscreenElement && document.msFullscreenElement !== null);
  // console.log('fullscreen called');
  var elem = comicImages;
  if (!isInFullScreen) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
  }
};

var setGallery = function (response, callback) {
  var gall_id = getGalleryID();
  console.log(gall_id);
  var image_datas = JSON.parse(response.responseText);
  var len = image_datas.length;
  for (var idx = 0; idx < len; idx++) {
    var data = image_datas[idx];
    images[idx] = {};
    images[idx].path = CDN_URL + '/data/' + gall_id + '/' + data['name'];
    images[idx].width = data['width'];
    images[idx].height = data['height'];
  }

  // make image list
  number_of_images = len;
  createDropdown();
  // images[curPanel]={page:curPanel, width:unsafeWindow.x, height:unsafeWindow.y, path:document.getElementById("img").src, token:match[1], url:document.location};

  callback();
}

var init = function () {
  // clear page
  document.body.innerHTML = '';

  addNavBar();
  addImgFrame();

  clearStyle();
  addStyleFromResource('bt');
  addStyle('div#i1 {display:none;} p.ip {display:none;}');
  addStyle(viewer_style);
  addStyle(fullscreen_style);
  document.body.setAttribute('class', 'spread1');

  comicImages = document.getElementById("comicImages");


  // set cur panel
  curPanel = 1;
  getGdata(getGalleryID(), function(response) {
    setGallery(response, function(){
      window.onhashchange = hashChanged;
      document.addEventListener('keydown', doHotkey);
      document.getElementById('galleryInfo').href = 'https://hiyobi.me/info/' + getGalleryID();
      document.addEventListener('wheel', doWheel);
      document.getElementById('prevPanel').addEventListener('click', prevPanel);
      document.getElementById('nextPanel').addEventListener('click', nextPanel);
      document.getElementById('fitBoth').addEventListener('click', fitBoth);
      document.getElementById('fitVertical').addEventListener('click', fitVertical);
      document.getElementById('fitHorizontal').addEventListener('click', fitHorizontal);
      document.getElementById('fullscreen').addEventListener('click', fullscreen);
      document.getElementById('fullSpread').addEventListener('click', fullSpread);
      document.getElementById('singlePage').addEventListener('click', singleSpread);
      document.getElementById('renderingChanger').addEventListener('click', renderChange);
      document.getElementById('reload').addEventListener('click', reloadImg);
      document.getElementById('autoPager').addEventListener('click', toggleTimer);
      document.getElementById('pageChanger').addEventListener('click', goPanel);
      document.getElementById('single-page-select').addEventListener('change', singlePageChange);
      document.getElementById('two-page-select').addEventListener('change', twoPageChange);
      document.getElementById('comicImages').addEventListener('dragstart', imgDragStart);
      document.getElementById('comicImages').addEventListener('drag', imgDrag);
      document.getElementById('comicImages').addEventListener('dragend', imgDragEnd);
      $('.navbar ul li').show();
      $('#fullSpread').hide();
      $('#singlePage').hide();
      var docElm = document.documentElement;
      if (!docElm.requestFullscreen && !docElm.mozRequestFullScreen && !docElm.webkitRequestFullScreen && !docElm.msRequestFullscreen) {
        $('#fullscreen').parent().hide();
      }
      renderChange();
      fitBoth();
      drawPanel();
    });
  });
};

init();
