// Overall structure
// - Generate maze
// - Render planes based on walls

const mazeHeight = 4;
const mazeWidth = 4;
const zOffset = 0.5;
const planeHeight = 0.5;
const camera = document.querySelector('a-entity#camera-wrapper');
const animationDelay = 750;
const animationDelayBuffer = 100;

// Keep track of...
// - pathHistoryArray: The path you took to get to the current position, so you can retrace your steps
// - unexploredPathArray: Positions you've been to, where there were unexplored adjacent paths
// - visitedMatrix: Positions you've been to
let pathHistoryArray = [];
let unexploredPathArray = [];
let visitedMatrix = math.zeros(mazeWidth, mazeHeight);

async function main() {
    let maze = generateMazeData(mazeWidth, mazeHeight);
    renderMaze(maze);
    console.log(maze);
    await initializeCameraPlacement(camera, maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
    await traverseMaze(maze);
}

function renderMaze(maze) {
    renderFloorAndCeiling(maze.width, maze.height);
    renderHorizontalPlanes(maze.horizontalPlanes);
    renderVerticalPlanes(maze.verticalPlanes);
    // Rules
    // - Display start button at the star
    // - Encountering smiley face resets
    // - Encountering 20-sided dice thing flips floor to ceiling
    // - Encountering triangular prism flips it again
    // plus add in renderRat, renderSmileyFace, etc.
    // encountering a smiley 
}

function renderHorizontalPlanes(arrayOfArrays) {
    let mazeWrapper = document.querySelector('a-entity#maze-wrapper');
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

                mazeWrapper.append(plane);
            }
        })
    })
}

function renderVerticalPlanes(arrayOfArrays) {
    let mazeWrapper = document.querySelector('a-entity#maze-wrapper');
    arrayOfArrays.forEach((planeArray, i) => {
        planeArray.forEach((planeExists, j) => {
            if (planeExists) {
                let plane = document.createElement('a-plane');
                plane.setAttribute('width', 1);
                plane.setAttribute('height', planeHeight);
                plane.setAttribute('position', `${j - 0.5} ${planeHeight / 2} ${i + zOffset}`);
                plane.setAttribute('material', 'side: double; src: #brick; shader: flat');
                plane.setAttribute('rotation', '0 90 0')
                mazeWrapper.append(plane);
            }
        })
    })
}

async function traverseMaze(maze) {
    let cameraPosition = camera.getAttribute('position');
    let viablePositions = getViablePositions(maze, visitedMatrix, cameraPosition);

    // TODO may need to move this block into the else block
    // Backtracking is pingpong-ing
    pathHistoryArray.push(Object.assign({}, cameraPosition));
    unexploredPathArray.push(Object.assign({}, cameraPosition));
    visitedMatrix.subset(math.index(cameraPosition.x, Math.floor(cameraPosition.z)), 1);

    console.log('');
    console.log('cameraPosition', cameraPosition);
    console.log('pathHistoryArray', pathHistoryArray);
    
    if (viablePositions.length === 0) {
        console.log('backtracking');
        let previousPosition = pathHistoryArray.pop();
        let newRotation = getCameraRotation(camera, previousPosition);

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
        let newRotation = getCameraRotation(camera, newPosition);

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

async function initializeCameraPlacement(camera, maze) {
    let x = _.random(1, maze.width - 1);
    let y = planeHeight / 2;
    let z = _.random(1, maze.height - 1) + zOffset;

    x = maze.width - 1;
    z = maze.height - 1 + zOffset;

    camera.setAttribute('position', `${x} ${y} ${z}`);

    return new Promise(resolve => {
        setTimeout(resolve, 100)
    });
}

function getCameraRotation(camera, newPosition) {
    let difference = {
        x: camera.getAttribute('position').x - newPosition.x,
        z: camera.getAttribute('position').z - newPosition.z,
    };

    if (difference.z === -1) {
        return '0 -180 0';
    } else if (difference.z === 1) {
        return '0 0 0';
    } else if (difference.x === -1) {
        return '0 -90 0';
    } else if (difference.x === 1) {
        return '0 90 0';
    }
}

function renderFloorAndCeiling(width, height) {
    let wrapper = document.querySelector('a-entity#maze-wrapper');
    
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

    wrapper.append(floor);
    // wrapper.append(ceiling);
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

main();

