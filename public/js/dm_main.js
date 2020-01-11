"use strict";
/**
 * Created by sandberg on 28/09/2017.
 */

$( document ).ready( readyFn );

function navbarHeight() {
  let navbar = $('#navbarcontainer');
  let navbarcontainer = navbar.height();
  return navbarcontainer;
}

function readyFn( jQuery ) {
  $('.tooltipped').tooltip({delay: 50});
  $(".sidenav").sidenav();
  $(".dropdown-trigger").dropdown();
  $('.collapsible').collapsible();
  $('.modal').modal();
  $('.stdheader').floatThead({
    top: navbarHeight,
    position: 'fixed'
  });
}
