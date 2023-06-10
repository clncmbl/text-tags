'use strict'

document.head.innerHTML += `
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="main.css" blocking="render">
  <style>
    txt-table {
      display: block;
    }
    
    txt-table:not(:defined) {
      opacity: 0;
    }
  <style>`
