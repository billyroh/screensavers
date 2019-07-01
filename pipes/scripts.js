/*
# General psuedocode 
- Roll dice to determine direction. Bias slightly toward maintaining previous direction.
- If the space is already taken up, roll again.
- Roll dice to determine whether to have bulb or not.
- Generate segment. Record segment's placement in array.

# Data structures...
- matrix?

*/

const dimension = 3;
let placementMatrix = math.zeros(dimension, dimension, dimension);
let indexArray = [];

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
    let isTaken = !!math.subset(placementMatrix, math.index(nextIndex[0], nextIndex[1], nextIndex[2]));
    return !isTaken;
  });

  return nextIndexOptionArray;
}

function addNextIndex(currentIndex) {
  // Avoid excessively long arrays
  if (indexArray.length > 10) {
    return;
  }

  // If no more pathways available, return
  let validNextIndexArray = getValidNextIndexArray(currentIndex);
  if (validNextIndexArray.length === 0) {
    return;

  // Else, add the next valid path and recurse
  } else {
    let nextIndex = validNextIndexArray[_.random(0, validNextIndexArray.length - 1)];
    indexArray.push(nextIndex);
    placementMatrix.subset(math.index(nextIndex[0], nextIndex[1], nextIndex[2]), 1);
    addNextIndex(nextIndex)
  }
}

function createInitialIndex() {
  let currentIndex = [_.random(0, dimension - 1), _.random(0, dimension - 1), _.random(0, dimension - 1)];
  let isTaken = !!math.subset(placementMatrix, math.index(currentIndex[0], currentIndex[1], currentIndex[2]));
  if (isTaken) {
    return createInitialIndex();
  } else {
    placementMatrix.subset(math.index(currentIndex[0], currentIndex[1], currentIndex[2]), 1);
    return currentIndex;
  }
}

let currentIndex = createInitialIndex();
indexArray.push(currentIndex);
addNextIndex(currentIndex);

console.log(indexArray);