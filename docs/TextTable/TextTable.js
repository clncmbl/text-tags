'use strict'

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


function setRowSpans(cellinfo, colcount) {
  // Assumes that spanned cells, after the first, contain only a single "
  const spanCounts = new Array(colcount).fill(1)

  // Work from the bottom up.
  for (let i = cellinfo.length - 1; i >= 0; --i) {
    //console.log(i)
    const rowcells = cellinfo[i]

    rowcells.forEach((c, ci) => {
      if (c.str === '"') {
        ++spanCounts[c.startcol]
      } else {
        if (spanCounts[c.startcol] !== 1) {
          c.rowspan = spanCounts[c.startcol]
          spanCounts[c.startcol] = 1
        }
      }
    })
    console.log(spanCounts)
  }
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

  // TODO: Set rowspan.  Might need a special character to
  //       indicate row spanning in other than first column.
  setRowSpans(cellinfo, colcount)

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

    const colmrkrtxtidx = lines.findIndex(line => /^[-\s]*-[-\s]*$/.test(line))
    console.log(colmrkrtxtidx)

    // arrarrobj is an array of arrays of string-index objects.
    const arrarrobj = buildTextObjArrayArray(lines)
    console.log(arrarrobj)

    const cellinfo = buildCellInfoArrayArray(arrarrobj, colmrkrtxtidx)
    const colmrkrrowidx = cellinfo.findIndex(r => r.every(c => /-+/.test(c.str)))
    console.log(colmrkrrowidx)

    //console.log(JSON.stringify(cellinfo))
    console.log(cellinfo)

    const shadow = this.attachShadow({mode: 'open'})
    shadow.innerHTML = `<div>new text</div>`
  }
}

if (!customElements.get('txt-table')) {
  customElements.define('txt-table', TextTable)
}
