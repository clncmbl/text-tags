'use strict'

class TextTable extends HTMLElement {
  constructor() {
    super()

    const srctext = this.innerHTML
    console.log(srctext)

    const shadow = this.attachShadow({mode: 'open'})
    shadow.innerHTML = 'new text'
    
  }
}

if (!customElements.get('txt-table')) {
  customElements.define('txt-table', TextTable)
}