/*!
 * netGraph model
 * Classes for the data
 * @version 0.0.1
 * @copyright Rabit <home@rabits.org>
 * @license MIT
 */
'use strict'

// Basic class for nodes
let Node = class {
  constructor(cfg) {
    if( typeof cfg === 'string' )
      cfg = this.unpackCfgString(cfg)
    this._id = cfg.id || Math.floor(Math.random() * 9999999999) + 1000
    this._owner = cfg.owner
    this._parent = cfg.parent
    this._name = cfg.name
    this._description = cfg.description

    this._childrens = []
    this.addChildrens(cfg.childrens)
  }

  get id() { return this._id }
  get type() { return this.constructor.name }
  get owner() { return this._owner }
  get parent() { return this._parent || this.owner() }
  get name() { return this._name }
  get description() { return this._description }

  // Simple deserializer like "<value>" or by rules in the specific class
  fromString(str) {
    const cls_name = str.substring(0, str.indexOf(':'))
    const data = str.substring(str.indexOf(':')+1)
    var cls = Node.NAMESPACE ? Node.NAMESPACE[cls_name] : window[cls_name]
    return new cls(data)
  }

  unpackCfgString(str) {
    return {
      name: str,
      description: 'Autogenerated',
    }
  }

  addChildrens(childs, type = null) {
    if( ! childs ) return
    if( ! (childs instanceof Array) )
      childs = [childs]
    if( type )
      childs = childs.map(s => 'Tag:'+s)
    for( let c of childs ) {
      if( typeof c === 'string' )
        c = this.fromString(c)
      if( c instanceof Node )
        this._childrens.push(c)
      else
        throw new Error('Unable to add child ' + c)
    }
  }
}

let Group = class Group extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

// Network namespace for netGraph classes
let Network = { Node: Node, Group: Group }
Node.NAMESPACE = Network

Network.Owner = class Owner extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

Network.Project = class Project extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

Network.Network = class Network extends Node {
  constructor(cfg) {
    super(cfg)
  }
}

Network.Subnet = class Subnet extends Node {
  constructor(cfg) {
    super(cfg)
    this._cidrRange = cfg.cidrRange || '0.0.0.0/0'
  }

  get cidrRange() { return this._cidrRange }

  unpackCfgString(str) {
    return {
      name: str,
      cidrRange: str,
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
    this._url = cfg.url
    if( cfg.tags )
      this.addChildrens(cfg.tags, 'Tag')
  }

  get url() { return this._url }
}

Network.Tag = class Tag extends Node {
  constructor(cfg) {
    super(cfg)
  }
}
