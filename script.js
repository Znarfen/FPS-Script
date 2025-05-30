// ---------------------------------------
//        ~ FPS Script ~
//        
//        A 2.5d FPS game
// ---------------------------------------

const canvas = document.getElementById("canvas")
const pen = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const fps = 30;

const layout = [
    1, 0, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 1,
]

const layoutWidth = 8;

const tileSize = 64;

const mapSize = tileSize * layoutWidth;

const player = {
    x: 100,
    y: 100,
    angle: 0,
    fov: Math.PI / 3
}

function atMap(x, y) {
    return layout[y * layoutWidth + x];
}

// ---------------------------------------
//          Ray Traising
// ---------------------------------------

function castSingleRay(rayAngle) {
  const sin = Math.sin(rayAngle);
  const cos = Math.cos(rayAngle);

  let distance = 0;
  let hit = false;

  while (!hit && distance < 1000) {
    distance += 1;

    const testX = Math.floor((player.x + cos * distance) / tileSize);
    const testY = Math.floor((player.y + sin * distance) / tileSize);

    // Check if out of bounds
    if (testX < 0 || testX >= layoutWidth || testY < 0 || testY >= layoutWidth) {
      hit = true;
      //distance = 0;
    } else if (atMap(testX, testY) === 1) {
      hit = true;
    }
  }

  return distance;
}

// raycasting or light sim
function lightRay() {
    const stepAngle = player.fov / canvas.width;
    const lightning = 3000;

    for (let i = 0; i < canvas.width; i++) {
        const rayAngle = player.angle - (player.fov / 2) + i * stepAngle;

        const distance = castSingleRay(rayAngle);
        const wallHeight = (tileSize * 320) / distance;

        pen.fillStyle = 'rgb(' + lightning / distance + ',' + lightning / distance + ',' + lightning / distance + ')'
        pen.fillRect(i, (canvas.height / 2) - (wallHeight / 2), 1, wallHeight)
    }
}

// ---------------------------------------
//          End of Ray Traising
// ---------------------------------------



// ---------------------------------------
//          Player movment
// ---------------------------------------

function move(x, y) {
    let xNext = player.x + x;
    let yNext = player.y + y;

    if (
        (xNext > 0 && yNext > 0 && xNext < mapSize && yNext < mapSize) && // <- check out of bounds
        (true)
    ) {
        player.x = xNext;
        player.y = yNext;
    }
}

// Mouse poiner locked at screan
canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});

// Change direction with mouse
document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas) {
        const sensitivity = 0.002; // adjust for speed
        player.angle += e.movementX * sensitivity;
    }
});

// Move player with wasd
document.addEventListener('keydown', e => {
    const speed = 3;

    switch (e.key) {
        case 'w':
            move(+Math.cos(player.angle) * speed, +Math.sin(player.angle) * speed);
            break;

        case 's':
            move(-Math.cos(player.angle) * speed, -Math.sin(player.angle) * speed);
            break;
    
        case 'a':
            move(+Math.sin(player.angle) * speed, -Math.cos(player.angle) * speed);
            break;

        case 'd':
            move(-Math.sin(player.angle) * speed, +Math.cos(player.angle) * speed);
            break;

        default:
            break;
    }
});

// ---------------------------------------
//          End of Player movment
// ---------------------------------------



// ---------------------------------------
//          Mini-Map
// ---------------------------------------

function miniMap() {

    const scale = 5;

    pen.fillStyle = 'rgb(255, 255, 255)';
    pen.fillRect(0, 0, layoutWidth * scale, layoutWidth * scale);
    
    // Draw walls
    pen.fillStyle = 'black';
    for (let i = 0; i < layout.length; i++) {
        if (layout[i] === 1) {
            pen.fillRect(
                (i % layoutWidth) * scale,
                Math.floor(i / layoutWidth) * scale,
                scale, scale);
        }
    }

    // Draw player as a small rectangle on the minimap
    pen.fillStyle = 'rgb(119, 0, 0)';
    pen.fillRect(
        (player.x / tileSize) * scale - 1,
        (player.y / tileSize) * scale - 1,
        2, 2
    );
}

// ---------------------------------------
//          End of Mini-Map
// ---------------------------------------



// ---------------------------------------
//          Game Loop
// ---------------------------------------

setInterval(() => {
    pen.fillStyle = 'rgb(0, 0, 0)'
    pen.fillRect(0, 0, width, height)
    
    

    lightRay();

    miniMap();

    console.log(player.x, player.y, player.angle)

}, 1000 / fps);

// ---------------------------------------
//          End of Game Loop
// ---------------------------------------