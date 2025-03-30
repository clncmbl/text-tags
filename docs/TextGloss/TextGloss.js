'use strict'

function groupLines(lines) {
  // This should take 
  // ["a", "b", "", "", "c", "", "d", "e", "f", "", "", "", "g"]
  // and return
  // [["a", "b"], ["c"], ["d", "e"], ["f"], ["g"]]
  
  let groups = []
  let i = 0

  while (i < lines.length) {
    while (i < lines.length && lines[i] === '') {
      i++
    }
    if (i >= lines.length) {
      break;
    }
    let group = [lines[i]]
    if (i+1 < lines.length && lines[i+1] !== '') {
      group.push(lines[i+1])
      i+=2
    } else {
      i++
    }
    groups.push(group)
  }
  return groups
}

function buildWordLineGroup(group) {
  const wordRegex = /\S+/gdu;

  return group.map(line => {
    let matches = [...line.matchAll(wordRegex)]
    return matches.map(match => {
      return {
        word: match[0],
        start: match.indices[0][0],
        end: match.indices[0][1]
      }
    })
  })
}
  
function chunkGroup(group) {

  // We first have to break things up into words.
  const wordlinegroup = buildWordLineGroup(group)
  console.log(wordlinegroup)

  const tline = wordlinegroup[0]; // These are the text line words.
  const gline = wordlinegroup[1]; // These are the gloss line words.
  let alignedChunks = []
  let lastTextWordIndex = -1
  let lastGlossWordIndex = -1
  //let hasMoreText = true
  
  for (let i = 0; i < tline.length; i++) {
    if (i <= lastTextWordIndex) continue;

  // We add the first (or next) word of the tline to a new text chunk.
    let textChunk = {
      text: tline[i].word,
      gloss: '',
      start: tline[i].start,
      end: tline[i].end
    }
    lastTextWordIndex = i
    alignedChunks.push(textChunk)
    //hasMoreText = (i + 1 < tline.length);
    
    let j = lastGlossWordIndex + 1;
    let k = lastTextWordIndex + 1;

    while (true) {
      const jHasGloss = j < gline.length;
      const kHasText = k < tline.length;

      if (!jHasGloss && !kHasText) {
        break;
      }

      // If no more text, then put the rest of the gloss
      // on the last text block.
      if (!kHasText) {
        textChunk.gloss += (textChunk.gloss ? ' ' : '')
          + gline[j].word;

        lastGlossWordIndex = j;
        j++;
        continue;
      }

      // If the next text word starts before or on
      // the character (likely, a space) immediately
      // following the gloss, add that text to the
      // textChunk.
      if (kHasText && j > 0
          && tline[k].start <= gline[j-1].end) {

        textChunk.text += (' ' + tline[k].word);
        lastTextWordIndex = k;
        k++;
        continue;
      }

      if (!jHasGloss) {
        break;
      }

      // Add words in the gloss that start before, or at,
      // the end of
      // the text range plus one (to include gloss words
      // that start in the space immediately after the end
      // of a text word) to textChunk.gloss.  Also, those
      // that end before the
      // start of the next text. 
      if (gline[j].start <= tline[k-1].end ||
          gline[j].end < tline[k].start) {
        textChunk.gloss += (textChunk.gloss ? ' ' : '')
          + gline[j].word;

        lastGlossWordIndex = j;
        j++;
        continue;
      } else {
        //   If the end of the last added gloss word aligns with
        //   the end of the last added text word and both have
        //   another word starting immediately after a single space,
        //   then add the gloss word to the gloss string.
        //   Also, if the next gloss word is only a specified special character
        //   (maybe '='), and it aligns with the next text word
        //   add the next text word to the text (but then
        //   don't keep the '=' or other character used for this
        //   purpose.
        if (j > 0 && k > 0
            && gline[j].start === tline[k].start
            && ((gline[j-1].end === tline[k-1].end
                 && gline[j].start - gline[j-1].end === 1)
                || gline[j].word === '=')) {

          if (gline[j].word !== '=') {
            textChunk.gloss += (textChunk.gloss ? ' ' : '')
              + gline[j].word;
          }

          // Advance the gloss word index, regardless.
          lastGlossWordIndex = j;
          j++;
          continue;
        }
        break;
      }
    }
  }
  return alignedChunks;
}

function glossForGroup(group) {
  if (group.length === 1) return group[0];

  const chunks = chunkGroup(group);
  console.log(chunks);

  const glossedlines = chunks.map(c => {
    if (c.gloss) {
      return `<ruby>${c.text}<rt>${c.gloss}</rt></ruby>`;
    } else {
      return c.text;
    }
  }).join(' ');
  return glossedlines;
}

class TextGloss extends HTMLElement {
  constructor() {
    super()
  }
  
  connectedCallback() {
    const linejoin = this.getAttribute('linejoin') || '<br>';

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      rt {
        font-size: 70%;
        border-top: 1px solid lightgrey;
      }
      ruby {
        ruby-align: center;
        ruby-position: under;
        margin: 0 0.1em;
        line-height: 2.8;
      }
      .corner {
        font-size: 0.7em;
        vertical-align: 0.5em;
      }
      .corner.ul {
        margin-right: -0.2em;
      }
      .corner.lr {
        margin-left: -0.2em;
      }
    `;
    shadow.appendChild(style);

    const wrapperdiv = document.createElement('div');
    shadow.appendChild(wrapperdiv);

    const srctext = this.innerHTML
    console.log(srctext)

    const lines = srctext.split(/\r\n|\r|\n/g)
                         .map(ln => ln.trimEnd())
    console.log(lines)

    const groups = groupLines(lines)
    console.log(groups)

    const glossedlines = groups.map(glossForGroup)

    console.log(glossedlines);
    let html = glossedlines.join(linejoin);
    html = html.replaceAll('\u231C', '<span class="corner ul">&ulcorner;</span>');
    html = html.replaceAll('\u231D', '<span class="corner lr">&urcorner;</span>');
    wrapperdiv.innerHTML = html;
  }
}

if (!customElements.get('txt-gloss')) {
  customElements.define('txt-gloss', TextGloss)
}
