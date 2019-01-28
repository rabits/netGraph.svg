/*!
 * netGraph menu
 * Module to draw context menu in svg document
 * @version 0.0.1
 * @copyright Rabit <home@rabits.org>
 * @license MIT
 */
'use strict'
var Menu = function(options) {
  var menu_svg = options.svg
  var menu_data = options.data

  var menu_element = null
  var menu_event = null

  // Methods
  function showMenu(e, target) {
    console.debug('menu show')
    menu_element = menu_svg.append('svg:g')
      .attr('class', 'menu')
      .attr('transform', `translate(${e.pageX},${e.pageY})`)

    e.t = target
    e.cx = e.clientX
    e.cy = e.clientY

    menu_event = e
    var data = menu_data[e.t.attr('menuType')]

    var left_right_triggered = false
    var angle = 360
    var sector = 0
    var item_r = 25
    var radius = function(){
      return Math.max(item_r*2, data.length*(item_r+2)*(360/Math.abs(angle))/3.14)
    }

    // Check client boundaries
    if( radius()+item_r > e.cx ) { // Left
        left_right_triggered = true
        console.log('left boundaries')
        angle *= -0.5
        sector = 0.5*angle/data.length
        e.cx = 0
        menu_element.attr('x', window.scrollX)
    }
    if( radius()+item_r+e.cx > window.innerWidth ) { // Right
        left_right_triggered = true
        console.log('right boundaries')
        angle *= 0.5
        sector = 0.5*angle/data.length
        e.cx = window.innerWidth
        menu_element.attr('x', window.innerWidth+window.scrollX)
    }
    if( radius()+item_r > e.cy ) { // Top
        console.log('top boundaries')
        angle *= 0.5
        sector = sector !== 0 ? sector*0.5 : -90+0.5*angle/data.length
        e.cy = 0
        menu_element.attr('y', window.scrollY)
    }
    if( radius()+item_r+e.cy > window.innerHeight ) { // Bottom
        console.log('bottom boundaries')
        angle *= -0.5
        sector = sector !== 0 ? 180-sector*0.5 : -90+0.5*angle/data.length
        e.cy = window.innerHeight
        menu_element.attr('y', window.innerHeight+window.scrollY)
    }
    if( !left_right_triggered && sector !== 0 && radius()+item_r > e.cx ) { // Left
        console.log('left boundaries')
        angle *= -0.5
        sector = angle < 0 ? 0.5*angle/data.length : 180+0.5*angle/data.length
        e.cx = 0
        menu_element.attr('x', window.scrollX)
    }
    if( !left_right_triggered && sector !== 0 && radius()+item_r+e.cx > window.innerWidth ) { // Right
        console.log('right boundaries')
        angle *= 0.5
        sector = angle > 0 ? 0.5*angle/data.length : 180+0.5*angle/data.length
        e.cx = window.innerWidth
        menu_element.attr('x', window.innerWidth+window.scrollX)
    }

    radius = radius()
    var icon_transform = d3Transform()
      .translate(item_r-item_r*0.6, item_r-item_r*0.6)
    for( var i in data ) {
      var item_transform = d3Transform()
        .translate(-item_r, radius-item_r)
        .rotate(sector+i*angle/data.length, item_r, -radius+item_r)
      var item = menu_element.append('svg:g').attr('class', 'item')
      item.append('svg:title')
        .text(data[i].title)
      item.append('svg:circle')
        .attr('r', item_r)
        .attr('cx', item_r)
        .attr('cy', item_r)
        .attr('fill', data[i].color)
      item.append('svg:use')
        .attr('href', '#icon-'+data[i].icon)
        .attr('transform', d3Transform(icon_transform).rotate(-(sector+i*angle/data.length), item_r*0.6, item_r*0.6))
        .attr('width', item_r*1.2)
        .attr('height', item_r*1.2)
      item.attr('opacity', 0.9)
        .attr('transform', item_transform)

      function getActionFun(action) {
        return function() {
          d3.event.stopPropagation()
          hideMenu()
          action(menu_event)
        }
      }
      item.on('mousedown', getActionFun(data[i].action))
    }
  }

  function hideMenu() {
    console.debug('menu hide')
    if( menu_element )
      menu_element.remove()
    menu_element = null
  }

  // Exposed public methods
  return {
    show: showMenu,
    hide: hideMenu,
  }
}
