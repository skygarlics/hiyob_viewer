// ==UserScript==
// @name          hiyobi_viewer
// @namespace     skygarlics
// @version       190729
// @author        aksmf
// @description   image viewer for hiyobi
// @include       https://xn--9w3b15m8vo.asia/reader/*
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
    Timer
*/

var init = function() {
    var addStyle = typeof GM_addStyle !== 'undefined' ? GM_addstyle :
    function (css) {
    var parent = document.head || document.documentElement;
    var style = document.createElement('style');
    style.type = 'text/css';
    var textNode = document.createTextNode(css);
    style.appendChild(textNode);
    parent.appendChild(style);
    };

    // fixed navbar
    $("body > nav").addClass("fixed-top");
    addStyle("#comicscroll img {padding-top:56px; margin-bottom:0px}")
}

init()