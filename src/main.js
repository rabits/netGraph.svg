/*!
 * netGraph
 * A tool to create your net schema in a simple svg package
 * @version 0.0.1
 * @copyright Rabit <home@rabits.org>
 * @license MIT
 */
'use strict'

// set up SVG for D3
const SVG = d3.select('svg')
const container = SVG.select('#container')
const bounds = container.select('#bounds')
const connectors_list = SVG.select('#connectors').append('xhtml:div')

let drag_enabled = true

const menu = new Menu({
  svg: SVG,
  data: {
    null:[ // Global menu
      { title: 'Add new node to the workspace (Ctrl+MouseLeft)', icon: 'add', color: '#0a0', action: function(e) {
        createNode([e.pageX, e.pageY])
        restart()
      }},
      { title: 'Save SVG document (Shift+S)', icon: 'save', color: '#a0a', action: function() {
        saveSVG()
      }},
      { title: 'Disable force (Shift+F)', icon: 'force', color: '#aaa', action: function() {
        VIEW.force.stop()
      }},
    ],
    node:[ // Node menu
      { title: 'Show/Hide childrens (C)', icon: 'childrens', color: '#a00', action: function() {
        selectedNode.showChildrens = !selectedNode.showChildrens
        restart()
      }},
      { title: 'Remove node from the workspace (Del)', icon: 'remove', color: '#a00', action: function() {
        deleteNode(selectedNode)
        selectedNode = null
      }},
      { title: 'Disconnect all links (Shift+Del)', icon: 'unlink', color: '#a0a', action: function() {
        deleteLinksForNode(selectedNode)
      }},
      // TODO
      /*{ title: 'Create link (Ctrl+MouseLeft)', icon: 'link', color: '#aa0', action: function(e) {
        menu.hide()
        items.addClass('blink')
        SVG.on('mousedown', function(e) {
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
          SVG.off('mousedown')
          items.removeClass('blink')
        })
      }},*/
      { title: 'Toggle fixed (F)', icon: 'fixed', color: '#0aa', action: function() {
        setNodeFixed(selectedNode)
      }},
      { title: 'Edit (E)', icon: 'edit', color: '#0aa', action: function() {
        setNodeEdit(selectedNode)
      }},
    ],
    link:[ // Link menu
      { title: 'Destroy link (Del)', icon: 'unlink', color: '#a00', action: function() {
        deleteLink(selectedLink)
        selectedLink = null
      }},
    ],
  }
})

document.addEventListener('contextmenu', function(e) {
  e.preventDefault()
  menu.show(e)
})
document.addEventListener('mousedown', function() {
  menu.hide()
})

// TODO: bring selected object to front
/*d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};*/

// Set document size to window size at the first time
if( ! SVG.attr('width') || !SVG.attr('height') ) {
  updateDocumentRect({top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth})
}

function updateDocumentRect(rect) {
  var width = rect.right + window.scrollX
  var height = rect.bottom + window.scrollY
  if( SVG.attr('width') < width ) {
    SVG.attr('width', SVG.width = width)
    bounds.attr('width', SVG.width)
  }
  if( SVG.attr('height') < height ) {
    SVG.attr('height', SVG.height = height)
    bounds.attr('height', SVG.height)
  }
}

// Look for document changes to adjust document size
new MutationObserver(function(mutationsList) {
  for( var mutation of mutationsList ) {
    for( var node of mutation.addedNodes ) {
      if( node.getBoundingClientRect )
        updateDocumentRect(node.getBoundingClientRect())
    }
  }
}).observe(container.node(), { attributes: false, childList: true, subtree: true })

var DATA = {
  nodes: [],
  connectors: [],
  links: [],
}

const VIEW = {
  nodes: container.select('#nodes').selectAll('g'),
  links: container.select('#links').selectAll('path'),
  connectors: connectors_list.selectAll('div'),
  // Force field
  force: d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(50).strength(d => d.type === 'RelationLink' ? 0.1 : 0.0))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('x', d3.forceX(SVG.width / 2).strength(0.01))
    .force('y', d3.forceY(SVG.height / 2).strength(0.01))
    .on('tick', tick),
  // Dragging mechanism
  drag: d3.drag()
    .on('start', d => {
      if( !d3.event.active ) VIEW.force.alphaTarget(0.3).restart()

      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', d => {
      d.fx = d3.event.x
      d.fy = d3.event.y
    })
    .on('end', d => {
      if( !d3.event.active ) VIEW.force.alphaTarget(0)

      if( ! d.fixed ) {
        d.fx = null
        d.fy = null
      }
    }),
  // line displayed when dragging new nodes
  dragLine: SVG.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0')
}

// mouse event vars
let selectedNode = null
let selectedLink = null
let mousedownNode = null
let mouseupNode = null

function resetMouseVars() {
  mousedownNode = null
  mouseupNode = null
}

// update force layout (called automatically each iteration)
function tick() {
  VIEW.nodes.attr('transform', d => `translate(${Math.round(d.x)},${Math.round(d.y)})`)

  // draw directed edges with proper padding from node centers
  VIEW.links.attr('d', d => {
    const deltaX = d.target.x - d.source.x
    const deltaY = d.target.y - d.source.y
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const normX = deltaX / dist
    const normY = deltaY / dist
    const sourcePadding = d.left ? 17 : 12
    const targetPadding = d.right ? 17 : 12
    const sourceX = Math.round(d.source.x + (sourcePadding * normX))
    const sourceY = Math.round(d.source.y + (sourcePadding * normY))
    const targetX = Math.round(d.target.x - (targetPadding * normX))
    const targetY = Math.round(d.target.y - (targetPadding * normY))

    return `M${sourceX},${sourceY}L${targetX},${targetY}`
  })
}

// Update connectors list
function updateConnectorsList() {
  VIEW.connectors = VIEW.connectors.data(DATA.connectors, d => d.id)

  // Update existing connectors
  VIEW.connectors
    .classed('valid', d => d.valid)
    .classed('active', d => d.active)
    .classed('approved', d => d.approved)
    .classed('marked', d => d.marked)
    .classed('visible', d => d.visible)
  VIEW.connectors.selectAll('.decription')
    .text(d => d.description)

  // Remove old connectors
  VIEW.connectors.exit().remove()

  // Add new connectors
  const c = VIEW.connectors.enter().append('xhtml:div')
    .attr('menuType', 'connector')
    .classed('connector', true)
    .classed('valid', d => d.valid)
    .classed('active', d => d.active)
    .classed('approved', d => d.approved)
    .classed('marked', d => d.marked)
    .classed('visible', d => d.visible)
    .style('background-color', d => d.color)

  c.append('xhtml:div')
    .classed('active', true)
    .attr('title', 'Active switch')
    .on('mousedown', d => {
      d.active = !d.active
      updateConnectorsList()
    })
  c.append('xhtml:div')
    .classed('approved', true)
    .attr('title', 'Approved switch')
    .on('mousedown', d => {
      d.approved = !d.approved
      updateConnectorsList()
    })
  c.append('xhtml:div')
    .classed('valid', true)
    .attr('title', 'Valid switch')
    .on('mousedown', d => {
      d.valid = !d.valid
      updateConnectorsList()
    })
  c.append('xhtml:div')
    .classed('visible', true)
    .attr('title', 'Visible switch')
    .on('mousedown', d => {
      d.visible = !d.visible
      updateConnectorsList()
    })
  c.append('xhtml:div')
    .classed('usages', true)
    .attr('title', 'Number of usages')
    .text(d => d.targets.length + d.sources.length)
  c.append('xhtml:span')
    .classed('description', true)
    .attr('title', d => d.description)
    .text(d => d.description)

  VIEW.connectors = c.merge(VIEW.connectors)
}

// Update graph (called when needed)
function restart() {
  container.classed('shadow', () => selectedNode || selectedLink)

  updateNodes()
  updateLinks()

  // set the graph in motion
  VIEW.force.nodes(DATA.nodes)
    .force('link').links(DATA.links)

  VIEW.force.alphaTarget(0.3).restart()
}

function updateNodes() {
  VIEW.nodes = VIEW.nodes.data(DATA.nodes, d => d.id)

  // update existing nodes (fixed & selected visual states)
  VIEW.nodes
    .classed('fixed', d => d.fixed)
    .classed('selected', d => d === selectedNode)
    .classed('marked', d => d.marked)
  VIEW.nodes.selectAll('.bg')
    .style('fill', d => (d === selectedNode) ? d3.rgb(d.color).brighter().toString() : d.color)
  VIEW.nodes.selectAll('.name')
    .text(d => d.name)

  // remove old nodes
  VIEW.nodes.exit().remove()

  // add new nodes
  const g = VIEW.nodes.enter().append('svg:g')
    .attr('menuType', 'node')
    .classed('node', true)
    .classed('selected', d => d === selectedNode)
    .classed('marked', d => d.marked)
    .classed('fixed', d => d.fixed)
    .on('contextmenu', function() {
      d3.event.preventDefault()
      d3.event.stopPropagation()
      menu.show(d3.event, d3.select(this))
    })

  g.append('svg:circle')
    .attr('class', 'bg')
    .attr('r', 12)
    .style('fill', d => (d === selectedNode) ? d3.rgb(d.color).brighter().toString() : d.color)
    .style('stroke', d => d3.rgb(d.color).darker().toString())
    .on('mousedown', d => {
      menu.hide()

      mousedownNode = d
      // TODO: d3.select(this).moveToFront()
      selectedLink = null

      if( d3.event.button > 0 )
        d3.event.stopPropagation()
      if( d3.event.ctrlKey || d3.event.buttons === 4 /* middle mouse */ ) {
        d3.event.stopPropagation()
        // reposition drag line
        VIEW.dragLine
          .style('marker-end', 'url(#end-arrow)')
          .classed('hidden', false)
          .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`)
      } else {
        // select node
        selectedNode = mousedownNode
        markConnectedNode(selectedNode)
      }

      restart()
    })
    .on('mouseup', d => {
      if( !mousedownNode ) return

      // needed by FF
      VIEW.dragLine
        .classed('hidden', true)
        .style('marker-end', '')

      // check for drag-to-self
      mouseupNode = d
      if( mouseupNode === mousedownNode )
        return resetMouseVars()

      selectedLink = createLink(SimpleLink, mousedownNode, mouseupNode)
      selectedNode = null
      markConnectedLink(selectedLink)

      restart()
    })
    .on('dblclick', d => {
      d.showChildrens = !d.showChildrens
      restart()
    })

  // show node IDs
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', -20)
    .attr('class', 'name')
    .text(d => d.name)

  if( drag_enabled )
    g.call(VIEW.drag)

  VIEW.nodes = g.merge(VIEW.nodes)
}

function updateLinks() {
  VIEW.links = VIEW.links.data(DATA.links)

  // update existing links
  VIEW.links
    .classed('selected', d => d === selectedLink)
    .classed('marked', d => d.marked)
    .classed('hidden', d => d.hidden)
    .style('marker-start', d => d.left ? `url(#${d.markerStartId})` : '')
    .style('marker-end', d => d.right ? `url(#${d.markerEndId})` : '')

  // remove old links
  VIEW.links.exit().remove()

  // add new links
  VIEW.links = VIEW.links.enter().append('svg:path')
    .attr('menuType', 'link')
    .attr('stroke', d => d.color)
    .attr('class', 'link')
    .classed('selected', d => d === selectedLink)
    .classed('marked', d => d.marked)
    .classed('hidden', d => d.hidden)
    .style('marker-start', d => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', d => d.right ? 'url(#end-arrow)' : '')
    .on('contextmenu', function() {
      d3.event.preventDefault()
      d3.event.stopPropagation()
      menu.show(d3.event, d3.select(this))
    })
    .on('mousedown', d => {
      menu.hide()
      d3.event.stopPropagation()
      if( d3.event.ctrlKey ) return

      // select link
      selectedLink = d
      selectedNode = null
      markConnectedLink(selectedLink)
      restart()
    })
    .merge(VIEW.links)
}

function mousedown() {
  // because :active only works in WebKit?
  SVG.classed('active', true)

  selectedNode = selectedLink = mousedownNode = null
  markConnectedClean()

  if( d3.event.buttons === 1 && d3.event.ctrlKey )
    createNode(d3.mouse(this))
  restart()
}

function mousemove() {
  if( !mousedownNode ) return

  // update drag line
  if( d3.event.ctrlKey || d3.event.buttons === 4 /* middle mouse */ )
    VIEW.dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`)
}

function mouseup() {
  // because :active only works in WebKit?
  SVG.classed('active', false)

  if( mousedownNode ) {
    // hide drag line
    VIEW.dragLine
      .classed('hidden', true)
      .style('marker-end', '')

    restart()
  }
}

function mousewheel() {
  d3.event.preventDefault()
  if( !container.scale )
    container.scale = 1.0
  let delta = 0
  if( d3.event.deltaY > 0 )
    delta = 0.5
  else
    delta = 2
  container.scale = Math.max(0.125, Math.min(4.0, container.scale *= delta))
  container.attr('transform', `translate(${SVG.width*0.5*(1.0-container.scale)},${SVG.height*0.5*(1.0-container.scale)})scale(${container.scale})`)
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
      case 'F':
        VIEW.force.stop()
        return
    }
  }

  // Ctrl
  if( d3.event.keyCode === 17 ) {
    drag_enabled = false
    VIEW.nodes.on('.drag', null)
    SVG.classed('ctrl', true)
    return
  }

  if( !selectedNode && !selectedLink ) return

  if( selectedNode ) {
    switch( d3.event.key ) {
      case 'Backspace':
      case 'Delete':
        if( d3.event.shiftKey ) {
          deleteLinksForNode(selectedNode)
        } else {
          deleteNode(selectedNode)
          selectedNode = null
        }
        break
      case 'f':
        setNodeFixed(selectedNode)
        break
      case 'e':
        setNodeEdit(selectedNode)
        break
      default:
        return
    }
  }
  if( selectedLink ) {
    switch( d3.event.key ) {
      case 'Backspace': // backspace
      case 'Delete': // delete
        deleteLink(selectedLink)
        selectedLink = null
        break
      case 'l':
        setLinkDirection(selectedLink)
        break
      default:
        return
    }
  }
}

function createNode(point) {
  DATA.nodes.push(new Node({
    x: point[0],
    y: point[1],
  }))
}

/**
 * Create link and add to graph (if not exists)
 * Types:
 *   - SimpleLink - just a link between two nodes
 *   - RelativeLink - parent-child relations
 *   - GroupLink - link contains multiple links
 */
function createLink(Type, source, target) {
  let link = DATA.links.filter(l => l.source === source && l.target === target)[0]
  if( !link ) {
    link = new Type({ source, target })
    DATA.links.push(link)
  }
  return link
}

function setNodeEdit(node, val = !node.edit) {
  node.edit = val
  restart()
}

function setNodeFixed(node, val = !node.fixed) {
  // Toggle if no value is set
  node.fixed = val
  restart()
}

function deleteNode(node) {
  DATA.nodes.splice(DATA.nodes.indexOf(node), 1)
  deleteLinksForNode(node)
}

let MARKED = []

function markConnectedClean() {
  // Demark previous links & nodes
  for( const i of MARKED )
    i.marked = false
  MARKED = []
}

function markConnectedNode(node) {
  markConnectedClean()
  // Mark new items
  MARKED.push(node)
  const links = DATA.links.filter(l => l.source === node || l.target === node)
  for( const l of links )
    MARKED = MARKED.concat([l, l.source, l.target].filter(v => MARKED.indexOf(v) < 0))
  markItems(MARKED)
  restart()
}

function markConnectedLink(link) {
  markConnectedClean()
  markItems([link, link.source, link.target])
  restart()
}

function markItems(items) {
  for( const i of items )
    i.marked = true
}

function deleteLinksForNode(node) {
  let to_remove = DATA.links.filter(l => l.source === node || l.target === node)
  for( const l of to_remove )
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
function setLinkDirection(link, dir = null) {
  // Toggle if no direction is set
  if( dir === null )
    dir = link.left ? (link.right ? 1 : 0 ) : -1
  link.left = dir <= 0
  link.right = dir >= 0
  restart()
}

function saveSVG() {
  download(cleanSVG(SVG.node(), 2), 'netGraph.svg', 'image/svg+xml')
}

function keyup() {
  lastKeyDown = -1

  // ctrl
  if( d3.event.keyCode === 17 ) {
    drag_enabled = true
    VIEW.nodes.call(VIEW.drag)
    SVG.classed('ctrl', false)
  }
}

SVG.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup)
  .on('wheel', mousewheel)
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup)

// Load data from local file
SVG.append('svg:script')
  .attr('type', 'text/javascript')
  .on('load', () => { restart(); updateConnectorsList() })
  .attr('xlink:href', 'data.js')

// App starts here
restart()
