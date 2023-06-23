'use strict'

// Intead of innerHTML trying document.currentScript together with
// insertAdjacentHTML.

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
