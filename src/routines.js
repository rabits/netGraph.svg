/*!
 * netGraph routines
 * Module to store some document routines
 * @version 0.0.1
 * @copyright Rabit <home@rabits.org>
 * @license MIT
 */
'use strict'

// Function to download data to a file
function download(data, filename, type) {
  var file = new Blob([data], {type: type})
  if( window.navigator.msSaveOrOpenBlob ) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename)
  } else { // Others
    var url = URL.createObjectURL(file)
    var f = svg.append('svg:foreignObject')
    var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
    a.href = url
    a.download = filename
    f.node().appendChild(a)
    a.click()
    setTimeout(function() {
      f.remove()
      window.URL.revokeObjectURL(url)
    }, 0)
  }
}

function beautifyNode(node, indent, level = 1) {
  var childs = [], n
  for( n of node.childNodes )
    childs.push(n)
  for( n of childs ) {
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
  var to_remove = [], n
  for( n of clone.childNodes ) {
    if( ['script', 'defs', 'style'].indexOf(n.nodeName) < 0 && n.id !== container.attr('id') )
      to_remove.push(n)
  }
  for( n of to_remove )
    n.remove()

  // Let's add text with indent to beautify the container output
  var c = clone.getElementById(container.attr('id'))

  if( ! c.previousSibling || c.previousSibling.nodeName !== '#text' )
    clone.insertBefore(document.createTextNode('\n  '), c)
  if( ! c.nextSibling || c.nextSibling.nodeName !== '#text' )
    clone.insertBefore(document.createTextNode('\n  '), c.nextElementSibling)

  beautifyNode(c, 2, level)

  return clone.outerHTML
}
