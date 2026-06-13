const GRID_SIZE = 15;
const COST_EMPTY = 1;
const COST_BLACK_HOLE = 10;

// 0: Vazio, 1: Obstáculo, 2: Buraco Negro
const mapData = [
    [0,0,0,1,0,0,0,0,0,0,2,2,0,0,0],
    [0,0,0,1,0,0,2,2,0,0,2,2,0,0,0],
    [0,2,2,1,0,0,2,2,0,0,0,0,0,0,0],
    [0,2,2,1,0,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,2,2,2,0,0,0,0,0,0,1,0,0,0],
    [0,0,2,2,2,0,0,1,1,1,1,1,0,2,2],
    [0,1,1,1,1,0,0,1,0,0,0,0,0,2,2],
    [0,0,0,0,0,0,0,1,0,2,2,0,0,0,0],
    [2,2,2,0,1,1,1,1,0,2,2,0,0,0,0],
    [2,2,2,0,0,0,0,0,0,0,0,0,1,1,0],
    [0,0,0,0,2,2,2,0,1,1,1,1,1,0,0],
    [0,1,1,1,1,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,2,2,2,2,0],
    [0,0,0,0,0,0,0,0,0,0,2,2,2,2,0]
];

const START = {x: 0, y: 0};
const END = {x: 14, y: 14};

// Inicializa grid
function initGrid() {
    const gridEl = document.getElementById('grid');
    gridEl.innerHTML = '';
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${y}-${x}`;
            
            if (x === START.x && y === START.y) {
                cell.classList.add('start');
            } else if (x === END.x && y === END.y) {
                cell.classList.add('end');
            } else {
                const type = mapData[y][x];
                if (type === 0) cell.classList.add('empty');
                else if (type === 1) cell.classList.add('asteroid');
                else if (type === 2) cell.classList.add('blackhole');
            }
            
            gridEl.appendChild(cell);
        }
    }
}

class Node {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }
}

function getNeighbors(node) {
    const neighbors = [];
    const dirs = [[0,1], [1,0], [0,-1], [-1,0]]; // Direções
    
    for (let d of dirs) {
        let nx = node.x + d[0];
        let ny = node.y + d[1];
        
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            let type = mapData[ny][nx];
            if (type !== 1) { // Evita obstáculo
                neighbors.push(new Node(nx, ny, type));
            }
        }
    }
    return neighbors;
}

function getCost(type) {
    return type === 2 ? COST_BLACK_HOLE : COST_EMPTY;
}

function getHeuristic(x, y, type) {
    // Euclidiana
    let dist = Math.sqrt(Math.pow(x - END.x, 2) + Math.pow(y - END.y, 2));
    return type === 'strong' ? dist : dist * 0.1; // Heurística fraca
}

function searchAlgorithm(algo, hType) {
    let openSet = [];
    let closedSet = [];
    let startNode = new Node(START.x, START.y, mapData[START.y][START.x]);
    
    openSet.push(startNode);
    let nodesExpanded = 0;

    while (openSet.length > 0) {
        // Menor f
        let lowestIdx = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIdx].f) {
                lowestIdx = i;
            }
        }
        
        let current = openSet[lowestIdx];

        // Chegou ao fim
        if (current.x === END.x && current.y === END.y) {
            let path = [];
            let temp = current;
            let totalCost = current.g;
            
            while (temp.parent) {
                path.push({x: temp.x, y: temp.y});
                temp = temp.parent;
            }
            return { path: path.reverse(), expanded: nodesExpanded, cost: totalCost, closed: closedSet };
        }

        openSet.splice(lowestIdx, 1);
        closedSet.push(`${current.x},${current.y}`);
        nodesExpanded++;

        let neighbors = getNeighbors(current);
        
        for (let n of neighbors) {
            if (closedSet.includes(`${n.x},${n.y}`)) continue;

            let tentative_g = current.g + getCost(n.type);
            let existingNode = openSet.find(node => node.x === n.x && node.y === n.y);

            if (algo === 'greedy') {
                // Gulosa
                if (!existingNode) {
                    n.parent = current;
                    n.g = tentative_g; // Guarda g
                    n.h = getHeuristic(n.x, n.y, hType);
                    n.f = n.h;
                    openSet.push(n);
                }
            } else {
                // A*
                if (!existingNode) {
                    n.parent = current;
                    n.g = tentative_g;
                    n.h = getHeuristic(n.x, n.y, hType);
                    n.f = n.g + n.h;
                    openSet.push(n);
                } else if (tentative_g < existingNode.g) {
                    existingNode.parent = current;
                    existingNode.g = tentative_g;
                    existingNode.f = existingNode.g + existingNode.h;
                }
            }
        }
    }
    return { path: [], expanded: nodesExpanded, cost: 0, closed: closedSet };
}

let isRunning = false;

async function runSimulation(algo, hType) {
    if (isRunning) return;
    isRunning = true;
    
    // Bloqueia botões
    document.querySelectorAll('button').forEach(b => b.disabled = true);
    
    // Limpa grid
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('explored', 'path'));
    document.getElementById('cost').innerText = '...';
    document.getElementById('expanded').innerText = '...';
    document.getElementById('time').innerText = '-';
    
    const algoName = algo === 'astar' ? 'Busca A*' : 'Busca Gulosa';
    const hName = hType === 'strong' ? 'Heurística Forte' : 'Heurística Fraca';
    document.getElementById('current-execution').innerText = `Executando: ${algoName} (${hName})`;

    // Mede tempo
    const startTime = performance.now();
    const result = searchAlgorithm(algo, hType);

    // Anima busca
    for (let i = 0; i < result.closed.length; i++) {
        let [x, y] = result.closed[i].split(',').map(Number);
        if ((x===START.x && y===START.y) || (x===END.x && y===END.y)) continue;
        
        let cell = document.getElementById(`cell-${y}-${x}`);
        if (cell) cell.classList.add('explored');
        
        if (i % 3 === 0) await new Promise(r => setTimeout(r, 1)); // Delay visual
    }

    // Anima caminho
    for (let i = 0; i < result.path.length; i++) {
        let p = result.path[i];
        if ((p.x===START.x && p.y===START.y) || (p.x===END.x && p.y===END.y)) continue;
        
        let cell = document.getElementById(`cell-${p.y}-${p.x}`);
        if (cell) cell.classList.add('path');
        
        await new Promise(r => setTimeout(r, 30)); // Delay visual
    }

    const endTime = performance.now();
    const timeTaken = (endTime - startTime).toFixed(2);

    // Atualiza UI
    document.getElementById('cost').innerText = result.cost;
    document.getElementById('expanded').innerText = result.expanded;
    document.getElementById('time').innerText = timeTaken;

    // Libera botões
    document.querySelectorAll('button').forEach(b => b.disabled = false);
    isRunning = false;
}

// Inicializa
initGrid();
