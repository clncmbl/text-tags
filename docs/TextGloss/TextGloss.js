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
      // textChunk.  (In this case, we are adding
      // text to a textChunk that has some gloss
      // already.)
      if (kHasText && j > 0
          && tline[k].start <= gline[j-1].end) {

        textChunk.text += (' ' + tline[k].word);
        lastTextWordIndex = k;
        k++;
        continue;
      }

      // If textChunk has no gloss and we have new text and
      // either we no more gloss
      // or the we have gloss but it comes after the end of the
      // next text word, then add the next text word to the
      // text chunk.
      if (!textChunk.gloss && kHasText && (!jHasGloss
          || gline[j].start > tline[k].end)) {

        textChunk.text += (' ' + tline[k].word);
        lastTextWordIndex = k;
        k++;
        continue;
      }

      // If the textChunk has gloss, but there is no more
      // gloss, time to break.  (Then, we either start the
      // last textChunk with no gloss or we are done making
      // chunks.)
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
  // If we have no gloss then span as for one chunk.
  if (group.length === 1) {
    if (group[0].includes('|')) {
      return group[0].replace(/(.*)\|(.*)$/,
                             '<span>$1</span>|$2');
    } else {
      return `<span>${group[0]}</span>`;
    }
  }

  const chunks = chunkGroup(group);
  console.log(chunks);

  const glossedline = chunks.map((c, idx, arr) => {
    if (c.gloss) {
      return `<ruby>${c.text}<rt>${c.gloss}</rt></ruby>`;
    } else if (idx === arr.length - 1 && c.text.includes('|')) {
        return c.text.replace(/(.*)\|(.*)$/,
                              (m, befBar, aftBar) => {
            return befBar ? `<span>${befBar}</span>|${aftBar}`
                      : `|${aftBar}`;
          });
    } else {
      return `<span>${c.text}</span>`;
    }
  }).join(' ');
  return glossedline;
}



class TextGloss extends HTMLElement {
  constructor() {
    super();
  }

  getCSS() {
    const displayval = this.getAttribute('display') || 'block';

    const css = `
      .glosswrap {
        display: grid;
        grid-template-columns: auto auto;
      }
      .gloss {
        display: grid;
        grid-template-columns: 5ch max-content;
        column-gap: 0.5em;
        row-gap: 0.4em;
        margin-bottom: .2em;
        margin-top: .1em;
      }
      .linextra {
        text-align: right;
      }
      .nogloss {
        font-size: 0.9em;
        margin-left: 1.5em;
        padding: 0.1em 0.3em;
        border-left: 1px solid currentColor;
        /* ---- */
        display: flex;
        flex-direction: column;
        margin-top: auto;
        padding: .5em;
      }
      .nogloss .topic {
        margin-top: 0.3em;
        margin-bottom: 0.3em;
      }
      .footkey {
        font-weight: bold;
        line-height: 0.95; /* To adjust for bold. */
      }
      rt {
        font-size: 70%;
        border-top: 1px dotted currentColor;
      }
      ruby {
        ruby-align: center;
        ruby-position: under;
        margin: 0 0.1em;
        text-wrap: nowrap;
      }
      ruby:first-child {
        ruby-align: start;
      }
      .corner {
        font-size: 0.7em;
        vertical-align: 0.5em;
        line-height: 0;
      }
      .corner.ul {
        margin-right: -0.2em;
      }
      .corner.lr {
        margin-left: -0.2em;
      }
      .nogloss .lr {
        margin-right: 0.5em;
      }
    `;
    return css;
  }

  makeHtmlForGlossLines(lines) {

    const groups = groupLines(lines);
    console.log(groups);

    if (groups.length === 0) {
      return '';
    }

    let glossedlines = groups.map(glossForGroup);

    console.log(glossedlines);

    glossedlines = glossedlines.map(ln => {
      // Split on '|' but not if in part of ruby tagging.
      // Might want to make that a configurable special
      // character.
      const [txt, xtra=""] = ln.split(/\|(?!.*<\/ruby>)/)
                             .map(p => p.trim());
      return `
        <span class="linextra">${xtra}</span>
        <span class="linetext">${txt}</span>`;
    });

    let html = glossedlines.join(' ');
    html = `<div class="gloss">${html}</div>`
    return html;
  }

  makeHtmlForNonGlossLines(lines) {
    lines = lines.map(ln => {
      ln = ln.replace(
        /\u231C(.*?)\u231D/g,
        "\u231C<span class='footkey'>$1</span>\u231D");
      if (ln === '----') {
        ln = "</div><div class='topic'>";
      }
      return ln;
     });

    const html = `<div class="nogloss">
                    <div class="topic">${lines.join(' ')}</div>
                  </div>`;
    return html;
  }


  makeHtmlForLines(lines) {

    // Loop to repeatedly take the next to-gloss section
    // followed by the next footer section.  Create HTML as we
    // proceed.  Consider "---" to end to-gloss and start footer and
    // "+++" to resume end footer and resume to-gloss.

    let lcpy = [...lines]; // Just for development of loop.
    const stopgloss = '---';
    const startgloss = '+++';
    let h = '';
    while (lcpy.length > 0) {
      let idx = lcpy.indexOf(stopgloss);
      if (idx === -1) {
        h += this.makeHtmlForGlossLines(lcpy);
        break;
      }

      h += this.makeHtmlForGlossLines(lcpy.slice(0, idx));
      lcpy = lcpy.slice(idx+1);

      idx = lcpy.indexOf(startgloss);
      if (idx === -1) {
        h += this.makeHtmlForNonGlossLines(lcpy);
        break;
      }
      h += this.makeHtmlForNonGlossLines(lcpy.slice(0, idx));
      lcpy = lcpy.slice(idx+1);
    }

    let html = h;
    //const html = this.makeHtmlForGlossLines(lines);
    html = html.replaceAll('\u231C', '<span class="corner ul">&ulcorner;</span><!--ul-->');
    html = html.replaceAll('\u231D', '<span class="corner lr">&urcorner;</span><!--lr-->');
    return html;
  }
  
  connectedCallback() {

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = this.getCSS();
    shadow.appendChild(style);

    const wrapperdiv = document.createElement('div');
    wrapperdiv.classList.add('glosswrap');
    shadow.appendChild(wrapperdiv);

    const srctext = this.innerHTML
    console.log(srctext)

    const lines = srctext.split(/\r\n|\r|\n/g)
                         .map(ln => ln.trimEnd())
    console.log(lines)

    const html = this.makeHtmlForLines(lines);


    wrapperdiv.innerHTML = html;
  }
}

if (!customElements.get('txt-gloss')) {
  customElements.define('txt-gloss', TextGloss)
}
