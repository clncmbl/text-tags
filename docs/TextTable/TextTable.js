'use strict'


function getColumnMarkerLineIndex(textlines) {
  // The column marker line is the zero-based index of the first
  // line in the textlines array containing only hyphens and
  // whitespace.
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

  // matcharr is an array of match results.  Each match result is
  // an array with additional properties.  The first item in each
  // match result array is the matched text, and the "index"
  // property is the zero-based index of the match in the string.

  return matcharr.map( m => ({ str: m[0], idx: m.index }))
}

function buildTextObjArrayArray(textlines) {
  return textlines.map(buildTextObjArrayFromLine)
}

function removeNullRowsAndCells(cellinfo) {
  // First filter removes null rows;
  // filter in map removes null cells.
  return cellinfo.filter(r => r !== null)
                 .map(r => r.filter(o => o !== null))
}

function setColSpans(cellinfo, colcount) {
  cellinfo.forEach(r => r.forEach((o, idx, r) => {
    o.colspan = (r[idx + 1]?.startcol ?? colcount) - o.startcol
  }))
}

function buildCellInfoArrayArray(arrarrobj, colmrkridx) {
  let cellinfo = new Array(arrarrobj.length).fill(null)

  // colstarts is an array containing the starting text column
  // of each column marker.
  const colstarts = arrarrobj[colmrkridx].map(o => o.idx)
  const colcount = colstarts.length

  // fillrow is the row of text that we are working on filling
  // (using, potentially, multiple lines of text).
  let fillrow = 0

  arrarrobj.forEach((a, r) => {
    // "r" is the outer array index, which makes it the
    // text row index (zero-based).
    cellinfo[r] = new Array(colcount).fill(null)

    if (r === 0) {
      // On first row, so we know that we are not backfilling, yet.

      a.forEach((o, i) => {
        o.startcol = colstarts.findLastIndex(c => c <= o.idx)
        cellinfo[r][o.startcol] = o
      })
    } else {
      // Not first row, so we initially assume that this row
      // is backfilling (adding missing column cells for) a
      // previous row.
      let backfilling = true

      a.forEach((o, i) => {
        o.startcol = colstarts.findLastIndex(c => c <= o.idx)
        cellinfo[r][o.startcol] = o
        // If any startcol for this iteration matches a column
        // that has already been filled in the fillrow, then the
        // current row cannot be used to backfill the fillrow.
        if (cellinfo[fillrow][o.startcol] !== null) {
          backfilling = false
          fillrow = r
        }
      })

      if (backfilling) {
        cellinfo[r].forEach((o, i) => {
          if (o !== null) {
            cellinfo[fillrow][i] = o
          }
        })
        cellinfo[r] = null
      } 
    }
  })

  cellinfo = removeNullRowsAndCells(cellinfo)

  setColSpans(cellinfo, colcount)
  // TODO: Set colspan.
  // TODO: Set rowspan.  Might need a special character to
  //       indicate row spanning in other than first column.
  return cellinfo
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

    const cellinfo = buildCellInfoArrayArray(arrarrobj, colmrkridx)

    //console.log(JSON.stringify(cellinfo))
    console.log(cellinfo)

    const shadow = this.attachShadow({mode: 'open'})
    shadow.innerHTML = `<div>new text</div>`
    
  }
}


if (!customElements.get('txt-table')) {
  customElements.define('txt-table', TextTable)
}
