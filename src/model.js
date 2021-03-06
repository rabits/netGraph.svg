/*!
 * netGraph model
 * Classes for the data
 * @version 0.0.1
 * @copyright Rabit <home@rabits.org>
 * @license MIT
 */
'use strict'

// Engine base class
class EngineBase {
  constructor(cfg) {
    this._ = {}
    if( cfg.string )
      Object.entries(this.unpackCfgString(cfg.string)).forEach(([k,v]) => { cfg[k] = v })
    this._.id = cfg.id || Math.floor(Math.random() * 8999999999) + 100000000
    this._.name = cfg.name
    this._.description = cfg.description

    this.color = cfg.color
    this.visible = true
  }

  get id() { return this._.id }
  get type() { return this.constructor.name }
  get name() { return this._.name || this.id }
  get description() { return this._.description }
  get cfg() { return this._ }

  get color() { return this._.color }
  set color(val) { this._.color = val || EngineBase.COLORS(this.id) }

  fromString(str) {
    const cls_name = str.substring(0, str.indexOf(':'))
    const data = str.substring(str.indexOf(':')+1)
    var cls = Node.NAMESPACE ? Node.NAMESPACE[cls_name] : window[cls_name]
    return new cls({string: data})
  }

  // Simple deserializer like "<value>" or by rules in the specific class
  unpackCfgString(str) {
    return {
      name: str,
      description: 'Autogenerated',
    }
  }

  toString() { this.type + ':' + this.id }

  toJSON() { JSON.stringify({data: this._}) }
}

// Static field to generate new colors
EngineBase.COLORS = d3.scaleOrdinal(d3.schemeCategory10)


// Basic class for nodes
class Node extends EngineBase {
  constructor(cfg) {
    super(cfg)
    this.owner = cfg.owner
    this.parent = cfg.parent
    this.pos = [cfg.x || Math.random()*1920, cfg.y || Math.random()*1080]
    this.fixed = cfg.fixed

    this.connectors = new Set() // Managed by connectors related to the node

    this._.childrens = []
    this.addChildrens(cfg.childrens)
    this._.showChildrens = false
    this.showChildrens = cfg.showChildrens || false
  }

  get owner() { return this._.owner }
  set owner(val) { this._.owner = val }

  get parent() { return this._.parent || this.owner }
  set parent(val) { this._.parent = val }

  get fixed() { return this._fixed }
  set fixed(val) {
    this._fixed = val || false
    if( val ) {
      this.fx = this.x
      this.fy = this.y
    } else
      this.fx = this.fy = null
  }

  get pos() { return [this.x, this.y] }
  set pos(list) { this.x = list[0]; this.y = list[1] }

  updateConnectors() { this.connectors.forEach(c => c.update(this)) }

  get childrens() { return this._.childrens }
  get showChildrens() { return this._.showChildrens }

  set showChildrens(show) {
    if( show === this.showChildrens || this.childrens.length < 1 ) return

    this._.showChildrens = show
    if( show ) {
      this._.childrens.forEach( c => { c.pos = this.pos } )
      DATA.nodes = DATA.nodes.concat(this._.childrens.filter( n => !DATA.nodes.includes(n) ))
      this._.childrens.forEach( c => createLink(RelationLink, this, c) )
      markConnectedNode(this)
    } else {
      this._.childrens.forEach( c => { c.showChildrens = false } )
      DATA.links = DATA.links.filter( l => ! (l instanceof RelationLink && l.source === this) )
      DATA.nodes = DATA.nodes.filter( n => !this._.childrens.includes(n) )
      this._.childrens.forEach( c => { c.updateConnectors() } )
    }
    this.updateConnectors()
  }

  addChildrens(childs, type = null) {
    if( ! childs ) return
    if( ! (childs instanceof Array) )
      childs = [childs]
    if( type )
      childs = childs.map(s => type+':'+s)
    for( let c of childs ) {
      if( typeof c === 'string' )
        c = this.fromString(c)
      if( ! (c instanceof Node) )
        throw new Error('Unable to add non-Node child ' + c)
      this._.childrens.push(c)
      c.owner = this
    }
    return this
  }
}

// Static function to find visible owner
Node.findVisibleOwner = function(node) {
  let out = node
  while( ! DATA.nodes.includes(out) )
    out = out.owner
  return out
}

class Group extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

// Rules for links
class Connector extends EngineBase {
  constructor(cfg) {
    super(cfg)
    this.targets = []
    this.sources = []
    this.links = []

    this._.sourceSelector = this._processSelector(cfg.sourceSelector)
    this._.targetSelector = this._processSelector(cfg.targetSelector)
    this._.targetResource = cfg.targetResource
    this._.owner = cfg.owner
    this.approved = cfg.approved
    this.active = cfg.active
    this.valid = cfg.valid

    this.update()
  }

  get sourceSelector() { return this._.sourceSelector }
  get targetSelector() { return this._.targetSelector }
  get targetResource() { return this._.targetResource }
  get owner() { return this._.owner }

  get approved() { return this._.approved }
  set approved(val) { this._.approved = val === undefined ? true : val }

  get active() { return this._.active }
  set active(val) { this._.active = val === undefined ? true : val }

  get valid() { return this._.valid }
  set valid(val) { this._.valid = val === undefined ? true : val }

  get visible() { return this._visible }
  set visible(val) {
    this._visible = val
    if( this.links )
      this.links.forEach( d => d.hidden = !val )
    updateLinks()
  }

  update(node) {
    this.cleanLinks(node)
    this.updateLinks()
  }

  cleanLinks(node) {
    const to_remove = node ? this.links.filter(l => l.source === node || l.target === node) : this.links

    for( const l of to_remove ) {
      DATA.links.splice(DATA.links.indexOf(l), 1)
      this.links.splice(this.links.indexOf(l), 1)
    }
  }

  updateLinks() {
    // Checking the nodes tree
    for( const n of DATA.nodes ) {
      // We should process only root nodes without owners
      if( ! n.owner ) {
        const res = this._checkNodeAndChildrens(n)
        this.sources = this.sources.concat(res.sources)
        this.targets = this.targets.concat(res.targets)
      }
    }

    // Creating links for the visible nodes
    let vis_srcs = new Set(this.sources.map(Node.findVisibleOwner))
    let vis_tgts = new Set(this.targets.map(Node.findVisibleOwner))

    vis_srcs.forEach( source => {
      source.connectors.add(this)
      vis_tgts.forEach( target => {
        target.connectors.add(this)
        if( source === target ) return
        let link = DATA.links.filter(l => [source, target].includes(l.source) && [source, target].includes(l.target))[0]
        if( !link ) {
          link = new SimpleLink({ source, target })
          link.hidden = !this.visible
          DATA.links.push(link)
          this.links.push(link)
        }
      })
    })
  }

  _processSelector(selector) {
    if( typeof selector === 'string')
      selector = [selector]
    if( selector instanceof Array ) {
      selector = selector.reduce( (r,s) => {
        const prop = s.substring(0, s.indexOf(':'))
        const value = s.substring(s.indexOf(':')+1)
        if( r.hasOwnProperty(prop) )
          r[prop].push(value)
        else
          r[prop] = [value]
        return r
      }, {} )
    } else if( !( selector instanceof Object ) )
      throw new Error('Not a proper selector ' + selector)

    return selector
  }

  /*
   * Validating selectors and the node tree to generate required links.
   *
   * Properties are collected and leafs will include all the special
   * parent properties. It will allow you to find some special node that
   * are existing in the same branch with some different object.
   *
   * Rules are simple - same property is OR, different properties is AND
   */
  _checkNodeAndChildrens(node, props = {}) {
    let ret = {
      sources: [node],
      targets: [node],
    }

    // Process node
    Object.assign(props, node.cfg)
    for( const prop in this.sourceSelector ) {
      if( ! this.sourceSelector[prop].includes(props[prop]) ) {
        ret.sources = []
        break
      }
    }
    for( const prop in this.targetSelector ) {
      if( ! this.targetSelector[prop].includes(props[prop]) ) {
        ret.targets = []
        break
      }
    }

    // Process childrens
    const ret_childs = node.childrens.map( n => this._checkNodeAndChildrens(n, props) )
    for( const c of ret_childs ) {
      ret.sources = ret.sources.concat(c.sources)
      ret.targets = ret.targets.concat(c.targets)
    }
    return ret
  }
}

// Basic class for links
class Link extends EngineBase {
  constructor(cfg) {
    super(cfg)
    this._.source = cfg.source
    this._.target = cfg.target
    this.color = cfg.color || 'gray'
    this.right = true // TODO
    this.markerStartId = 'start-arrow'
    this.markerEndId = 'end-arrow'
  }

  get source() { return this._.source }
  get target() { return this._.target }
}

class SimpleLink extends Link {
  constructor(cfg) {
    super(cfg)
    this._.connector = cfg.connector
  }

  get connector() { return this._.connector }
}

class RelationLink extends SimpleLink {
  constructor(cfg) {
    super(cfg)
    this.color = cfg.color || this.source.color
    this.markerStartId = 'start-relation'
    this.markerEndId = 'end-relation'
  }
}

class GroupLink extends Link {
  constructor(cfg) {
    super(cfg)
    this._.connectors = cfg.connectors || []
    this.markerStartId = 'start-group'
    this.markerEndId = 'end-group'
  }

  get connectors() { return this._.connectors }
  addConnectors(conns) {
    if( ! (conns instanceof Array) )
      conns = [conns]
    for( let c of conns ) {
      if( ! (c instanceof Connector) )
        throw new Error('Unable to add non-Connector' + c)
      this._.connectors.push(c)
    }
    return this
  }
}

// Network namespace for netGraph classes
let Network = {}
Node.NAMESPACE = Network

Network.Owner = class Owner extends Node {
  constructor(cfg) {
    super(cfg)
    this._.email = cfg.email
  }

  get email() { return this._.email }
}

Network.Project = class Project extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

Network.Net = class Net extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

Network.Subnet = class Subnet extends Node {
  constructor(cfg) {
    super(cfg)
    this._.cidr = cfg.cidr || '0.0.0.0/0'
  }

  get cidr() { return this._.cidr }

  unpackCfgString(str) {
    return {
      name: str,
      cidr: str,
      description: 'Autogenerated',
    }
  }
}

Network.Address = class Address extends Node {
  constructor(cfg) {
    super(cfg)
    this._.address = cfg.address || '0.0.0.0'
  }

  get address() { return this._.address }

  unpackCfgString(str) {
    return {
      name: str,
      address: str,
      description: 'Autogenerated',
    }
  }
}

Network.Environment = class Environment extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

Network.Service = class Service extends Node {
  constructor(cfg) {
    super(cfg)
    this._.url = cfg.url
    if( cfg.tags )
      this.addChildrens(cfg.tags, 'Tag')
  }

  get url() { return this._.url }
}

Network.Tag = class Tag extends Node {
  constructor(cfg) {
    super(cfg)
    this._.tag = cfg.tag
  }

  get tag() { return this._.tag }

  unpackCfgString(str) {
    return {
      name: str,
      tag: str,
      description: 'Autogenerated',
    }
  }
}
