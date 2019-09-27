const svg = document.querySelector('svg');
let corpus, palette;
let columnIsAnimating = [];

// 1. Create columns and rows to fill the viewport
// 2. Fill each of the cells with a character
// 3. Iterate through each of the columns and set some speed of rain

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
  palette = ['green'];
  palette = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple'];

  for (let i = 0; i < numberOfColumns; i++) {
    columnIsAnimating.push(false);
  }
  
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
  const animationLength = 5000;
  const animationDelay = 100;
  let columns = svg.childNodes;
  setInterval(() => {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      if (_.random(100) < 1 && !columnIsAnimating[columnIndex]) {
        let i = 1;
        let color = _.sample(palette);
        let column = columns[columnIndex];
        let numberOfRows = column.childNodes.length;

        columnIsAnimating[columnIndex] = true;
        setTimeout(() => {
          columnIsAnimating[columnIndex] = false;
        }, numberOfRows * (animationLength + animationDelay) + (animationDelay * 3));

        for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
          let text = column.childNodes[rowIndex];

          setTimeout(() => {
            text.setAttribute('class', color);
          }, rowIndex * animationDelay);

          setTimeout(() => {
            text.setAttribute('class', '');
          }, (rowIndex * animationDelay) + animationLength + animationDelay);
        }
      }
    }
  }, 250);
}

main();