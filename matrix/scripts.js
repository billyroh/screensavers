const svg = document.querySelector('svg');
const animationLength = 5000;
const animationDelay = 100;
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

  corpus = getCorpus('japanese');
  palette = getPalette('classic');
  // palette = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple'];

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

function getCorpus(corpusType) {
  let numericalCorpus = '12345678990';
  let corpus = numericalCorpus;

  if (corpusType === 'japanese') {
    corpus += '道可非常可ジスセソタチツテトナニヌネノハヒフヘホマミムメ';
  } else if (corpusType === 'korean') {
    corpus += 'ㅁㄴㅇㄹㅎㅗㅓㅏㅣㅂㅈㄷㄱㅅㅆㅃㅉㄸㄲㅆㅋㅌㅊㅍㅐㅔㅠㅜㅡ'
  } else if (corpusType === 'arabic') {
    corpus += 'وجّهالممثلورمحمدعليرسالةإلىالرئيسعبدالفتاح';
  } else if (corpusType === 'hebrew') {
    corpus += 'מתרחשסביבנולצנוחלגובהכזהזובהחלטחוויה'
  } else if (corpusType === 'wingdings') {
    corpus += '☺✑♡☂⋮✐☼☏⇄✏✎№Ω℞※§∜☽♀♂⚢₹☁↷☻†¤¢℅☎↻❤♨⟷¶☙µ≤';
  } else {
    corpus += '道可非常可ジスセソタチツテトナニヌネノハヒフヘホマミムメ'; 
  }

  return corpus;
}

function getPalette(paletteType) {
  if (paletteType === 'classic') {
    return ['green'];
  } else if (paletteType === 'rainbow') {
    return ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple'];
  } else if (paletteType === 'pastel') {
    return ['pastel1', 'pastel2', 'pastel3', 'pastel4'];
  } else {
    return ['green'];
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
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      if (_.random(100) < 1 && !columnIsAnimating[columnIndex]) {
        animateColumn(columns, columnIndex);
      }
    }
  }, 250);
}

async function animateColumn(columns, columnIndex) {
  let color = _.sample(palette);
  let column = columns[columnIndex];
  let numberOfRows = column.childNodes.length;
  columnIsAnimating[columnIndex] = true;

  for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
    let text = column.childNodes[rowIndex];
    await animateCell(text, color);
  }

  columnIsAnimating[columnIndex] = false;
}

async function animateCell(text, color) {
  text.setAttribute('class', color);

  setTimeout(() => {
    text.removeAttribute('class');
  }, animationLength + animationDelay)

  return new Promise(resolve => {
    setTimeout(resolve, animationDelay);
  });
}

const paletteSelector = document.querySelector('select.palette-selector');
const corpusSelector = document.querySelector('select.corpus-selector');

paletteSelector.addEventListener('change', (event) => {
  palette = getPalette(event.target.value);
});

corpusSelector.addEventListener('change', (event) => {
  corpus = getCorpus(event.target.value);
});

main();