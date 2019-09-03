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

function drawPath() {
  pipePathArray.forEach((pipePath, pipePathIndex) => {
    let color =  _.sample(['red', 'green', 'blue', 'yellow', 'pink']);
    pipePath.forEach((pipeSegment, pipeSegmentIndex) => {
      window.setTimeout(() => {
        drawSphere(pipePath, pipeSegmentIndex, color);
        drawCylinder(pipePath, pipeSegmentIndex, color);
      }, getDrawDelay(pipePathArray, pipePathIndex, pipeSegmentIndex))
    });
  })
}

function getDrawDelay(pipePathArray, pipePathIndex, pipeSegmentIndex) {
  // How much to delay the rendering of the entire pipe path by
  let pipePathDelay = 0;

  // How much to delay the rendering of each pipe segment by
  let pipeSegmentRenderDelay = 100;

  // If it's the first pipe path, start rendering immediately
  // Else, start rendering only after the previous pipe path has rendered
  if (pipePathIndex > 0) {
    let previousPipePathLength = pipePathArray[pipePathIndex - 1].length;
    pipePathDelay = previousPipePathLength * pipeSegmentRenderDelay;
    console.log(pipePathDelay)
  }

  // Only render a segment if the previous segment has rendered
  let pipeSegmentDelay = pipeSegmentRenderDelay * pipeSegmentIndex;

  return pipePathDelay + pipeSegmentDelay;
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

createPipePath();
createPipePath();
createPipePath();
createPipePath();
createPipePath();
createPipePath();
drawPath();

// Data pipeline
// 1. Generate space
// 2. Generate plot for a pipePath, ensuring no collisions between other pipe segments
// 3. Generate some number of pipePaths
// 4. Based on pipePaths, generate the drawable segments

