/**
 * jQuery Longclick Event
 * ======================
 * Press & hold mouse button "long click" special event for jQuery 1.4.x
 *
 * @license Longclick Event
 * Copyright (c) 2010 Petr Vostrel (http://petr.vostrel.cz/)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Version: 0.3.2
 * Updated: 2010-06-22
 */
!function(t){function i(i){return t.each("touchstart touchmove touchend touchcancel".split(/ /),function(n,o){i.addEventListener(o,function(){t(i).trigger(o)},!1)}),t(i)}function n(i){function n(){t(o).data(j,!0),i.type=u,jQuery.event.dispatch.apply(o,c)}if(!t(this).data(y)){var o=this,c=arguments;t.longclick.origx=i.offsetX,t.longclick.origy=i.offsetY,t(this).data(j,!1).data(y,setTimeout(n,t(this).data(v)||t.longclick.duration))}}function o(i){(Math.abs(t.longclick.origx-i.offsetX)>10||Math.abs(t.longclick.origy-i.offsetY)>10)&&c(i)}function c(){t(this).data(y,clearTimeout(t(this).data(y))||null)}function e(i){return t(this).data(j)?i.stopImmediatePropagation()||!1:void 0}var a=t.fn.click;t.fn.click=function(i,n){return n?t(this).data(v,i||null).bind(u,n):a.apply(this,arguments)},t.fn.longclick=function(){var i=[].splice.call(arguments,0),n=i.pop(),o=i.pop(),c=t(this).data(v,o||null);return n?c.click(o,n):c.trigger(u)},t.longclick={duration:500,origx:0,origy:0},t.event.special.longclick={setup:function(){/iphone|ipad|ipod/i.test(navigator.userAgent)?i(this).bind(p,n).bind([k,m,b].join(" "),c).bind(s,e).css({WebkitUserSelect:"none"}):t(this).bind(r,n).bind(d,o).bind([f,h,g].join(" "),c).bind(s,e)},teardown:function(){t(this).unbind(l)}};var u="longclick",l="."+u,r="mousedown"+l,s="click"+l,d="mousemove"+l,f="mouseup"+l,h="mouseout"+l,g="contextmenu"+l,p="touchstart"+l,k="touchend"+l,m="touchmove"+l,b="touchcancel"+l,v="duration"+l,y="timer"+l,j="fired"+l}(jQuery);