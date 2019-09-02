/*
# General psuedocode 
- Roll dice to determine direction. Bias slightly toward maintaining previous direction.
- If the space is already taken up, roll again.
- Roll dice to determine whether to have bulb or not.
- Generate segment. Record segment's placement in array.

# Data structures...
- matrix?

*/

// Dimensions of the space
const dimension = 3;

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
  if (pipePath.length > 10) {
    return;
  }

  // If no more pathways available, return
  let validNextIndexArray = getValidNextIndexArray(currentIndex);
  if (validNextIndexArray.length === 0) {
    return;

  // Else, add the next valid path and recurse
  } else {
    let nextIndex = validNextIndexArray[_.random(0, validNextIndexArray.length - 1)];
    pipePath.push(nextIndex);
    placementMatrix.subset(math.index(nextIndex[0], nextIndex[1], nextIndex[2]), 1);
    addNextIndex(pipePath, nextIndex);
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
  let pipePath = [initialIndex];
  addNextIndex(pipePath, initialIndex);
  pipePathArray.push(pipePath);
}

createPipePath();
drawPath();

function drawPath() {
  let pipeWrapper = document.querySelector('a-entity#pipe-wrapper');
  pipePathArray.forEach((pipePath) => {
    pipePath.forEach((pipeSegment, index) => {
      let sphere = getSphere(pipePath, index);
      let drawnSegment = getPipeSegment(pipePath, index);
      pipeWrapper.append(sphere);
      pipeWrapper.append(drawnSegment);
    });
  })
}

function getSphere(pipePath, index) {
  let startingPoint = pipePath[index];

  let drawnSegment = document.createElement('a-sphere');
  drawnSegment.setAttribute('color', 'red');
  drawnSegment.setAttribute('opacity', `${index * 0.15}`);
  drawnSegment.setAttribute('radius', 0.1);
  drawnSegment.setAttribute('position', `${startingPoint[0]}, ${startingPoint[1]}, ${startingPoint[2]}`);

  return drawnSegment;
}

function getPipeSegment(pipePath, index) {
  if (index === pipePath.length - 1) {
    return;
  }

  let startingPoint = pipePath[index];
  let endingPoint = pipePath[index + 1];

  let midX = (startingPoint[0] + endingPoint[0]) / 2;
  let midY = (startingPoint[1] + endingPoint[1]) / 2;
  let midZ = (startingPoint[2] + endingPoint[2]) / 2;

  // TODO based on startingPoint and endingPoint, adjust the rotation value
  let diffX = startingPoint[0] - endingPoint[0];
  let diffY = startingPoint[1] - endingPoint[1];
  let diffZ = startingPoint[2] - endingPoint[2];

  let drawnSegment = document.createElement('a-cylinder');
  drawnSegment.setAttribute('color', 'red');
  drawnSegment.setAttribute('opacity', `${index * 0.15}`);
  drawnSegment.setAttribute('radius', 0.01);
  drawnSegment.setAttribute('height', 1);
  drawnSegment.setAttribute('rotation', `${90 * diffX}, ${90 * diffX * -1}, ${90 * diffZ}`)
  drawnSegment.setAttribute('position', `${midX}, ${midY}, ${midZ}`);

  return drawnSegment;
}

console.log(pipePathArray);
