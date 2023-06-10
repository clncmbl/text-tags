'use strict'


function getColumnMarkerLineIndex(textlines) {
  // The column marker line is the first line containing
  // only hyphens and whitespace.
  let colmarkeridx = null
  for (let i=0; i<textlines.length; i++) {
    if (textlines[i].match(/^[-\s]*-[-\s]*$/)) {
      colmarkeridx = i
      break
    }
  }
  return colmarkeridx
}

function buildTextObjArrayFromLine(textline) {
  const matcharr = Array.from(textline.matchAll(/\S+(?:\s\S+)*/g))
  return matcharr.map( m => ({ str: m[0], idx: m.index }))
}

function buildTextObjArrayArray(textlines) {
  return textlines.map(buildTextObjArrayFromLine)
}


class TextTable extends HTMLElement {
  constructor() {
    super()

    const srctext = this.innerHTML
    console.log(srctext)
    const lines = srctext.split(/\r\n|\r|\n/g)
                        .map(ln => ln.trimEnd())
                        .filter(ln => !!ln) 
    console.log(lines)

    const colmrkridx = getColumnMarkerLineIndex(lines)
    console.log(colmrkridx)

    // arrarrobj is an array of arrays of string-index objects.
    const arrarrobj = buildTextObjArrayArray(lines)
    console.log(arrarrobj)
    

    const shadow = this.attachShadow({mode: 'open'})
    shadow.innerHTML = `<div>new text</div>`
    
  }
}


if (!customElements.get('txt-table')) {
  customElements.define('txt-table', TextTable)
}
