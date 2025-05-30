// ---------------------------------------
//        ~ FPS Script ~
//        
//        A 2.5d FPS game
// ---------------------------------------

const debug = true;

const canvas = document.getElementById("canvas")
const pen = canvas.getContext("2d");

const wallTexture1 = new Image();
wallTexture1.src = "textures/walls/wallTexture1.png"

const width = canvas.width;
const height = canvas.height;

const fps = 30;

const layout = [
    1, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 2, 0, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 2, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 1, 0, 0,
]

const layoutWidth = 10;

const tileSize = 64;

const mapSize = tileSize * layoutWidth;

const player = {
    x: 100,
    y: 100,
    angle: 0,
    fov: Math.PI / 3
}

function getTile(x, y) {
    return (Math.floor(x / tileSize) + Math.floor(y / tileSize) * layoutWidth)
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

    const stepSize = 1;
    let distance = 0;

    let hitX = 0;
    let hitY = 0;
    let hitVertical = false;
    let mapValue = 0;
    let side = '';

    while (distance < 1000) {
        const rayX = player.x + cos * distance;
        const rayY = player.y + sin * distance;

        const tileX = Math.floor(rayX / tileSize);
        const tileY = Math.floor(rayY / tileSize);

        if (
            tileX < 0 || tileX >= layoutWidth ||
            tileY < 0 || tileY >= layoutWidth
        ) {
            break;
        }

        mapValue = atMap(tileX, tileY);
        if (mapValue !== 0) {
            hitX = rayX;
            hitY = rayY;

            if (Math.abs(cos) > Math.abs(sin)) {
                // Vertical wall (E or W)
                side = cos > 0 ? 'E' : 'W';
            } else {
                // Horizontal wall (N or S)
                side = sin > 0 ? 'S' : 'N';
            }
            break;
        }

        distance += stepSize;
    }

    return {
        distance,
        at: mapValue,
        hitX,
        hitY,
        side
    };
}

// raycasting or light emulator
function lightRay() {
    const stepAngle = player.fov / canvas.width;

    for (let i = 0; i < canvas.width; i++) {
        const rayAngle = player.angle - (player.fov / 2) + i * stepAngle;
        
        const singleRay = castSingleRay(rayAngle);

        const distance = singleRay.distance;
        const wallHeight = (tileSize * 320) / distance;
        
        const light = Math.min(tileSize * 100/distance, 100);

        let texture = wallTexture1;
        let hitOffset;

        pen.filter = 'brightness(' + light + '%)'

        if (i % 2) hitOffset = singleRay.hitY % tileSize;
        else hitOffset = singleRay.hitX % tileSize;

        const sliceWidth = 3; // Instead of 1

        if (singleRay.side == 'W' || singleRay.side == 'N') {
            pen.drawImage(
                texture,
                Math.floor((hitOffset / tileSize) * texture.width) + sliceWidth, 0,
                1, texture.height,
                i + sliceWidth, (canvas.height / 2) - (wallHeight / 2),
                sliceWidth, wallHeight
            );
        }
        else {
            pen.drawImage(
                texture,
                Math.floor((hitOffset / tileSize) * texture.width) - sliceWidth, 0,
                1, texture.height,
                i + sliceWidth, (canvas.height / 2) - (wallHeight / 2),
                sliceWidth, wallHeight
            );
        }

        pen.filter = 'none';
        //i += sliceWidth - 1; // Skip ahead so you don’t draw overlapping columns


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
        (layout[getTile(xNext, yNext)] === 0)
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
        if (layout[i] != 0) {
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

    if (debug) {
        miniMap();
        //console.log(player.x, player.y, player.angle)
    }

}, 1000 / fps);

// ---------------------------------------
//          End of Game Loop
// ---------------------------------------