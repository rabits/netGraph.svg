var fs = require('fs')
var convert = require('xml-js')
var CleanCSS = require('clean-css')
var Terser = require('terser')

var xml = fs.readFileSync('main.svg', 'utf8')
var js = convert.xml2js(xml, {compact: true})

// Getting css styles from xml-stylesheet
if( js._instruction['xml-stylesheet'] ) {
  var css = js._instruction['xml-stylesheet']
  var css_path = css.trim().slice(css.indexOf('href=')+6, -1)
  js.svg.style = {
    _attributes: { type: 'text/css' },
    _cdata: new CleanCSS().minify(fs.readFileSync(css_path)).styles
  }
}

// Combining local scripts
var bundle = []
for( var i in js.svg.script ) {
  var js_path = js.svg.script[i]._attributes['xlink:href']
  if( !( js_path && js_path.startsWith('src/') ) )
    continue

  bundle.push(fs.readFileSync(js_path))
  delete js.svg.script[i] // will be null in the array
}

// Removing script tags with local scripts
js.svg.script = js.svg.script.filter(x => x)

// Time to create output directory
try { fs.mkdirSync('out') } catch(e){}

if( bundle ) {
  // Writing bundle for future linting
  fs.writeFileSync('out/bundle.js', bundle.join('\n'))
  var miniscript = Terser.minify(bundle.join('\n'), {
    warnings: true,
    sourceMap: {
      filename: 'bundle.js',
      url: 'bundle.js.map',
    },
  })
  for( const w of miniscript.warnings )
    console.warn('WARNING: Terser: ' + w)
  if( miniscript.error )
    throw new Error('Terser: ' + miniscript.error.toString());
  js.svg.script.push({
    _attributes: {
      type: 'text/javascript',
    },
    _cdata: miniscript.code,
  })
  fs.writeFileSync('out/bundle.min.js', miniscript.code)
  fs.writeFileSync('out/bundle.js.map', miniscript.map)
  // TODO: write netGraph-debug.svg and use ext min script with mapping
}

// Writing output
fs.writeFileSync('out/netGraph.svg', convert.js2xml(js, {
  compact: true,
  spaces: 2
}))
