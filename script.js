// ---------------------------------------
//        ~ FPS Script ~
//        
//        A 2.5d FPS game
// ---------------------------------------

// ---------------------------------------
//          Game Setup (var)
// ---------------------------------------

const debug = true;

const canvas = document.getElementById("canvas")
const pen = canvas.getContext("2d");
pen.imageSmoothingEnabled = false;

const wallTexture1 = new Image(), wallTexture2 = new Image();
wallTexture1.src = "textures/walls/wallTexture1.png"
wallTexture2.src = "textures/walls/wallTexture2.png"


const width = canvas.width;
const height = canvas.height;

const fps = 30;

const layout = [
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 2, 0, 2, 0, 0, 0,
    0, 0, 0, 0, 2, 0, 2, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 0, 0, 2, 0, 2, 0, 0, 0,
    1, 1, 0, 0, 2, 0, 2, 0, 0, 0,
    1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
]

const layoutWidth = 10;

const tileSize = 64;

const mapSize = tileSize * layoutWidth;

const player = {
    x: 100,
    y: 100,
    angle: 0,
    fov: Math.PI / 3,
    health: 100
}

const entetys = [
    {
        type: "spider",
        x: 350,
        y: 500,
        health: 2,
        hostile: true,
        alive: true
    },
    {
        type: "spider",
        x: 550,
        y: 200,
        health: 2,
        hostile: true,
        alive: true
    }
]

let frameInfo = {
    frame: 0,
    animationFrame: 0,
    pic: 1,
};

// ---------------------------------------
//          End of Game Setup (var)
// ---------------------------------------

function getDistance(entety1, entety2) {
    const dx = entety1.x - entety2.x;
    const dy = entety1.y - entety2.y;
    return distance = Math.sqrt(dx * dx + dy * dy);
}

function getWallTexture(index) {
    const wallTexture = new Image()
    wallTexture.src = "textures/walls/wallTexture" + index + ".png"
    return wallTexture
}

function hitPlayer(dmg, attackLength = 30) {
    if (frameInfo.frame % attackLength == 0) {
        player.health += -dmg;
        pen.fillStyle = 'rgb(255, 0, 0)'
        pen.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function renderEntetys() {
    const entetyTexture = new Image();
    let light;
    
    for (const entety of entetys) {
        if (entety.health <= 0) continue;

        const dx = entety.x - player.x;
        const dy = entety.y - player.y;
        const distance = getDistance(entety, player);

        // Sprite prop.
        let spriteSize = (tileSize * 320) / distance;
        let spriteTop = (canvas.height / 2) - spriteSize / 5;

        entetyTexture.src = "textures/entetys/" + entety.type + "/" + frameInfo.pic + ".png";

        // Movment for entetys and entety behaviour
        const speed = 1;
        switch (entety.type) {
            case 'spider':
                // Move spider towards player
                spriteSize += -20;
                if (distance > 30) {
                    move(entety, (-dx / distance) * speed, (-dy / distance) * speed);
                    light = Math.min(tileSize * 100/distance, 100);
                }
                else {
                    // Bite player
                    hitPlayer(10);
                }
                break;
        
            default:
                break;
        }

        const angle = (Math.atan2(dy, dx) - player.angle) % (Math.PI*2);

        // No render if not see entety
        if (angle < -player.fov / 2 || angle > player.fov / 4) continue;

        // Not see enteties in walls
        const singleRay = castSingleRay(player.angle + angle);
        if (singleRay.distance < distance) continue;

        const screenX = (canvas.width / 2) * (1 + Math.tan(angle) / Math.tan(player.fov / 2));
    
        pen.filter = 'brightness(' + light + '%)'
        pen.drawImage(
            entetyTexture,
            screenX - spriteSize / 2,
            spriteTop,
            spriteSize,
            spriteSize
        );
        pen.filter = 'none';
    };
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

    // render entier scren
    for (let i = 0; i < canvas.width; i++) {
        const rayAngle = player.angle - (player.fov / 2) + i * stepAngle;
        
        const singleRay = castSingleRay(rayAngle);

        const distance = singleRay.distance;
        const wallHeight = (tileSize * 320) / distance;

        if (singleRay.at != 0) {

            let texture = getWallTexture(singleRay.at);
            let hitOffset;

            // fog ish
            pen.filter = 'brightness(' + Math.min(tileSize * 100/distance, 100) + '%)'

            if (i % 2) hitOffset = singleRay.hitY % tileSize;
            else hitOffset = singleRay.hitX % tileSize;

            const sliceWidth = 3;

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

        }
    }
}

// ---------------------------------------
//          End of Ray Traising
// ---------------------------------------

// ---------------------------------------
//          Movment and Events
// ---------------------------------------

function move(entety, x, y) {
    let xNext = entety.x + x;
    let yNext = entety.y + y;

    // Check out of bounds
    if (
        (xNext > 0 && yNext > 0 && xNext < mapSize && yNext < mapSize) &&
        (layout[getTile(xNext, yNext)] === 0)
    ) {
        entety.x = xNext;
        entety.y = yNext;
    }
}

function shoot() {
  let theEnemy = null;
  let closestDistance = Infinity;

  for (const enemy of entetys) {
    if (enemy.health <= 0 || !enemy.hostile) continue;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = getDistance(enemy, player);

    const angleToEnemy = Math.atan2(dy, dx);
    
    let angleDiff = angleToEnemy - player.angle;

    // Check if within a small angle range (aim tolerance)
    if (Math.abs(angleDiff) < 0.1) {
        theEnemy = enemy;
    }
  }

  pen.fillStyle = 'rgb(255, 255, 255)'
  pen.fillRect(0, 0, canvas.width, canvas.height)

  // If hit
  if (theEnemy) {
    theEnemy.health--;
    move(theEnemy, (theEnemy.x - player.x) * 0.3, (theEnemy.y - player.y) * 0.3);
  }
}

canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
  shoot();
});

// Change direction with mouse
document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas) {
        const sensitivity = 0.002;
        player.angle += e.movementX * sensitivity;
        player.angle = (player.angle + Math.PI * 2) % (Math.PI * 2);
    }
});

// Move player with wasd
document.addEventListener('keydown', e => {
    const speed = 3;

    switch (e.key) {
        case 'w':
            move(player, +Math.cos(player.angle) * speed, +Math.sin(player.angle) * speed);
            break;

        case 's':
            move(player, -Math.cos(player.angle) * speed, -Math.sin(player.angle) * speed);
            break;
    
        case 'a':
            move(player, +Math.sin(player.angle) * speed, -Math.cos(player.angle) * speed);
            break;

        case 'd':
            move(player, -Math.sin(player.angle) * speed, +Math.cos(player.angle) * speed);
            break;

        default:
            break;
    }
});

// ---------------------------------------
//          End of Movment
// ---------------------------------------

// ---------------------------------------
//          UI
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

    
    for (const entety of entetys) {
        if (entety.health > 0) pen.fillStyle = 'rgb(18, 150, 16)';
        else pen.fillStyle = 'rgb(150, 16, 16)';

        pen.fillRect(
            (entety.x / tileSize) * scale - 1,
            (entety.y / tileSize) * scale - 1,
            2, 2
        );
    }

    // Draw player as a small rectangle on the minimap
    pen.fillStyle = 'rgb(0, 6, 171)';
    pen.fillRect(
        (player.x / tileSize) * scale - 1,
        (player.y / tileSize) * scale - 1,
        2, 2
    );
}

function userInterface() {
    pen.fillStyle = 'rgb(167, 164, 14)';
    pen.font = "15px Courier";
    pen.fillText("Health: " + player.health, canvas.width - 105, 15);
}
// ---------------------------------------
//          End of UI
// ---------------------------------------



// ---------------------------------------
//          Game Loop
// ---------------------------------------

setInterval(() => {
    if (player.health > 0) {

        pen.fillStyle = 'rgb(0, 0, 0)'
        pen.fillRect(0, 0, width, height)
        frameInfo.frame++;
        frameInfo.animationFrame++;
        if (frameInfo.animationFrame > 4) {
            if (frameInfo.pic == 1) frameInfo.pic = 2;
            else frameInfo.pic = 1;
            frameInfo.animationFrame = 0;
        }

        lightRay();
        renderEntetys();
    
        if (debug) {
            miniMap();
        }
        userInterface();
    }

}, 1000 / fps);

// ---------------------------------------
//          End of Game Loop
// ---------------------------------------