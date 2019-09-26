// Overall structure
// - Create a matrix of all the possible coordinates in the space
// - Draw a plot of each plot, ensuring the pipes don't overlap
// - Based on the plot, render each pipe
// - Sometimes show a teapot, but only one max
// - Once all pipes are rendered, fade out then restart the sequence

// Global consts
const dimension = 16;
const maxPipeLength = 100;
const minPipeCount = 5;
const maxPipeCount = 20;
const pipeRadius = 0.1;
const pipeHeight = 1.01;
const bigSphereRadius = 0.15;
const pipeDrawDelay = 50;
const metalness = 0.3;

// Log of all the spots that are already taken up by a pipe
let placementMatrix = math.zeros(dimension, dimension, dimension);

// Array that is an array of the path of a single pipe
let pipePathArray = [];

// Ensures only one teapot has been rendered at a time
let teaPotHasBeenRendered = false;

// Palette the pipes should use
let paletteType = 'default';
let colorArray = getColorArray();
let spongebobArray = ['#spongebob1', '#spongebob2', '#spongebob3', '#spongebob4', '#spongebob5'];


// Roll dice to determine direction
// possible permutations:
// x: -/+1
// y: -/+1
// z: -/+1

const directionMatrix = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
  [0, 0, -1],
  [0, 0, 1],
];

async function main() {
  let numberOfPipes = _.random(minPipeCount, maxPipeCount);
  
  for (let i = 0; i < numberOfPipes - 1; i++) {
    createPipePath();
  }

  for (const pipePath of pipePathArray) {
    await drawPipe(pipePath);
  }

  await fadeOut();
  await cleanUp();
  main()
}

// Check if the proposedIndex is already occupied by another segment of a pipe
function isTaken(proposedIndex) {
  return !!math.subset(placementMatrix, math.index(proposedIndex[0], proposedIndex[1], proposedIndex[2]));
}

function getValidNextIndexArray(currentIndex) {
  // Create all permutations of the next index
  let currentIndexMatrix = math.matrix([currentIndex, currentIndex, currentIndex, currentIndex, currentIndex, currentIndex]);
  let nextIndexOptionArray = math.add(currentIndexMatrix, directionMatrix)._data;

  // Filter out options that are out of bounds
  nextIndexOptionArray = _.filter(nextIndexOptionArray, (nextIndex) => {
    return !nextIndex.includes(-1) && !nextIndex.includes(dimension);
  })

  // Filter out options that are already taken
  nextIndexOptionArray = _.filter(nextIndexOptionArray, (nextIndex) => {
    return !isTaken(nextIndex);
  });

  return nextIndexOptionArray;
}

function addNextIndex(pipePath, currentIndex) {
  // Avoid excessively long arrays
  if (pipePath.length >= maxPipeLength) {
    return pipePath;
  }

  // Add some randomness to length
  // Avoid excessively short arrays
  if (_.random(100) < 2 && pipePath.length > 5) {
    return pipePath;
  }

  // If no more pathways available, return
  let validNextIndexArray = getValidNextIndexArray(currentIndex);
  if (validNextIndexArray.length === 0) {
    return pipePath;

  // Else, add the next valid path and recurse
  } else {
    let nextIndex = validNextIndexArray[_.random(0, validNextIndexArray.length - 1)];
    pipePath.push(nextIndex);
    placementMatrix.subset(math.index(nextIndex[0], nextIndex[1], nextIndex[2]), 1);
    return addNextIndex(pipePath, nextIndex);
  }
}

function createInitialIndex() {
  let currentIndex = [_.random(0, dimension - 1), _.random(0, dimension - 1), _.random(0, dimension - 1)];

  // Start from a point that is unoccupied
  if (isTaken(currentIndex)) {
    return createInitialIndex();
  } else {
    placementMatrix.subset(math.index(currentIndex[0], currentIndex[1], currentIndex[2]), 1);
    return currentIndex;
  }
}

function createPipePath() {
  let initialIndex = createInitialIndex();
  let pipePath = addNextIndex([initialIndex], initialIndex);
  pipePathArray.push(pipePath);
}

async function drawPipe(pipePath) {
  let globalWrapper = document.querySelector('a-entity#pipe-wrapper');
  let instanceWrapper = document.createElement('a-entity');
  globalWrapper.append(instanceWrapper);

  let color =  _.sample(colorArray);
  let material = getMaterial();

  for (let index = 0; index < pipePath.length - 1; index++) {
    await drawSegment(pipePath, index, color, material, instanceWrapper);
    maybeDrawTeapot(pipePath, index, color, material, instanceWrapper);
  }

  return new Promise(resolve => {
    setTimeout(resolve, pipeDrawDelay);
  });
}

function getColorArray() {
  let colorArray = [];
  
  if (paletteType === 'default') {
    let numberOfColors = _.random(8);
    for (let i = 0; i < numberOfColors; i++) {
      let h = _.random(0, 255);
      let s = _.random(0, 50);
      let l = _.random(20, 60);
      colorArray.push(`hsl(${h}, ${s}%, ${l}%)`);
    }
  } else if (paletteType === 'rainbow') {
    colorArray.push('#EB5757');
    colorArray.push('#F2994A');
    colorArray.push('#F2C94C');
    colorArray.push('#219653');
    colorArray.push('#2F80ED');
    colorArray.push('#56CCF2');
    colorArray.push('#9B51E0');
  } else if (paletteType === 'greyscale') {
    let numberOfColors = _.random(8);
    for (let i = 0; i < numberOfColors; i++) {
      let h = 0;
      let s = 0;
      let l = _.random(20, 60);
      colorArray.push(`hsl(${h}, ${s}%, ${l}%)`);
    }
  } else if (paletteType === 'fairyfloss') {
    // Pulled from https://github.com/sailorhg/fairyfloss
    colorArray.push('#C2FFDF');
    colorArray.push('#FFB8D1');
    colorArray.push('#FF857F');
    colorArray.push('#FFF352');
    colorArray.push('#C5A3FF');
  } else if (paletteType === 'spongebob') {
    colorArray.push('white');
  } 
  
  return colorArray;
}

function getMaterial() {
  if (paletteType === 'spongebob') {
    let src = _.sample(spongebobArray);
    return `src: ${src}`;
  } else {
    return `metalness: ${metalness}`;
  }
}

async function drawSegment(pipePath, index, color, material, wrapper) {
  drawSphere(pipePath, index, color, material, wrapper);
  drawCylinder(pipePath, index, color, material, wrapper);

  return new Promise(resolve => {
    setTimeout(resolve, pipeDrawDelay);
  });
}

function drawSphere(pipePath, index, color, material, wrapper) {
  let startingPoint = pipePath[index];
  let position = `${startingPoint[0]}, ${startingPoint[1]}, ${startingPoint[2]}`

  let sphere = document.createElement('a-sphere');
  sphere.setAttribute('position', position);
  sphere.setAttribute('radius', getSphereRadius(pipePath, index));
  sphere.setAttribute('color', color);
  sphere.setAttribute('material', material);
  wrapper.append(sphere);

  if (index === pipePath.length - 2) {
    drawSphere(pipePath, index + 1, color, material, wrapper);
  }
}

function getSphereRadius(pipePath, index) {
  if (index === 0) {
    return pipeRadius;
  } else if (index === pipePath.length -1) {
    return pipeRadius;
  }

  let previousPoint = pipePath[index - 1];
  let startingPoint = pipePath[index];
  let endingPoint = pipePath[index + 1];

  let diff1 = math.subtract(previousPoint, startingPoint);
  let diff2 = math.subtract(startingPoint, endingPoint);

  let comparison = math.compare(diff1, diff2);
  let probability = 0.5;

  // Check if cylinder is going in the same direction as the previous cylinder
  // If they're going in different directions, sometimes make the radius of the sphere slightly bigger
  if (comparison.every(point => point === 0)) {
    return pipeRadius;
  } else if (Math.random() > probability) {
    return pipeRadius;
  } else {
    return bigSphereRadius;
  }
}

function drawCylinder(pipePath, index, color, material, wrapper) {
  if (index === pipePath.length - 1) {
    return;
  }

  let startingPoint = pipePath[index];
  let endingPoint = pipePath[index + 1];
  
  // Place the cylinder in between the starting and ending points
  let midPoint = math.divide(math.add(startingPoint, endingPoint), 2);
  let position = `${midPoint[0]}, ${midPoint[1]}, ${midPoint[2]},`

  // Rotate the cylinder to connect the two points together
  let rotationX = (endingPoint[0] - startingPoint[0]) * 90;
  let rotationY = (1 - endingPoint[1] - startingPoint[1]) * 90;
  let rotationZ = (endingPoint[2] - startingPoint[2]) * 90;
  let rotation =`${rotationX}, ${rotationY}, ${rotationZ}`;

  // Render the cylinder
  let cylinder = document.createElement('a-cylinder');
  cylinder.setAttribute('radius', pipeRadius);
  cylinder.setAttribute('height', pipeHeight);
  cylinder.setAttribute('rotation', rotation);
  cylinder.setAttribute('position', position);
  cylinder.setAttribute('color', color);
  cylinder.setAttribute('material', material);
  wrapper.append(cylinder);
}

function maybeDrawTeapot(pipePath, index, color, material, wrapper) {
  if (teaPotHasBeenRendered) {
    return;
  }

  if (_.random(1000) < 1) {
    let teapot = document.createElement('a-obj-model');
    let position = `${pipePath[index][0]}, ${pipePath[index][1]}, ${pipePath[index][2]}`
    teapot.setAttribute('src', '#teapot');
    teapot.setAttribute('scale', '0.005 0.005 0.005');
    teapot.setAttribute('color', color);
    teapot.setAttribute('position', position);
    teapot.setAttribute('material', material);
    wrapper.append(teapot);
    teaPotHasBeenRendered = true;
  }
}

async function fadeOut() {
  let fadeOutArray = [];
  let svgWrapper = document.querySelector('#fade-out-wrapper-svg');
  var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  svgWrapper.setAttribute('width', width);
  svgWrapper.setAttribute('height', height);

  for (let x = 0; x < Math.ceil(width / 10); x++) {
    for (let y = 0; y < Math.ceil(height / 10); y++) {
      fadeOutArray.push([x, y]);
    }
  }
  fadeOutArray = _.shuffle(fadeOutArray);

  // Make the fade out effect proportional to the viewport's width
  let numberofSquaresPerWave = Math.floor(width / 3);
  let numberOfWaves = Math.floor(fadeOutArray.length / numberofSquaresPerWave);

  for (let i = 0; i < numberOfWaves; i++) {
    let indexStart = numberofSquaresPerWave * i;
    let indexEnd = indexStart + numberofSquaresPerWave;

    if (indexEnd > fadeOutArray.length) {
      indexEnd = fadeOutArray.length;
    }

    let coordsArray = fadeOutArray.slice(indexStart, indexEnd);
    await drawSquareArray(coordsArray);
  }
}

async function drawSquareArray(coordsArray) {
  let svgWrapper = document.querySelector('#fade-out-wrapper-svg');
  let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let height = 10;
  let pathString = '';

  for (const coords of coordsArray) {
    // drawSquare(coords[0], coords[1]);
    let vertex1 = `M ${coords[0] * height} ${coords[1] * height}`;
    let vertex2 = `H ${(coords[0] * height) + height}`;
    let vertex3 = `V ${(coords[1] * height) + height}`;
    let vertex4 = `H ${coords[0] * height}`;
    pathString += `${vertex1} ${vertex2} ${vertex3} ${vertex4} Z `;
  }
  
  path.setAttribute('d', pathString);
  path.setAttribute('fill', 'black');
  svgWrapper.append(path);

  return new Promise(resolve => {
    setTimeout(resolve, 10);
  });
}

function recolorPipes() {
  let pipes = document.querySelector('a-entity#pipe-wrapper').childNodes;
  colorArray = getColorArray();

  for (const pipe of pipes) {
    let pipeSegments = pipe.childNodes;
    let material = getMaterial();
    let color = _.sample(colorArray);
    for (const pipeSegment of pipeSegments) {
      pipeSegment.setAttribute('material', `${material}`);
      pipeSegment.setAttribute('color', `${color}`)
    }
  }
}

const paletteSelector = document.querySelector('select.palette-selector');

paletteSelector.addEventListener('change', (event) => {
  paletteType = event.target.value;
  recolorPipes();
});

async function cleanUp() {
  let pipeWrapper = document.querySelector('a-entity#pipe-wrapper');
  let svgWrapper = document.querySelector('#fade-out-wrapper-svg');
  
  pipeWrapper.innerHTML = '';
  svgWrapper.innerHTML = '';
  pipePathArray = [];
  placementMatrix = math.zeros(dimension, dimension, dimension);
  teaPotHasBeenRendered = false;
  colorArray = getColorArray();
}

main();
