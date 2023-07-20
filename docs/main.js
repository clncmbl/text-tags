'use strict'

// Can't use either innerHTML or insertAdjacentHTML to add a
// script tag and expect it to execute.  Trying here to build
// the desired script tag (for an importmap).
// See https://github.com/WICG/import-maps#dynamic-import-map-example.

const url = new URL(location.href)
const cdn = url.searchParams.get('cdn')

let importUrl = '/text-tags/'
// Test use of CDN by adding a cdn=jsdelivr query parameter
// to the URL for the current document.
if (cdn === 'jsdelivr') {
  importUrl = 'https://cdn.jsdelivr.net/gh/clncmbl/text-tags@main/docs/'
}

const im = document.createElement('script')
im.type = 'importmap'
im.textContent = JSON.stringify({
  "imports": {
    "TextTable": importUrl + "TextTable/TextTable.js",
    "TextFootnote": importUrl + "TextFootnote/TextFootnote.js",
  }
})
document.currentScript.after(im)


// Instead of innerHTML trying document.currentScript together with
// insertAdjacentHTML.

// Using :not(:defined) to hide undefined custom elements.  This
// describes more options: 
// https://www.abeautifulsite.net/posts/flash-of-undefined-custom-elements/

document.currentScript.insertAdjacentHTML('afterend', `
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="main.css" blocking="render">
  <style>
    txt-table {
      display: block;
    }
    
    txt-table:not(:defined) {
      opacity: 0;
    }
  </style>
  `)
