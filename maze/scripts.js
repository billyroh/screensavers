// Overall structure
// - Generate maze
// - Render planes based on walls

function main() {
    const height = 10;
    const width = 10;
    let maze = generateMazeData(width, height);
    renderMaze(maze);
    traverseMaze(maze);

    console.log(maze);
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
                let height = 0.5;
                plane.setAttribute('width', 1);
                plane.setAttribute('height', height);
                plane.setAttribute('position', `${j} ${height / 2} ${i}`);

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
                let height = 0.5;
                plane.setAttribute('width', 1);
                plane.setAttribute('height', height);
                plane.setAttribute('position', `${j - 0.5} ${height / 2} ${i + 0.5}`);
                plane.setAttribute('material', 'side: double; src: #brick; shader: flat');
                plane.setAttribute('rotation', '0 90 0')
                mazeWrapper.append(plane);
            }
        })
    })
}

function traverseMaze(maze) {
    // Randomly place camera in maze
    let camera = document.querySelector('a-camera');
    let planeHeight = 0.5;
    camera.setAttribute('position', `${_.random(1, maze.width - 1)} ${planeHeight / 2} ${_.random(1, maze.height - 1)}`);

    // Keep track of...
    // - pathHistoryArray: The path you took to get to the current position, so you can retrace your steps
    // - unexploredPathArray: Positions you've been to, where there were unexplored adjacent paths
    // - visitedMatrix: Positions you've been to
    let pathHistoryArray = [];
    let unexploredPathArray = [];
    let visitedMatrix = math.zeros(maze.width, maze.height);

    let cameraPosition = camera.getAttribute('position');
    pathHistoryArray.push(cameraPosition);
    unexploredPathArray.push(cameraPosition);
    visitedMatrix.subset(math.index(cameraPosition.x, cameraPosition.z), 1);

    let viablePaths = getViablePaths(maze, visitedMatrix, cameraPosition);

    console.log(pathHistoryArray);

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

async function getPosition(entity) {
    return new Promise(() => {
    setTimeout(entity.getAttribute('position'), 0);
    });
}

function renderFloorAndCeiling(width, height) {
    let wrapper = document.querySelector('a-entity#global-wrapper');
    
    let floor = document.createElement('a-plane');
    floor.setAttribute('width', width);
    floor.setAttribute('height', height);
    floor.setAttribute('material', `side: double; src: #floor; shader: flat ; repeat: ${width * 5} ${height * 5}`);
    floor.setAttribute('rotation', '90 0 0');
    floor.setAttribute('position', '4.5 0 5');

    let ceiling = document.createElement('a-plane');
    ceiling.setAttribute('width', width);
    ceiling.setAttribute('height', height);
    ceiling.setAttribute('material', `side: double; src: #ceiling; shader: flat ; repeat: ${width * 5} ${height * 5}`);
    ceiling.setAttribute('rotation', '90 0 0');
    ceiling.setAttribute('position', '4.5 0.5 5');

    wrapper.append(floor);
    wrapper.append(ceiling);
}

function getViablePaths(maze, visitedMatrix, position) {
    let viablePaths = [];
    let differenceArray = [
        {x: -1, z:  0},
        {x:  1, z:  0},
        {x:  0, z: -1},
        {x:  0, z:  1},
    ]

    console.log(position);

    for (const difference of differenceArray) {
        let path = {
            x: position.x + difference.x,
            y: position.y,
            z: position.z + difference.z,
        };

        console.log(path);

        let xIsInBounds = path.x >= 0 && path.x < maze.width - 1;
        let zIsInBounds = path.z >= 0 && path.z < maze.height - 1;

        if (xIsInBounds && zIsInBounds) {
            let unvisited = !math.subset(visitedMatrix, math.index(path.x, path.z));
            if (unvisited) {
                viablePaths.push(path);
            }
        }
    }

    // 1. Get array of four adjacent positions
    //   - Use maze.width, maze.height to make sure you're not going out of bounds
    // 2. Filter out adjacent positions that have already been visited using visited Matrix
    // 3. Return result

    console.log('viablePaths', viablePaths);

    return viablePaths;
}

main();

