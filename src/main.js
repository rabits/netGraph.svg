/*!
 * netGraph
 * A tool to create your net schema in a simple svg package
 * @version 0.0.1
 * @copyright Sergei Parshev <sergei@parshev.net>
 * @license MIT
 */
'use strict'

var draw = SVG('drawing')
var container = SVG.get('container')
var items = SVG.get('items')
var links = SVG.get('links')
var markers = SVG.get('markers')

var menu = null
var menu_event = null
var menu_data = {
  undefined:[ // Global menu
    { title: 'Add new item to the workspace', icon: 'add', color: '#0a0', action: function(e) {
      var item = items.group()
        .addClass('item')
        .attr({name: 'noname'})
        .translate(menu_event.pageX, menu_event.pageY)
      item.group().addClass('base').circle(0).animate(300).radius(50)

      item.draggy().on('dragend', function() {
        updateDocumentRect(this.node.getBoundingClientRect())
      })
      item.on('mousedown', function(e) {
        // TODO: select item, show verbose data & links
        SVG.adopt(e.target).parent('.item').front()
      })
      item.on('contextmenu', function(e) {
        e.stopPropagation()
        e.preventDefault()
        showMenu(e, this)
      })
    }},
    { title: 'Save SVG document', icon: 'save', color: '#a0a', action: function() {
      console.debug('save document')
      download(cleanSVG(draw.node, 2), 'netGraph.svg', 'image/svg+xml')
    }},
  ],
  item:[ // Item menu
    { title: 'Remove item from the workspace', icon: 'remove', color: '#a00', action: function(e) {
      menu_event.t.remove()
    }},
    { title: 'Create link', icon: 'link', color: '#aa0', action: function(e) {
      e.stopPropagation()
      hideMenu()
      items.addClass('blink')
      draw.on('mousedown', function(e) {
        var target = SVG.adopt(e.target).parent('.item')
        if( target ) {
          var conn = menu_event.t.connectable({
            source: menu_event.t.select('.base').first(),
            target: target.select('.base').first(),
            container: links,
            marker: 'default',
            sourceAttach: 'perifery',
            targetAttach: 'perifery',
          }, target)
        }
        draw.off('mousedown')
        items.removeClass('blink')
      })
    }},
    { title: 'Disconnect all links', icon: 'unlink', color: '#a0a', action: function(e) {
      // TODO: unlink all the links connected to the target object
    }},
  ],
  link:[ // Link menu
    { title: 'Destroy link', icon: 'unlink', color: '#a00', action: function(e) {
      // TODO: remove link connecting two objects
    }},
  ]
}

function showMenu(e, target) {
  console.debug('menu show')
  menu = draw.group()
    .move(e.pageX, e.pageY)

  e.t = target
  e.cx = e.clientX
  e.cy = e.clientY

  menu_event = e
  var data = menu_data[e.t.attr('class')]

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
      menu.x(window.scrollX)
  }
  if( radius()+item_r+e.cx > window.innerWidth ) { // Right
      left_right_triggered = true
      console.log('right boundaries')
      angle *= 0.5
      sector = 0.5*angle/data.length
      e.cx = window.innerWidth
      menu.x(window.innerWidth+window.scrollX)
  }
  if( radius()+item_r > e.cy ) { // Top
      console.log('top boundaries')
      angle *= 0.5
      sector = sector !== 0 ? sector*0.5 : -90+0.5*angle/data.length
      e.cy = 0
      menu.y(window.scrollY)
  }
  if( radius()+item_r+e.cy > window.innerHeight ) { // Bottom
      console.log('bottom boundaries')
      angle *= -0.5
      sector = sector !== 0 ? 180-sector*0.5 : -90+0.5*angle/data.length
      e.cy = window.innerHeight
      menu.y(window.innerHeight+window.scrollY)
  }
  if( !left_right_triggered && sector !== 0 && radius()+item_r > e.cx ) { // Left
      console.log('left boundaries')
      angle *= -0.5
      sector = angle < 0 ? 0.5*angle/data.length : 180+0.5*angle/data.length
      e.cx = 0
      menu.x(window.scrollX)
  }
  if( !left_right_triggered && sector !== 0 && radius()+item_r+e.cx > window.innerWidth ) { // Right
      console.log('right boundaries')
      angle *= 0.5
      sector = angle > 0 ? 0.5*angle/data.length : 180+0.5*angle/data.length
      e.cx = window.innerWidth
      menu.x(window.innerWidth+window.scrollX)
  }

  radius = radius()
  for( var i in data ) {
    var item = menu.group()
    item.element('title').words(data[i].title)
    item.circle(item_r*2).fill(data[i].color)
    item.use('icon-'+data[i].icon).move(item_r-item_r*0.6,item_r-item_r*0.6).size(item_r*1.2)
    item.on('mousedown', data[i].action)
    item.opacity(0.0).cx(0).cy(radius).animate(300)
      .opacity(0.9).rotate(sector+i*angle/data.length, item_r, -radius+item_r).rotate(0)
  }
}
function hideMenu() {
  console.debug('menu hide')
  if( menu )
    menu.remove()
  menu = null
}

document.addEventListener('contextmenu', function(e) {
  e.preventDefault()
  showMenu(e, draw)
})
document.addEventListener('mousedown', function(e) {
  hideMenu(e.detail)
})

// Function to download data to a file
function download(data, filename, type) {
  var file = new Blob([data], {type: type})
  if( window.navigator.msSaveOrOpenBlob ) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename)
  } else { // Others
    var url = URL.createObjectURL(file)
    var f = draw.element('foreignObject')
    var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
    a.href = url
    a.download = filename
    f.node.appendChild(a)
    a.click()
    setTimeout(function() {
      f.remove()
      window.URL.revokeObjectURL(url)
    }, 0);
  }
}

function beautifyNode(node, indent, level = 1) {
  var childs = []
  for( var n of node.childNodes )
    childs.push(n)
  for( var n of childs ) {
    if( n.nodeName === '#text' ) {
      n.remove()
      continue
    }
    beautifyNode(n, indent, level+1)
    node.insertBefore(document.createTextNode('\n'+' '.repeat(indent*level)), n)
  }
  if( childs.length > 0 )
    node.appendChild(document.createTextNode('\n'+' '.repeat(indent*(level-1))))
}

// Clean the svg document and return beautiful xml string
function cleanSVG(node, level) {
  var clone = node.cloneNode(true)

  // Removing non-document nodes
  var to_remove = []
  for( var n of clone.childNodes ) {
    if( ['script', 'defs', 'style'].indexOf(n.nodeName) < 0 && n.id !== container.id() )
      to_remove.push(n)
  }
  for( var n of to_remove )
    n.remove()

  // Let's add text with indent to beautify the container output
  var c = clone.getElementById(container.id())

  if( ! c.previousSibling || c.previousSibling.nodeName !== '#text' )
    clone.insertBefore(document.createTextNode('\n  '), c)
  if( ! c.nextSibling || c.nextSibling.nodeName !== '#text' )
    clone.insertBefore(document.createTextNode('\n  '), c.nextElementSibling)

  beautifyNode(c, 2, level)

  return clone.outerHTML
}

// Set document size to window size at the first time
if( draw.width() === 0 || draw.height() === 0 ) {
  updateDocumentRect({top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth})
}

function updateDocumentRect(rect) {
  if( draw.width() < rect.right + window.scrollX )
    draw.width(rect.right + window.scrollX)
  if( draw.height() < rect.bottom + window.scrollY )
    draw.height(rect.bottom + window.scrollY)
}

// Look for document changes to adjust document size
new MutationObserver(function(mutationsList, observer) {
  console.log('mutation here')
  for( var mutation of mutationsList ) {
    for( var node of mutation.addedNodes ) {
      if( node.getBoundingClientRect )
        updateDocumentRect(node.getBoundingClientRect())
    }
  }
}).observe(container.node, { attributes: false, childList: true, subtree: true })
