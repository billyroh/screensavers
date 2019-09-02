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
const dimension = 10;
const maxPipeLength = 50;
const pipeRadius = 0.1;
const pipeHeight = 1;
const bigSphereRadius = 0.175;

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

function drawPath() {
  let pipeWrapper = document.querySelector('a-entity#pipe-wrapper');

  pipePathArray.forEach((pipePath) => {
    let pipeColor =  _.sample(['red', 'green', 'blue', 'yellow', 'pink']);
    pipePath.forEach((pipeSegment, index) => {
      let sphere = getSphere(pipePath, index);
      sphere.setAttribute('color', pipeColor);
      pipeWrapper.append(sphere);

      if (index < pipePath.length - 1) {
        let drawnSegment = getPipeSegment(pipePath, index);
        drawnSegment.setAttribute('color', pipeColor);
        pipeWrapper.append(drawnSegment);
      }
    });
  })
}

function getSphere(pipePath, index) {
  let startingPoint = pipePath[index];

  let drawnSphereData = {
    position: `${startingPoint[0]}, ${startingPoint[1]}, ${startingPoint[2]}`,
    radius: getSphereRadius(pipePath, index)
  };

  let drawnSphere = document.createElement('a-sphere');
  drawnSphere.setAttribute('radius', drawnSphereData.radius);
  drawnSphere.setAttribute('position', drawnSphereData.position);

  return drawnSphere;
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
  // If they're going in different directions, make the radius of the sphere slightly bigger sometimes
  if (comparison.every(point => point === 0)) {
    return pipeRadius;
  } else if (Math.random() > probability) {
    return pipeRadius;
  } else {
    return bigSphereRadius;
  }
}

function getPipeSegment(pipePath, index) {
  let startingPoint = pipePath[index];
  let endingPoint = pipePath[index + 1];

  let midX = (startingPoint[0] + endingPoint[0]) / 2;
  let midY = (startingPoint[1] + endingPoint[1]) / 2;
  let midZ = (startingPoint[2] + endingPoint[2]) / 2;

  let rotationX = (endingPoint[0] - startingPoint[0]) * 90;
  let rotationY = (1 - endingPoint[1] - startingPoint[1]) * 90;
  let rotationZ = (endingPoint[2] - startingPoint[2]) * 90;
  let showSphere = false;

  let drawnSegmentData = {
    rotation: `${rotationX}, ${rotationY}, ${rotationZ}`,
    position: `${midX}, ${midY}, ${midZ}`,
    showSphere: showSphere,
  };

  let drawnSegment = document.createElement('a-cylinder');
  drawnSegment.setAttribute('radius', pipeRadius);
  drawnSegment.setAttribute('height', pipeHeight);
  drawnSegment.setAttribute('rotation', drawnSegmentData.rotation);
  drawnSegment.setAttribute('position', drawnSegmentData.position);

  return drawnSegment;
}

createPipePath();
createPipePath();
createPipePath();
createPipePath();
createPipePath();
createPipePath();
drawPath();

// Data structure
// let pipePathArray = [pipePath1, pipePath2, etc...]
// let pipePath1 = [pipeSegment1, pipeSegment2, etc...]
// let pipeSegment = {
//    startingPoint: String,
//    endingPoint: String,
//    position: String,
//    rotation: String,
//    color: String,
//    sphereRadius: Number, // whether sphere should be big or small
// }

// Data pipeline
// 1. Generate space
// 2. Generate plot for a pipePath, ensuring no collisions between other pipe segments
// 3. Generate some number of pipePaths
// 4. Based on pipePaths, generate the drawable segments
//

