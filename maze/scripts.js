// Overall structure
// - Generate maze
// - Render planes based on walls

const mazeHeight = 3;
const mazeWidth = 3;
const zOffset = 0.5;
const planeHeight = 0.5;
const mazeWrapper = document.querySelector('a-entity#maze-wrapper'); // Wraps walls, floor, ceiling
const wallWrapper = document.querySelector('a-entity#wall-wrapper'); // Wraps walls
const entityWrapper = document.querySelector('a-entity#entity-wrapper'); // Wraps maze entities (e.g. smiley faces, rats, etc.)
const camera = document.querySelector('a-entity#camera-wrapper');
const animationDelay = 750;
const animationDelayBuffer = 10;

// Keep track of...
// - pathHistoryArray: The path you took to get to the current position, so you can retrace your steps
// - visitedMatrix: Positions you've been to
let pathHistoryArray = [];
let visitedMatrix = math.zeros(mazeWidth, mazeHeight);

let goalPosition;
let goalReached = false;

async function main() {
    let maze = generateMazeData(mazeWidth, mazeHeight);
    await renderMaze(maze);
    console.log(maze);
    await initializeMazeEntities();
    while (!goalReached) {
        animateRat(maze)
        await traverseMaze(maze);
    }
    await cleanUp();
    main();
}

async function cleanUp() {
    goalPosition = null;
    goalReached = false;
    pathHistoryArray = [];
    visitedMatrix = math.zeros(mazeWidth, mazeHeight);
    wallWrapper.innerHTML = '';
    wallWrapper.removeAttribute('animation__fade-out');
    wallWrapper.removeAttribute('animation__fade-in');
    entityWrapper.innerHTML = '';
    
    return new Promise(resolve => {
        setTimeout(resolve, animationDelay)
    });
}

async function renderMaze(maze) {
    renderFloorAndCeiling(maze.width, maze.height);
    await renderWalls(maze);
    wallWrapper.setAttribute('scale', '1 0 1');
    wallWrapper.setAttribute('animation__fade-in',`
        property: scale;
        to: 1 1 1;
        dur: ${animationDelay};
        easing: linear;
    `);

    return new Promise(resolve => {
        setTimeout(resolve, 0)
    });

    // Rules
    // - Display start button at the star
    // - Encountering smiley face resets
    // - Encountering 20-sided dice thing flips floor to ceiling
    // - Encountering triangular prism flips it again
    // plus add in renderRat, renderSmileyFace, etc.
}

async function renderWalls(maze) {
    renderHorizontalPlanes(maze.horizontalPlanes);
    renderVerticalPlanes(maze.verticalPlanes);

    return new Promise(resolve => {
        setTimeout(resolve, 0)
    });
}

function renderHorizontalPlanes(arrayOfArrays) {
    let funWallHasRendered = false;
    arrayOfArrays.forEach((planeArray, i) => {
        planeArray.forEach((planeExists, j) => {
            if (planeExists) {
                let plane = document.createElement('a-plane');
                plane.setAttribute('width', 1);
                plane.setAttribute('height', planeHeight);
                plane.setAttribute('position', `${j} ${planeHeight / 2} ${i}`);

                // Randomly generate a wall with a different texture
                if (_.random(0, 100) < 5 && !funWallHasRendered) {
                    plane.setAttribute('material', 'side: double; src: #thing; shader: flat');
                    funWallHasRendered = true;
                } else {
                    plane.setAttribute('material', 'side: double; src: #brick; shader: flat');
                }

                wallWrapper.append(plane);
            }
        })
    })
}

function renderVerticalPlanes(arrayOfArrays) {
    arrayOfArrays.forEach((planeArray, i) => {
        planeArray.forEach((planeExists, j) => {
            if (planeExists) {
                let plane = document.createElement('a-plane');
                plane.setAttribute('width', 1);
                plane.setAttribute('height', planeHeight);
                plane.setAttribute('position', `${j - 0.5} ${planeHeight / 2} ${i + zOffset}`);
                plane.setAttribute('material', 'side: double; src: #brick; shader: flat');
                plane.setAttribute('rotation', '0 90 0')
                wallWrapper.append(plane);
            }
        })
    })
}

async function animateRat(maze) {
    let rat = document.querySelector('a-image#rat');
    let ratPosition = getRatPosition();
    let viablePositions = getViablePositionsForRat(maze, ratPosition);
    let newPosition = _.sample(viablePositions);

    rat.removeAttribute('animation');
    rat.setAttribute('animation',`
        property: position;
        to: ${newPosition.x} ${newPosition.y} ${newPosition.z};
        dur: ${animationDelay};
        easing: linear;
    `);

    return new Promise(resolve => {
        setTimeout(resolve, animationDelay + animationDelayBuffer)
    })
}

async function traverseMaze(maze) {
    let cameraPosition = getCameraPosition();
    let viablePositions = getViablePositions(maze, visitedMatrix, cameraPosition);

    pathHistoryArray.push(Object.assign({}, cameraPosition));
    visitedMatrix.subset(math.index(Math.floor(cameraPosition.x), Math.floor(cameraPosition.z)), 1);

    if (Math.floor(cameraPosition.x) === goalPosition.x && Math.floor(cameraPosition.z) === goalPosition.z - zOffset) {
        wallWrapper.setAttribute('animation__fade-out',`
            property: scale;
            to: 1 0 1;
            dur: ${animationDelay};
            easing: linear;
        `);
        
        goalReached = true;

        return new Promise(resolve => {
            setTimeout(resolve, animationDelay + animationDelayBuffer)
        })
    }

    if (viablePositions.length === 0) {
        pathHistoryArray.pop(); // Discard the latest
        let previousPosition = pathHistoryArray.pop();
        let newRotation = getCameraRotation(previousPosition);

        camera.setAttribute('animation__position',`
            property: position;
            to: ${previousPosition.x} ${previousPosition.y} ${previousPosition.z};
            dur: ${animationDelay};
            easing: linear;
        `);
        
        camera.setAttribute('animation__rotation',`
            property: rotation;
            to: ${newRotation};
            dur: ${animationDelay};
            easing: linear;
        `);
    } else {
        let newPosition = _.sample(viablePositions);
        let newRotation = getCameraRotation(newPosition);

        camera.setAttribute('animation__position',`
            property: position;
            to: ${newPosition.x} ${newPosition.y} ${newPosition.z};
            dur: ${animationDelay};
            easing: linear;
        `);

        camera.setAttribute('animation__rotation',`
            property: rotation;
            to: ${newRotation};
            dur: ${animationDelay};
            easing: linear;
        `);
    }

    return new Promise(resolve => {
        setTimeout(resolve, animationDelay + animationDelayBuffer)
    })

    // 1. Randomly place camera in maze
    // 2. Keep track of path in pathHistoryArray
    // 3. Keep track of path in unexploredPathArray, where at least one of the four sides is both:
    //   - Not blocked by a plane AND
    //   - Not already accessed before
    // 4. Add current position to pathHistoryArray and unexploredPathArray
    // 5. Randomly pick an adjacent coordinate that is accessible
    // 6. Add that coordinate to pathHistoryArray and unexploredPathArray
    // 7. Keep looping until you reach a dead end
    // 8. Retrace steps using pathHistoryArray, until you're at a position contained within unexploredPathArray
    // 
    // Keep in mind that when you encounter one of the following, you reset pathHistoryArray and unexploredPathArray
    // - Smiley: Reset the entire maze
    // - Dice: Flip
    // - Prism: Flip
}

// Return sanitized coordinates by lopping off unnecessary floating decimals
function getCameraPosition() {
    let position = camera.getAttribute('position');
    return {
        x: Math.round(position.x),
        y: planeHeight / 2,
        z: Math.floor(position.z) + zOffset,
    }
}

function getRatPosition() {
    let position = document.querySelector('a-image#rat').getAttribute('position');
    return {
        x: Math.round(position.x),
        y: 0.125,
        z: Math.floor(position.z) + zOffset,
    }
}

async function initializeMazeEntities() {
    let x, z, position;
    let positionArray = [];
    let y = planeHeight / 2;

    // Create array of all possible positions to prevent collisions
    for (let x = 0; x < mazeWidth; x++) {
        for (let z = 0; z < mazeHeight; z++) {
            positionArray.push({x, z})
        }
    }
    positionArray = _.shuffle(positionArray);

    // Camera
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    camera.setAttribute('position', `${x} ${y} ${z}`);

    // Start button
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    let difference = _.shuffle([
        {x: -1, z:  0},
        {x:  1, z:  0},
        {x:  0, z: -1},
        {x:  0, z:  1},
    ]).pop();
    x += difference.x;
    z += difference.z;
    _.remove(positionArray, (position) => {
        return position.x === x && position.z === z;
    })
    let startButton = document.createElement('a-image');
    startButton.setAttribute('material', 'src: #start-button; side: double; shader: flat');
    startButton.setAttribute('width', 0.75);
    startButton.setAttribute('height', 0.25);
    startButton.setAttribute('opacity', 0.5);
    startButton.setAttribute('position', `${x} ${y} ${z}`);
    startButton.setAttribute('look-at', '[camera]');
    entityWrapper.append(startButton);

    // Goal
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    let goal = document.createElement('a-circle');
    goal.setAttribute('material', 'src: #smiley; side: double; shader: flat');
    goal.setAttribute('radius', 0.2);
    goal.setAttribute('opacity', 0.5);
    goal.setAttribute('position', `${x} ${y} ${z}`);
    goal.setAttribute('look-at', '[camera]');
    entityWrapper.append(goal);
    goalPosition = { x, y, z };

    // Rat
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    let rat = document.createElement('a-image');
    rat.setAttribute('material', 'src: #rat; side: double; shader: flat');
    rat.setAttribute('id', 'rat');
    rat.setAttribute('width', 0.4);
    rat.setAttribute('height', 0.25);
    rat.setAttribute('position', `${x} 0.125 ${z}`);
    rat.setAttribute('look-at', '[camera]')
    entityWrapper.append(rat);
    
    return new Promise(resolve => {
        setTimeout(resolve, 1000)
    });
}

function getCameraRotation(newPosition) {
    let currentPosition = getCameraPosition();
    let difference = {
        x: currentPosition.x - newPosition.x,
        z: currentPosition.z - newPosition.z,
    };

    if (difference.z === -1) {
        return '0 180 0';
    } else if (difference.z === 1) {
        return '0 0 0';
    } else if (difference.x === -1) {
        return '0 -90 0';
    } else if (difference.x === 1) {
        return '0 90 0';
    }
}

function renderFloorAndCeiling(width, height) {
    let floor = document.createElement('a-plane');
    floor.setAttribute('width', width);
    floor.setAttribute('height', height);
    floor.setAttribute('material', `side: double; src: #floor; shader: flat ; repeat: ${width * 5} ${height * 5}`);
    floor.setAttribute('rotation', '90 0 0');
    floor.setAttribute('position', `${mazeWidth / 2 - zOffset} 0 ${mazeHeight / 2}`);

    let ceiling = document.createElement('a-plane');
    ceiling.setAttribute('width', width);
    ceiling.setAttribute('height', height);
    ceiling.setAttribute('material', `side: double; src: #ceiling; shader: flat ; repeat: ${width * 5} ${height * 5}`);
    ceiling.setAttribute('rotation', '90 0 0');
    ceiling.setAttribute('position', `${mazeWidth / 2 - zOffset} 0.5 ${mazeHeight / 2}`);

    mazeWrapper.append(floor);
    mazeWrapper.append(ceiling);
}

// 1. Get array of four adjacent positions
//   - Use maze.width, maze.height to make sure you're not going out of bounds
// 2. Filter out adjacent positions that have already been visited using visited Matrix
// 3. Return result

function getViablePositions(maze, visitedMatrix, position) {
    let viablePositions = [];
    let differenceArray = [
        {x: -1, z:  0},
        {x:  1, z:  0},
        {x:  0, z: -1},
        {x:  0, z:  1},
    ];

    for (const difference of differenceArray) {
        let path = {
            x: Math.round(position.x) + difference.x,
            y: position.y,
            z: Math.floor(position.z) + zOffset + difference.z,
        };

        // Check if path is within bounds of the maze
        let xIsInBounds = path.x >= 0 && path.x < maze.width;
        let zIsInBounds = path.z >= 0 && path.z < maze.height;

        // Check if path has already been visited
        let unvisited = false;
        if (xIsInBounds && zIsInBounds) {
            unvisited = !math.subset(visitedMatrix, math.index(path.x, Math.floor(path.z)));
        }

        // Check if path is blocked by a wall
        let accessible = true;
        if (difference.x !== 0) {
            let index;
            if (difference.x === -1) {
                index = path.x + 1;
            } else {
                index = path.x;
            }

            let planeInTheWay = maze.verticalPlanes[path.z - zOffset][index];
            if (planeInTheWay) {
                accessible = false;
            }
        } else if (difference.z !== 0) {
            let index;
            if (difference.z === -1) {
                index = path.z + zOffset;
            } else {
                index = path.z - zOffset;
            }

            let planeInTheWay = maze.horizontalPlanes[index][path.x];
            if (planeInTheWay) {
                accessible = false;
            }
        }

        if (xIsInBounds && zIsInBounds && unvisited && accessible) {
            viablePositions.push(path);
        }
    }

    return viablePositions;
}

function getViablePositionsForRat(maze, position) {
    let viablePositions = [];
    let differenceArray = [
        {x: -1, z:  0},
        {x:  1, z:  0},
        {x:  0, z: -1},
        {x:  0, z:  1},
    ];

    for (const difference of differenceArray) {
        let path = {
            x: Math.round(position.x) + difference.x,
            y: position.y,
            z: Math.floor(position.z) + zOffset + difference.z,
        };

        // Check if path is within bounds of the maze
        let xIsInBounds = path.x >= 0 && path.x < maze.width;
        let zIsInBounds = path.z >= 0 && path.z < maze.height;

        // Check if path is blocked by a wall
        let accessible = true;
        if (difference.x !== 0) {
            let index;
            if (difference.x === -1) {
                index = path.x + 1;
            } else {
                index = path.x;
            }

            let planeInTheWay = maze.verticalPlanes[path.z - zOffset][index];
            if (planeInTheWay) {
                accessible = false;
            }
        } else if (difference.z !== 0) {
            let index;
            if (difference.z === -1) {
                index = path.z + zOffset;
            } else {
                index = path.z - zOffset;
            }

            let planeInTheWay = maze.horizontalPlanes[index][path.x];
            if (planeInTheWay) {
                accessible = false;
            }
        }

        if (xIsInBounds && zIsInBounds && unvisited && accessible) {
            viablePositions.push(path);
        }
    }

    return viablePositions;
}

main();

