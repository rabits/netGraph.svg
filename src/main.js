/*!
 * netGraph
 * A tool to create your net schema in a simple svg package
 * @version 0.0.1
 * @copyright Rabit <home@rabits.org>
 * @license MIT
 */
'use strict'

// set up SVG for D3
const colors = d3.scaleOrdinal(d3.schemeCategory10)
const svg = d3.select('svg')
const container = svg.select('#container')

const menu = Menu({
  svg: svg,
  data: {
    null:[ // Global menu
      { title: 'Add new node to the workspace (Ctrl+MouseLeft)', icon: 'add', color: '#0a0', action: function(e) {
        createNode([e.pageX, e.pageY])
        VIEW.nodes.call(VIEW.drag)
      }},
      { title: 'Save SVG document (Shift+S)', icon: 'save', color: '#a0a', action: function() {
        saveSVG()
      }},
      { title: 'Disable force (Shift+F)', icon: 'force', color: '#aaa', action: function() {
        VIEW.force.stop()
      }},
    ],
    node:[ // Node menu
      { title: 'Remove node from the workspace (Del)', icon: 'remove', color: '#a00', action: function(e) {
        deleteNode(selectedNode)
        selectedNode = null
      }},
      { title: 'Disconnect all links (Ctrl+Del)', icon: 'unlink', color: '#a0a', action: function(e) {
        deleteLinksForNode(selectedNode)
      }},
      // TODO
      /*{ title: 'Create link (Ctrl+MouseLeft)', icon: 'link', color: '#aa0', action: function(e) {
        menu.hide()
        items.addClass('blink')
        svg.on('mousedown', function(e) {
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
          svg.off('mousedown')
          items.removeClass('blink')
        })
      }},*/
      { title: 'Toggle static (S)', icon: 'static', color: '#0aa', action: function(e) {
        setNodeStatic(selectedNode)
      }},
      { title: 'Edit (E)', icon: 'edit', color: '#0aa', action: function(e) {
        setNodeEdit(selectedNode)
      }},
    ],
    link:[ // Link menu
      { title: 'Destroy link (Del)', icon: 'unlink', color: '#a00', action: function(e) {
        deleteLink(selectedLink)
        selectedLink = null
      }},
    ],
  }
})

document.addEventListener('contextmenu', function(e) {
  e.preventDefault()
  menu.show(e, svg)
})
document.addEventListener('mousedown', function(e) {
  menu.hide()
})

// TODO: bring selected object to front
/*d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};*/

// Set document size to window size at the first time
if( ! svg.attr('width') || !svg.attr('height') ) {
  updateDocumentRect({top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth})
}

function updateDocumentRect(rect) {
  var width = rect.right + window.scrollX
  var height = rect.bottom + window.scrollY
  if( svg.attr('width') < width )
    svg.attr('width', svg.width = width)
  if( svg.attr('height') < height )
    svg.attr('height', svg.height = height)
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
}).observe(container.node(), { attributes: false, childList: true, subtree: true })

let lastNodeId = 0
const DATA = {
  nodes: [],
  links: [],
}
const VIEW = {
  nodes: svg.select('#nodes').selectAll('g'),
  links: svg.select('#links').selectAll('path'),
  // Force field
  force: d3.forceSimulation()
    .force('link', d3.forceLink().id((d) => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-500))
    .force('x', d3.forceX(svg.width / 2))
    .force('y', d3.forceY(svg.height / 2))
    .on('tick', tick),
  // Dragging mechanism
  drag: d3.drag()
    .on('start', (d) => {
      if( !d3.event.active ) VIEW.force.alphaTarget(0.3).restart()

      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (d) => {
      d.fx = d.sx = d3.event.x
      d.fy = d.sy = d3.event.y
    })
    .on('end', (d) => {
      if( !d3.event.active ) VIEW.force.alphaTarget(0)

      d.fx = null
      d.fy = null
    }),
  // line displayed when dragging new nodes
  dragLine: svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0')
}

// mouse event vars
let selectedNode = null
let selectedLink = null
let mousedownLink = null
let mousedownNode = null
let mouseupNode = null

function resetMouseVars() {
  mousedownNode = null
  mouseupNode = null
  mousedownLink = null
}

// update force layout (called automatically each iteration)
function tick() {
  VIEW.nodes.attr('transform', (d) => d.static ? `translate(${d.x = d.sx},${d.y = d.sy})` : `translate(${d.x},${d.y})`)

  // draw directed edges with proper padding from node centers
  VIEW.links.attr('d', (d) => {
    const deltaX = d.target.x - d.source.x
    const deltaY = d.target.y - d.source.y
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const normX = deltaX / dist
    const normY = deltaY / dist
    const sourcePadding = d.left ? 17 : 12
    const targetPadding = d.right ? 17 : 12
    const sourceX = d.source.x + (sourcePadding * normX)
    const sourceY = d.source.y + (sourcePadding * normY)
    const targetX = d.target.x - (targetPadding * normX)
    const targetY = d.target.y - (targetPadding * normY)

    return `M${sourceX},${sourceY}L${targetX},${targetY}`
  })
}

// update graph (called when needed)
function restart() {
  console.log('exec restart')

  VIEW.nodes = VIEW.nodes.data(DATA.nodes, (d) => d.id)

  // update existing nodes (static & selected visual states)
  VIEW.nodes
    .classed('static', (d) => d.static)
    .classed('selected', (d) => d === selectedNode)
  VIEW.nodes.selectAll('.bg')
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
  VIEW.nodes.selectAll('.name')
    .text((d) => d.name)
    .visible

  // remove old nodes
  VIEW.nodes.exit().remove()

  // add new nodes
  const g = VIEW.nodes.enter().append('svg:g')
    .attr('menuType', 'node')
    .classed('node', true)
    .classed('selected', (d) => d === selectedNode)
    .classed('static', (d) => d.static)
    .on('contextmenu', function() {
      d3.event.preventDefault()
      d3.event.stopPropagation()
      menu.show(d3.event, d3.select(this))
    })

  g.append('svg:circle')
    .attr('class', 'bg')
    .attr('r', 12)
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('stroke', (d) => d3.rgb(colors(d.id)).darker().toString())
    .on('mousedown', (d) => {
      menu.hide()
      // select node
      selectedNode = mousedownNode = d
      // TODO: d3.select(this).moveToFront()
      selectedLink = null

      if( d3.event.button > 0 )
        d3.event.stopPropagation()
      if( d3.event.ctrlKey ) {
        d3.event.stopPropagation()
        // reposition drag line
        VIEW.dragLine
          .style('marker-end', 'url(#end-arrow)')
          .classed('hidden', false)
          .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`)
      }

      restart()
    })
    .on('mouseup', (d) => {
      if( !mousedownNode ) return

      // needed by FF
      VIEW.dragLine
        .classed('hidden', true)
        .style('marker-end', '')

      // check for drag-to-self
      mouseupNode = d
      if( mouseupNode === mousedownNode ) {
        resetMouseVars()
        return
      }

      // unenlarge target node
      d3.select(this).attr('transform', '')

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id
      const source = isRight ? mousedownNode : mouseupNode
      const target = isRight ? mouseupNode : mousedownNode

      const link = DATA.links.filter((l) => l.source === source && l.target === target)[0]
      if( link ) {
        link[isRight ? 'right' : 'left'] = true
      } else {
        DATA.links.push({ source, target, left: !isRight, right: isRight })
      }

      // select new link
      selectedLink = link
      selectedNode = null
      restart()
    })

  // show node IDs
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', -20)
    .attr('class', 'name')
    .text((d) => d.name)

  // TODO: node editor
  /*var f = g.append('svg:foreignObject')
    .attr('x', 0)
    .attr('y', -20)
    .attr('height', 100)
    .attr('width', 100)
  if( f.node() ) {
    f.node().appendChild(document.createElementNS('http://www.w3.org/1999/xhtml', 'input'))
    f.select('div').text('lool')
  }*/

  VIEW.nodes = g.merge(VIEW.nodes)

  VIEW.links = VIEW.links.data(DATA.links)

  // update existing links
  VIEW.links.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')

  // remove old links
  VIEW.links.exit().remove()

  // add new links
  VIEW.links = VIEW.links.enter().append('svg:path')
    .attr('menuType', 'link')
    .attr('class', 'link')
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
    .on('contextmenu', function() {
      d3.event.preventDefault()
      d3.event.stopPropagation()
      menu.show(d3.event, d3.select(this))
    })
    .on('mousedown', (d) => {
      menu.hide()
      d3.event.stopPropagation()
      if( d3.event.ctrlKey ) return

      // select link
      selectedLink = mousedownLink = d
      selectedNode = null
      restart()
    })
    .merge(VIEW.links)

  // set the graph in motion
  VIEW.force.nodes(DATA.nodes)
    .force('link').links(DATA.links)

  VIEW.force.alphaTarget(0.3).restart()
}

function mousedown() {
  // because :active only works in WebKit?
  svg.classed('active', true)

  selectedNode = selectedLink = mousedownNode = mousedownLink = null

  if( d3.event.button > 0 || !d3.event.ctrlKey ) return

  // insert new node at point
  createNode(d3.mouse(this))
}

function mousemove() {
  if( !mousedownNode ) return

  // update drag line
  VIEW.dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`)
}

function mouseup() {
  if( mousedownNode ) {
    // hide drag line
    VIEW.dragLine
      .classed('hidden', true)
      .style('marker-end', '')
  }

  // because :active only works in WebKit?
  svg.classed('active', false)

  restart()
}

// only respond once per keydown
let lastKeyDown = -1

function keydown() {
  if( lastKeyDown !== -1 ) return
  lastKeyDown = d3.event.keyCode

  if( d3.event.shiftKey ) {
    switch( d3.event.key ) {
      case 'S':
        saveSVG()
        return
        break
      case 'F':
        VIEW.force.stop()
        return
        break
    }
  }

  // Ctrl
  if( d3.event.keyCode === 17 ) {
    VIEW.nodes.on('.drag', null)
    svg.classed('ctrl', true)
    return
  }

  if( !selectedNode && !selectedLink ) return
  
  if( selectedNode ) {
    switch( d3.event.key ) {
      case 'Backspace':
      case 'Delete':
        deleteNode(selectedNode)
        selectedNode = null
        break
      case 's':
        setNodeStatic(selectedNode)
        break
      case 'e':
        setNodeEdit(selectedNode)
        break
      default:
        return
    }
  }
  if( selectedLink ) {
    switch( d3.event.keyCode ) {
      case 'Backspace': // backspace
      case 'Delete': // delete
        deleteLink(selectedLink)
        selectedLink = null
        break
      default:
        return
    }
  }
}

function createNode(point) {
  console.log('create node')
  const node = {
    id: ++lastNodeId,
    name: lastNodeId,
    static: false,
    sx: point[0],
    sy: point[1],
    x: point[0],
    y: point[1],
  }
  DATA.nodes.push(node)

  restart()
}

function setNodeEdit(node, val = !node.edit) {
  node.edit = val
  restart()
}

function setNodeStatic(node, val = !node.static) {
  // Toggle if no value is set
  if( node.static = val ) {
    node.sx = node.x
    node.sy = node.y
  }
  restart()
}

function deleteNode(node) {
  DATA.nodes.splice(DATA.nodes.indexOf(node), 1)
  deleteLinksForNode(node)
}

function deleteLinksForNode(node) {
  const toSplice = DATA.links.filter((l) => l.source === node || l.target === node)
  for( const l of toSplice )
    DATA.links.splice(DATA.links.indexOf(l), 1)
  restart()
}

function deleteLink(link) {
  DATA.links.splice(DATA.links.indexOf(link), 1)
  restart()
}

/**
 * @dir: -1 left, 0 both, 1 right
 */
function setLinkDirection(link, dir) {
  link.left = dir <= 0
  link.right = dir >= 0
  restart()
}

function saveSVG() {
  console.debug('save document')
  download(cleanSVG(svg.node(), 2), 'netGraph.svg', 'image/svg+xml')
}

function keyup() {
  lastKeyDown = -1

  // ctrl
  if( d3.event.keyCode === 17 ) {
    VIEW.nodes.call(VIEW.drag)
    svg.classed('ctrl', false)
  }
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup)
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup)
restart()
