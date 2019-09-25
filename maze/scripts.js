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
const animationDelayBuffer = 250;

// Keep track of...
// - pathHistoryArray: The path you took to get to the current position, so you can retrace your steps
// - visitedMatrix: Positions you've been to
let pathHistoryArray = [];
let visitedMatrix = math.zeros(mazeWidth, mazeHeight);

let goalPosition, icoPosition, octaPosition;
let goalReached = false;

async function main() {
    let maze = generateMazeData(mazeWidth, mazeHeight);
    console.log(maze);
    await renderMaze(maze);
    await initializeMazeEntities();
    while (!goalReached) {
        await traverseMaze(maze);
    }
    await cleanUp();
    main();
}

async function renderMaze(maze) {
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

async function traverseMaze(maze) {
    let cameraPosition = getCameraPosition();
    let viablePositions = getViablePositions(maze, visitedMatrix, cameraPosition);

    pathHistoryArray.push(Object.assign({}, cameraPosition));
    visitedMatrix.subset(math.index(cameraPosition.x, Math.floor(cameraPosition.z)), 1);

    // Goal reached
    if (false && cameraPositionIsEqualTo(goalPosition)) {
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

    let ico = document.querySelector('a-icosahedron');
    let icoIsVisible = ico.getAttribute('visible');
    let octa = document.querySelector('a-octahedron');
    let octaIsVisible = octa.getAttribute('visible');

    // Ico reached
    if (cameraPositionIsEqualTo(icoPosition) && icoIsVisible) {
        camera.setAttribute('animation__rotation_z',`
            property: rotation.z;
            to: 180;
            dur: ${animationDelay};
            easing: linear;
        `);
        ico.setAttribute('visible', 'false');
        octa.setAttribute('visible', 'true');

        console.log('ico', camera.getAttribute('rotation'));
        return new Promise(resolve => {
            setTimeout(resolve, animationDelay * 2);
        })
    }

    // Octa reached
    if (cameraPositionIsEqualTo(octaPosition) && octaIsVisible) {
        camera.setAttribute('animation__rotation_z',`
            property: rotation.z;
            to: 0;
            dur: ${animationDelay};
            easing: linear;
        `);
        octa.setAttribute('visible', 'false');

        console.log('octa', camera.getAttribute('rotation'));
        return new Promise(resolve => {
            setTimeout(resolve, animationDelay * 2);
        })
    }
    
    // TODO this block seems to be buggy when flipping the camera
    // Hit a deadend; backtrack
    if (viablePositions.length === 0) {
        pathHistoryArray.pop(); // Discard the latest
        let previousPosition = pathHistoryArray.pop();
        let yRotation = getCameraYRotation(previousPosition);


        camera.setAttribute('animation__position',`
            property: position;
            to: ${previousPosition.x} ${previousPosition.y} ${previousPosition.z};
            dur: ${animationDelay};
            easing: linear;
        `);

        console.log('yRotation', yRotation);
        console.log('backtracking pt. 1', camera.getAttribute('rotation'));
        let zRotation = '0';
        if (!icoIsVisible && !octaIsVisible) {
            zRotation = '0';
        } else if (!icoIsVisible) {
            zRotation = '180';
        } else {
            zRotation = '0';
        }

        camera.setAttribute('animation__rotation_y',`
            property: rotation;
            to: 0 ${yRotation} ${zRotation};
            dur: ${animationDelay};
            easing: linear;
        `);

        if (!icoIsVisible && !octaIsVisible) {
            console.log('both invisible');
            camera.setAttribute('rotation.z', '0');
        } else if (!icoIsVisible) {
            console.log('should be upside down');
            camera.setAttribute('rotation.z', '180');
        } else {
            console.log('base case');
            camera.setAttribute('rotation.z', '0');
        }

        console.log('backtracking pt. 2', camera.getAttribute('rotation'));
    
    // Traverse towards an unvisited position
    } else {
        let newPosition = _.sample(viablePositions);
        let yRotation = getCameraYRotation(newPosition);

        camera.setAttribute('animation__position',`
            property: position;
            to: ${newPosition.x} ${newPosition.y} ${newPosition.z};
            dur: ${animationDelay};
            easing: linear;
        `);

        console.log('yRotation', yRotation);
        console.log('new position pt. 1', camera.getAttribute('rotation'));
        let zRotation = '0';
        if (!icoIsVisible && !octaIsVisible) {
            zRotation = '0';
        } else if (!icoIsVisible) {
            zRotation = '180';
        } else {
            zRotation = '0';
        }

        camera.setAttribute('animation__rotation_y',`
            property: rotation;
            to: 0 ${yRotation} ${zRotation};
            dur: ${animationDelay};
            easing: linear;
        `);

        console.log('new position pt. 2', camera.getAttribute('rotation'));
    }

    return new Promise(resolve => {
        setTimeout(resolve, animationDelay)
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

function cameraPositionIsEqualTo(position) {
    let cameraPosition = getCameraPosition();
    return cameraPosition.x === position.x && cameraPosition.z === position.z;
}

async function initializeMazeEntities() {
    let x, z, position;
    let y = planeHeight / 2;
    let positionArray = [];

    for (let x = 0; x < mazeWidth; x++) {
        for (let z = 0; z < mazeHeight; z++) {
            positionArray.push({ x, z })
        }
    }
    positionArray = _.shuffle(positionArray);

    // Camera
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    camera.setAttribute('position', `${x} ${y} ${z}`);
    camera.setAttribute('rotation', `0 0 0`);

    // Goal
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    let goal = document.createElement('a-sphere');
    goal.setAttribute('color', 'red');
    goal.setAttribute('radius', 0.1);
    goal.setAttribute('position', `${x} ${y} ${z}`);
    entityWrapper.append(goal);
    goalPosition = { x, y, z };

    // Icosahedron (aka 20-sided die)
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    let ico = document.createElement('a-icosahedron')
    ico.setAttribute('color', 'grey')
    ico.setAttribute('radius', 0.1);
    ico.setAttribute('position', `${x} ${y} ${z}`);
    ico.setAttribute('material', `metalness: 0.3`);
    ico.setAttribute('animation',`
        property: rotation;
        to: 180 180 180;
        dur: ${animationDelay};
        easing: linear;
        loop: true;
    `);
    entityWrapper.append(ico);
    icoPosition = { x, y, z };

    // Octahedron
    position = positionArray.pop();
    x = position.x;
    z = position.z + zOffset;
    let octa = document.createElement('a-octahedron');
    octa.setAttribute('color', 'grey')
    octa.setAttribute('radius', 0.1);
    octa.setAttribute('position', `${x} ${y} ${z}`);
    octa.setAttribute('visible', false);
    octa.setAttribute('material', `metalness: 0.3`);
    octa.setAttribute('animation',`
        property: rotation;
        to: 180 180 180;
        dur: ${animationDelay};
        easing: linear;
        loop: true;
    `);
    entityWrapper.append(octa);
    octaPosition = { x, y, z };
    
    return new Promise(resolve => {
        setTimeout(resolve, animationDelay * 2)
    });
}

function getCameraYRotation(newPosition) {
    let currentPosition = getCameraPosition();
    let currentZRotation = 0;
    if (camera.getAttribute('rotation').z > 100) {
        currentZRotation = 180;
    }
    
    let difference = {
        x: currentPosition.x - newPosition.x,
        z: currentPosition.z - newPosition.z,
    };

    if (difference.z === -1) {
        return '180';
    } else if (difference.z === 1) {
        return '0';
    } else if (difference.x === -1) {
        return '-90';
    } else if (difference.x === 1) {
        return '90';
    } else {
        return '0';
    }
}

function setCameraRotation(newPosition) {
    let currentPosition = getCameraPosition();
    let value;
    
    let difference = {
        x: currentPosition.x - newPosition.x,
        z: currentPosition.z - newPosition.z,
    };

    if (difference.z === -1) {
        value = '180';
    } else if (difference.z === 1) {
        value = '0';
    } else if (difference.x === -1) {
        value = '-90';
    } else if (difference.x === 1) {
        value = '90';
    }

    camera.setAttribute('animation__rotation_y',`
        property: rotation.y;
        to: ${value};
        dur: ${animationDelay};
        easing: linear;
    `);
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
    ]

    for (const difference of differenceArray) {
        let path = {
            x: position.x + difference.x,
            y: position.y,
            z: position.z + difference.z,
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

let globalWapper = document.querySelector('a-entity#global-wrapper');
globalWapper.setAttribute('position', `${mazeWidth / -2 + zOffset} 0 ${mazeHeight / -2}`);
renderFloorAndCeiling(mazeWidth, mazeHeight);
main();
