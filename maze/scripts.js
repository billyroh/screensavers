// Overall structure
// - Generate maze
// - Render planes based on walls
// - 

function main() {
    const height = 10;
    const width = 10;
    let maze = generateMaze(width, height);
    // renderPlane(maze);
    renderMaze(maze);
    // let globalWrapper = document.querySelector('a-entity#plane-wrapper');
    // let plane = document.createElement('a-plane');
    // plane.setAttribute('width', width);
    // plane.setAttribute('height', height);
    // plane.setAttribute('color', 'white');
    // plane.setAttribute('position', `${width}, ${height}, 0`);
    // globalWrapper.append(plane);
    console.log(maze);
    console.log(displayMaze(maze));
}

function renderPlane(maze) {
    let horizontalOpeningArray = maze.horiz;
    let verticalOpeningArray = maze.verti;
    let globalWrapper = document.querySelector('a-entity#plane-wrapper');

    for (let x = 0; x < maze.x; x++) {
        for (let y = 0; y < maze.y; y++) {
            let dot = document.createElement('a-sphere');
            dot.setAttribute('radius', '0.1');
            dot.setAttribute('color', `hsla(${x * 20}, 50%, ${y * 10}%), 1`);
            dot.setAttribute('position', `${x} 0 ${y}`)
            globalWrapper.append(dot)
        }
    }

    // plane.setAttribute('material', 'side: double; shader: flat; src: #brick');
    
    horizontalOpeningArray.forEach((openingArray, yIndex) => {
        // console.log(openingArray);
        let rowWrapper = document.createElement('a-entity');
        globalWrapper.append(rowWrapper);
        for (let xIndex = 0; xIndex < openingArray.length - 1; xIndex++) {
            let opening = openingArray[xIndex];
            let renderPlane = !opening;
            if (renderPlane) {
                let box = document.createElement('a-box');
                box.setAttribute('width', 0.5);
                box.setAttribute('height', 0.5);
                box.setAttribute('depth', 0.5);
                box.setAttribute('position', `${yIndex} 0 ${xIndex}`);
                rowWrapper.append(box);
            }
        }
    });
}

main();