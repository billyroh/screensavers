const svg = document.querySelector('svg');
let corpus;

// 1. Create columns and rows to fill the viewport
// 2. Fill each of the cells with a character
// 3. Iterate through each of the columns and set some speed of rain
// 4. 

function main() {
  initialize();
  randomize();
  animate();
}

function initialize() {
  let viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  let viewPortHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let textWidth = 18;
  let textHeight = 18;
  let numberOfColumns = Math.ceil(viewPortWidth / textWidth) + 4;
  let numberOfRows = Math.ceil(viewPortHeight / textHeight) + 4;
  
  let numericalCorpus = '12345678990';
  let japaneseCorpus = '道可非常可名ジスセソタダチヂツテトナニヌネノハバパヒフヘホマミムメモ';
  let symbolCorpus = '☺✑♡☂⋮✐☼☏⇄✏✎№Ω℞※§∜☽♀♂⚢₹☁↷☻†¤¢℅☎↻❤♨⟷¶☙µ≤'
  corpus = numericalCorpus + japaneseCorpus;
  
  for (let c = 0; c < numberOfColumns; c++) {
    let column = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.append(column);
    column.setAttribute('transform', `translate(${c * textWidth}, 10)`);
    for (let r = 0; r < numberOfRows; r++) {
      let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('y', `${r * textHeight}`);
      text.setAttribute('style', 'fill: black');
      text.setAttribute('text-anchor', 'middle');
      text.innerHTML = _.sample(corpus);
      column.append(text);
    }
  }
}

function randomize() {
  let columns = svg.childNodes;
  setInterval(() => {
    for (const column of columns) {
      for (const text of column.childNodes) {
        if (_.random(100) < 10) {
          text.innerHTML = _.sample(corpus);
        }
      }
    }
  }, 500)
}

function animate() {
  let columns = svg.childNodes;
  setInterval(() => {
    for (const column of columns) {
      if (_.random(100) < 5) {
        let i = 1;
        for (const text of column.childNodes) {
          setTimeout(() => {
            text.setAttribute('class', 'transition');
          }, i * 100);

          setTimeout(() => {
            text.removeAttribute('class');
          }, (i * 100) + 5000);
          
          i++;
        }
      }
    }
  }, 500);
}

main();