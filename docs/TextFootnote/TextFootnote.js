'use strict'


function parseFootnotes(srctext) {
  // We remove both leading and trailing space from line text.
  const textlines = srctext.split(/\r\n|\r|\n/g)
                           .map(ln => ln.trim())
                           .filter(ln => !!ln) 

  let sliceEndIndex = textlines.length
  let fndata = []

  for (let i = textlines.length - 1; i >= 0; --i) {
    // TODO: Consider parameterizing the character for
    // indicating a footnote (but default to '^').
    const start = textlines[i].startsWith('^')
    if (start) {
      const fullline = textlines.slice(i, sliceEndIndex)
                                .join(' ')
      const fnArr = fullline.match( /^(\S+)\s+(\S.*)$/ )

      const footnoteObj = { tag: fnArr[1], txt: fnArr[2] }
      fndata.push(footnoteObj)
      sliceEndIndex = i
    }

    console.log(sliceEndIndex)
  }

  fndata = fndata.reverse()
  fndata.forEach((o, i) => o.num = i+1)

  return fndata
}

class TextFootnote extends HTMLElement {
  constructor() {
    super()

    const srctext = this.innerHTML
    console.log(srctext)

    const fndata = parseFootnotes(srctext) 
    console.log(fndata)
  }

}

if (!customElements.get('txt-footnote')) {
  customElements.define('txt-footnote', TextFootnote)
}

