/*
# General psuedocode 
- Roll dice to determine direction. Bias slightly toward maintaining previous direction.
- If the space is already taken up, roll again.
- Roll dice to determine whether to have bulb or not.
- Generate segment. Record segment's placement in array.

# Data structures...
- matrix?

*/

// Global variables
const dimension = 16;
const maxPipeLength = 5;
const minPipeCount = 5;
const maxPipeCount = 6;
const pipeRadius = 0.1;
const pipeHeight = 1;
const bigSphereRadius = 0.15;
const pipeDrawDelay = 50;

// Log of all the spots that are already taken up by a pipe
let placementMatrix = math.zeros(dimension, dimension, dimension);

// Array that is an array of the path of a single pipe
let pipePathArray = [];

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
  for (let index = 0; index < pipePath.length - 1; index++) {
    await drawSegment(pipePath, index, color);
  }

  return new Promise(resolve => {
    setTimeout(resolve, pipeDrawDelay);
  });
}

async function drawSegment(pipePath, index, color) {
  drawSphere(pipePath, index, color);
  drawCylinder(pipePath, index, color);

  return new Promise(resolve => {
    setTimeout(resolve, pipeDrawDelay);
  });
}

function drawSphere(pipePath, index, color) {
  let startingPoint = pipePath[index];
  let position = `${startingPoint[0]}, ${startingPoint[1]}, ${startingPoint[2]}`

  let pipeWrapper = document.querySelector('a-entity#pipe-wrapper');
  let sphere = document.createElement('a-sphere');
  sphere.setAttribute('position', position);
  sphere.setAttribute('radius', getSphereRadius(pipePath, index));
  sphere.setAttribute('color', color);
  pipeWrapper.append(sphere);
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

function drawCylinder(pipePath, index, color) {
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
  let pipeWrapper = document.querySelector('a-entity#pipe-wrapper');
  let cylinder = document.createElement('a-cylinder');
  cylinder.setAttribute('radius', pipeRadius);
  cylinder.setAttribute('height', pipeHeight);
  cylinder.setAttribute('rotation', rotation);
  cylinder.setAttribute('position', position);
  cylinder.setAttribute('color', color);
  pipeWrapper.append(cylinder);
}

async function fadeOut() {
  let fadeOutArray = [];
  for (let x = -16 * 3; x < 16 * 3; x++) {
    for (let y = -9 * 3; y < 9 * 3; y++) {
      fadeOutArray.push([x, y]);
    }
  }
  fadeOutArray = _.shuffle(fadeOutArray);

  let numberToDrawPerChunk = 100;
  let numberOfChunks = Math.floor(fadeOutArray.length / numberToDrawPerChunk);

  for (let i = 0; i < numberOfChunks; i++) {
    let indexStart = numberToDrawPerChunk * i;
    let indexEnd = indexStart + numberToDrawPerChunk;
    if (indexEnd > fadeOutArray.length) {
      indexEnd = fadeOutArray.length;
    }

    let coordsArray = fadeOutArray.slice(indexStart, indexEnd);
    await drawBoxArray(coordsArray);
  }
}

async function drawBoxArray(coordsArray) {
  let wrapper = document.querySelector('a-entity#fade-out-wrapper');
  let container = document.createElement('a-entity');
  wrapper.append(container);

  for (const coords of coordsArray) {
    drawBox(coords[0], coords[1], container);
  }
  
  container.setAttribute('geometry-merger', 'preserveOriginal: false');

  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

function drawBox(x, y, container) {
  let box = document.createElement('a-plane');

  let height = 0.02;

  box.setAttribute('height', height);
  box.setAttribute('width', height);
  box.setAttribute('position', `${x * height}, ${y * height}, 0`);
  box.setAttribute('color', 'grey');
  container.append(box);
}

async function cleanUp() {
  let fadeOutWrapper = document.querySelector('a-entity#fade-out-wrapper');
  let pipeWrapper = document.querySelector('a-entity#pipe-wrapper');
  
  fadeOutWrapper.innerHTML = '';
  pipeWrapper.innerHTML = '';
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
