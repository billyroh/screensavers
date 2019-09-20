/*
# General psuedocode 
- Roll dice to determine direction. Bias slightly toward maintaining previous direction.
- If the space is already taken up, roll again.
- Roll dice to determine whether to have bulb or not.
- Generate segment. Record segment's placement in array.

# Data structures...
- matrix?

*/

// Global consts
const dimension = 16;
const maxPipeLength = 75;
const minPipeCount = 5;
const maxPipeCount = 20;
const pipeRadius = 0.1;
const pipeHeight = 1;
const bigSphereRadius = 0.15;
const pipeDrawDelay = 50;

// Log of all the spots that are already taken up by a pipe
let placementMatrix = math.zeros(dimension, dimension, dimension);

// Array that is an array of the path of a single pipe
let pipePathArray = [];

// Ensures only one teapot has been rendered at a time
let teaPotHasBeenRendered = false;

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
  if (_.random(100) < 2) {
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
  let h = _.random(0, 255);
  let s = _.random(0, 50);
  let l = _.random(30, 70);

  let color =  `hsl(${h}, ${s}%, ${l}%)`;
  let globalWrapper = document.querySelector('a-entity#pipe-wrapper');
  let instanceWrapper = document.createElement('a-entity');
  globalWrapper.append(instanceWrapper);

  for (let index = 0; index < pipePath.length - 1; index++) {
    await drawSegment(pipePath, index, color, instanceWrapper);
    maybeDrawTeapot(pipePath, index, color, instanceWrapper);
  }

  return new Promise(resolve => {
    setTimeout(resolve, pipeDrawDelay);
  });
}

async function drawSegment(pipePath, index, color, wrapper) {
  drawSphere(pipePath, index, color, wrapper);
  drawCylinder(pipePath, index, color, wrapper);

  return new Promise(resolve => {
    setTimeout(resolve, pipeDrawDelay);
  });
}

function drawSphere(pipePath, index, color, wrapper) {
  let startingPoint = pipePath[index];
  let position = `${startingPoint[0]}, ${startingPoint[1]}, ${startingPoint[2]}`

  let sphere = document.createElement('a-sphere');
  sphere.setAttribute('position', position);
  sphere.setAttribute('radius', getSphereRadius(pipePath, index));
  sphere.setAttribute('color', color);
  wrapper.append(sphere);

  if (index === pipePath.length - 2) {
    drawSphere(pipePath, index + 1, color, wrapper);
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

function drawCylinder(pipePath, index, color, wrapper) {
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
  wrapper.append(cylinder);
}

function maybeDrawTeapot(pipePath, index, color, wrapper) {
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

  let numberofSquaresPerWave = 300;
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

async function cleanUp() {
  let pipeWrapper = document.querySelector('a-entity#pipe-wrapper');
  let svgWrapper = document.querySelector('#fade-out-wrapper-svg');
  
  pipeWrapper.innerHTML = '';
  svgWrapper.innerHTML = '';
  pipePathArray = [];
  placementMatrix = math.zeros(dimension, dimension, dimension);
  teaPotHasBeenRendered = false;
}

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

main();
