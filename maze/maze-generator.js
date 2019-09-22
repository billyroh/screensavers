// Source: https://rosettacode.org/wiki/Maze_generation#JavaScript

function generateMaze(x,y) {
	var n=x*y-1;
	if (n<0) {alert("illegal maze dimensions");return;}
	var horiz =[]; for (var j= 0; j<x+1; j++) horiz[j]= [],
	    verti =[]; for (var j= 0; j<x+1; j++) verti[j]= [],
	    here = [Math.floor(Math.random()*x), Math.floor(Math.random()*y)],
	    path = [here],
	    unvisited = [];
	for (var j = 0; j<x+2; j++) {
		unvisited[j] = [];
		for (var k= 0; k<y+1; k++)
			unvisited[j].push(j>0 && j<x+1 && k>0 && (j != here[0]+1 || k != here[1]+1));
	}
	while (0<n) {
		var potential = [[here[0]+1, here[1]], [here[0],here[1]+1],
		    [here[0]-1, here[1]], [here[0],here[1]-1]];
		var neighbors = [];
		for (var j = 0; j < 4; j++)
			if (unvisited[potential[j][0]+1][potential[j][1]+1])
				neighbors.push(potential[j]);
		if (neighbors.length) {
			n = n-1;
			next= neighbors[Math.floor(Math.random()*neighbors.length)];
			unvisited[next[0]+1][next[1]+1]= false;
			if (next[0] == here[0])
				horiz[next[0]][(next[1]+here[1]-1)/2]= true;
			else 
				verti[(next[0]+here[0]-1)/2][next[1]]= true;
			path.push(here = next);
		} else 
			here = path.pop();
	}
	return {x: x, y: y, horiz: horiz, verti: verti};
}
 
function displayMaze(m) {
	var text= [];
	for (var j= 0; j<m.x*2+1; j++) {
		var line= [];
		if (0 == j%2)
			for (var k=0; k<m.y*4+1; k++)
				if (0 == k%4) 
					line[k]= '+';
				else
					if (j>0 && m.verti[j/2-1][Math.floor(k/4)])
						line[k]= ' ';
					else
						line[k]= '-';
		else
			for (var k=0; k<m.y*4+1; k++)
				if (0 == k%4)
					if (k>0 && m.horiz[(j-1)/2][k/4-1])
						line[k]= ' ';
					else
						line[k]= '|';
				else
					line[k]= ' ';
		if (0 == j) line[1]= line[2]= line[3]= '-';
		if (m.x*2-1 == j) line[4*m.y]= '|';
		text.push(line.join('')+'\r\n');
	}
	return text.join('');
}

function renderMaze(m) {
	var text= [];
	let globalWrapper = document.querySelector('a-entity#plane-wrapper');
	let horizontalPlanes = [];
	for (var j= 0; j<m.x*2+1; j++) {
		var line= [];
		if (0 == j%2) {
			let row = [];
			for (var k=0; k<m.y*4+1; k++) {
				if (0 == k%4) {
					line[k]= '+';
					let box = document.createElement('a-box');
					box.setAttribute('width', 0.5);
					box.setAttribute('height', 0.5);
					box.setAttribute('depth', 0.5);
					box.setAttribute('position', `${k} 0 ${j}`);
					globalWrapper.append(box);
				}
				else {
					if (j>0 && m.verti[j/2-1][Math.floor(k/4)]) {
						line[k]= ' ';
					}
					else {
						// Use j as the z-axis value
						// Use k as the x-axis value
						line[k]= '-';
						let box = document.createElement('a-box');
						box.setAttribute('width', 0.5);
						box.setAttribute('height', 0.5);
						box.setAttribute('depth', 0.5);
						box.setAttribute('position', `${k} 0 ${j}`);
						box.setAttribute('color', 'red');
						globalWrapper.append(box);
					}
				}
			}
			horizontalPlanes.push(row);
			parseLine(line);
		} else {
			for (var k=0; k<m.y*4+1; k++)
				if (0 == k%4)
					if (k>0 && m.horiz[(j-1)/2][k/4-1]) {
						line[k]= ' ';
					} else {
						line[k]= '|';
					}
				else
					line[k]= ' ';
		}
		if (0 == j) line[1]= line[2]= line[3]= '-';
		if (m.x*2-1 == j) line[4*m.y]= '|';
		text.push(line.join('')+'\r\n');
	}
	console.log(horizontalPlanes);
	return text.join('');
}

function parseLine(line) {
	let result = [];
	// console.log('line', line);
	for (let i = 0; i < line.length - 4; i += 4) {
		let first = line[i + 1] === '-';
		let second = line[i + 2] === '-';
		let third = line[i + 3] === '-';
		if (first && second && third) {
			result.push(true);
		} else {
			result.push(false)
		}
	}
	console.log(result);
}