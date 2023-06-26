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
  // Assumes that spanned cells, after the first, contain only a
  // single ".  The first column can use the explicit " to
  // indicate row spanning, or can simply be left blank.

  const spanCounts = new Array(colcount).fill(1)

  // Work from the bottom up.
  for (let i = cellinfo.length - 1; i >= 0; --i) {
    const rowcells = cellinfo[i]

    rowcells.forEach((c, ci) => {
      // If we have nothing for the first column then increase the
      // rowspan counter for that column.
      if (ci === 0 && c.startcol !== 0) {
        ++spanCounts[0]
      }

      if (c.str === '"') {
        ++spanCounts[c.startcol]
      } else {
        if (spanCounts[c.startcol] !== 1) {
          c.rowspan = spanCounts[c.startcol]
          spanCounts[c.startcol] = 1
        }
      }
    })
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

function buildStyle() {
  const style = document.createElement('style')
  style.innerHTML = `
    thead {
      background-color: lightgrey;
    }
    td {
      height: 60px;
      border: 1px solid black;
    }
  
  `

  return style
}

function buildTable(cellinfo, colmrkrrowidx) {
  const tbl = document.createElement('table')
  tbl.setAttribute('part', 'table')
  
  let thead = null
  if (colmrkrrowidx > 0) {
    thead = document.createElement('thead')
    thead.setAttribute('part', 'thead')
    tbl.appendChild(thead)
  }
  const tbody = document.createElement('tbody')
  tbody.setAttribute('part', 'tbody')
  tbl.appendChild(tbody)

  
  cellinfo.forEach((r, i) => {
    if (i === colmrkrrowidx) {
      return
    }

    const tr = document.createElement('tr')
    let celltagname = 'td'
  
    if (i < colmrkrrowidx) {
      thead.append(tr)
      celltagname = 'th'
    } else {
      tbody.append(tr)
    }

    r.forEach(c => {
      if (c.str === '"') {
        return
      }
      const cellelem = document.createElement(celltagname)
      cellelem.setAttribute('part', celltagname)
      if (c?.colspan > 1) {
        cellelem.setAttribute('colspan', c.colspan)
      }
      if (c?.rowspan > 1) {
        cellelem.setAttribute('rowspan', c.rowspan)
      }

      cellelem.append(c.str)
      tr.append(cellelem)
    })
  })

  return tbl
}

class TextTable extends HTMLElement {
  constructor() {
    super()

    const srctext = this.innerHTML
    const lines = srctext.split(/\r\n|\r|\n/g)
                        .map(ln => ln.trimEnd())
                        .filter(ln => !!ln) 
  
    // This is the line index for the column markers.  Just dashes
    // and spaces.
    const colmrkrtxtidx = lines.findIndex(line => /^[-\s]*-[-\s]*$/.test(line))
  
    // arrarrobj is an array of arrays of string-index objects.
    const arrarrobj = buildTextObjArrayArray(lines)
  
    const cellinfo = buildCellInfoArrayArray(arrarrobj, colmrkrtxtidx)

    // The column marker row index could be different from the
    // column marker text line index because multiple text lines
    // could be associated with a single row.
    const colmrkrrowidx = cellinfo.findIndex(r => r.every(c => /-+/.test(c.str)))
  
    //console.log(cellinfo)

    const style = buildStyle()
    const tbl = buildTable(cellinfo, colmrkrrowidx)

    const shadow = this.attachShadow({mode: 'open'})

    shadow.appendChild(style)
    shadow.appendChild(tbl)
  }
}

if (!customElements.get('txt-table')) {
  customElements.define('txt-table', TextTable)
}


