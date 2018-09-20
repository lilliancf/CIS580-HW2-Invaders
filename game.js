// Screen dimensions
const WIDTH = 300
const HEIGHT = 300

// Create the canvas and context
var screen = document.createElement('canvas');
var screenCtx = screen.getContext('2d');
screen.height = HEIGHT;
screen.width = WIDTH;
document.body.appendChild(screen);

// Create the back buffer and context
var backBuffer = document.createElement('canvas');
var backBufferCtx = screen.getContext('2d');
backBuffer.height = HEIGHT;
backBuffer.width = WIDTH;

/* Game state variables */
var start = null;
var currentInput = {
  space: false,
  left: false,
  right: false,
  up: false,
  down: false
}
var priorInput = {
  space: false,
  left: false,
  right: false,
  up: false,
  down: false
}
var lives = 9;
var score = 0;
var lose = false;

/* Player variables */
const PWIDTH = 30;
const PHEIGHT = 30;
var x = (WIDTH/2) - (PWIDTH/2);
var y = HEIGHT-PHEIGHT-10;

/* Bullet variables */
var bullets = [];
var bTimer = 0;
var justFired = false;
const BSIZE = 10;
function Bullet(bx, by, good) {
  this.bx = bx;
  this.by = by;
  if (good) {
    this.color = "#00FFFF"
  }
  else {
    this.color = "#FF0000"
  }
}

/* Enemy variables */
var enemies = [];
const EWIDTH = 30;
const EHEIGHT = 30;
var eBullets = [];
var eTimer = 0;
var ebTimer = 0;
function Enemy(ex, ey, dir, c) {
   this.ex = ex;
   this.ey = ey;
   this.left = dir;
   this.color = c;
 }
/** @function handleKeydown
  * Event handler for keydown events
  * @param {KeyEvent} event - the keydown event
  */
function handleKeydown(event) {
  switch(event.key) {
    case ' ':
      currentInput.space = true;
      break;
    case 'ArrowUp':
    case 'w':
      currentInput.up = true;
      break;
    case 'ArrowDown':
    case 's':
      currentInput.down = true;
      break;
    case 'ArrowLeft':
    case 'a':
      currentInput.left = true;
      break;
    case 'ArrowRight':
    case 'd':
      currentInput.right = true;
      break;
  }
}
// Attach keydown event handler to the window
window.addEventListener('keydown', handleKeydown);
/** @function handleKeyup
  * Event handler for keyup events
  * @param {KeyEvent} event - the keyup event
  */
function handleKeyup(event) {
  switch(event.key) {
    case ' ':
      currentInput.space = false;
      break;
    case 'ArrowUp':
    case 'w':
      currentInput.up = false;
      break;
    case 'ArrowDown':
    case 's':
      currentInput.down = false;
      break;
    case 'ArrowLeft':
    case 'a':
      currentInput.left = false;
      break;
    case 'ArrowRight':
    case 'd':
      currentInput.right = false;
      break;
  }
}
// Attach keyup event handler to the window
window.addEventListener('keyup', handleKeyup);

/** @function loop
  * The main game loop
  * @param {DomHighResTimestamp} timestamp - the current system time,
  * in milliseconds, expressed as a double.
  */
function loop(timestamp) {
  if(!start) start = timestamp;
  var elapsedTime = timestamp - start;
  start = timestamp;
  update(elapsedTime);
  // render into back buffer
  render(backBufferCtx);
  // flip buffers
  screenCtx.drawImage(backBuffer, 0, 0);
  window.requestAnimationFrame(loop);
}

/** @function update
  * Updates the game's state
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function update(elapsedTime) {
  if (!lose) {
    pFireBullet(elapsedTime);
    spawnEnemy(elapsedTime);
    moveEnemy(elapsedTime);
    eFireBullet(elapsedTime);
    movePlayer(elapsedTime);
    moveBullets(elapsedTime);
    checkCollision();
  }
}

/** @function pFireBullet
  * If the player presses space, they fire a bullet.
  * If they hold the spacebars, it will autofire at a slow rate
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function pFireBullet(elapsedTime) {
  if(currentInput.space) {
    if (!justFired || bTimer > 750) {
      bullets.push(new Bullet(x+(PWIDTH/2)-(BSIZE/2),y-BSIZE,true));
      justFired = true;
      bTimer = 0;
    }
    else {
      bTimer += elapsedTime;
    }
  }
  else {
    justFired = false;
  }
}

/** @function eFireBullet
  * At a set interval, a random enemy will spawn a bullet
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function eFireBullet(elapsedTime) {
  if (ebTimer > 1000) {
    var e = Math.floor(Math.random()*enemies.length);
    eBullets.push(new Bullet(enemies[e].ex+(EWIDTH/2)-(BSIZE/2),enemies[e].ey+EHEIGHT+BSIZE,false));
    ebTimer = 0;
  }
  else {
    ebTimer += elapsedTime;
  }
}

/** @function spawnBullet
  * At a set interval, if less than 10 enemies are on-screen,
  * a new enemy for random color will spawn at a random point at the top of the screen
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function spawnEnemy(elapsedTime) {
  if(eTimer > 300) {
    if(enemies.length < 10) {
      var rclr = '#'+Math.random().toString(16).substr(2,6); // random color code from: https://stackoverflow.com/questions/1484506/random-color-generator
      enemies.push(new Enemy(Math.random()*WIDTH, 0, Math.floor(Math.random()*2), rclr));
    }
    eTimer = 0;
  }
  else {
    eTimer += elapsedTime;
  }

}

/** @function moveEnemy
  * Moves the enemies down the screen in a zigzag pattern
  * If they reach the bottom, removes them from the screen and decreases the lives by 1
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function moveEnemy(elapsedTime) {
  for (var i = 0; i < enemies.length; i++) {
    enemies[i].ey += 0.04 * elapsedTime;
    if(enemies[i].left) {
      enemies[i].ex -= 0.02 * elapsedTime;
      if(enemies[i].ex < 0) {
        enemies[i].ex = 0;
        enemies[i].left = false;
      }
    }
    else {
      enemies[i].ex += 0.02 * elapsedTime;
      if(enemies[i].ex > WIDTH - EWIDTH) {
        enemies[i].ex = WIDTH - EWIDTH;
        enemies[i].left = true;
      }
    }
  }
  for (var j = 0; j < enemies.length; j++) {
    if(enemies[j].ey > HEIGHT - 50) {
      lives--;
      enemies.splice(j, 1);
      return;
    }
  }
}

/** @function movePlayer
  * Moves the player left and right based on keyboard input
  * ALso clamps them from going offscreen
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function movePlayer(elapsedTime) {
  if(currentInput.left) {
    x -= 0.1 * elapsedTime;
  }
  if(currentInput.right) {
    x += 0.1 * elapsedTime;
  }
  if (x > WIDTH - PWIDTH) {
    x = WIDTH - PWIDTH;
  }
  else if (x < 0) {
    x = 0;
  }
}

/** @function moveBullets
  * Moves the enemies bullets down and the player bullets up
  * Reomves bullets that have gone off screen
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function moveBullets(elapsedTime) {
  for (var i = 0; i < bullets.length; i++) {
    bullets[i].by -= 0.08 * elapsedTime;
    if(bullets[i].by < 0) {
      bullets.splice(i, 1);
    }
  }
  for (var j = 0; j < eBullets.length; j++) {
    eBullets[j].by += 0.08 * elapsedTime;
    if(eBullets[j].by > HEIGHT) {
      eBullets.splice(j, 1);
    }
  }
}

/** @function checkCollision
  * Checks to see if the player bullets are colliding with the enemy or enemy bullets
  * If so, removes that bullet and whatever it hit and increases the score
  * Also checks to see if enemy bullets care colliding with the player
  * if so, removes that bullet and removes a life
  * finally, checks if lives are less than or equal to zero and if so sets lose to true
  */
function checkCollision() {
  for(var i = 0; i < bullets.length; i++) {
      for(var j = 0; j < enemies.length; j++) {
        if (bulletInsideEnemy(i,j)) {
          enemies.splice(j, 1);
          bullets.splice(i, 1);
          i--;
          score += 100;
          break;
        }
      }
    }
    for (var k = 0; k < bullets.length; k++) {
      for (var l = 0; l < eBullets.length; l++) {
        if (bulletInsideEbullet(k, l)) {
          eBullets.splice(l, 1);
          bullets.splice(k, 1);
          k--;
          score += 50;
          break;
        }
      }
    }
    for (var m = 0; m < eBullets.length; m++) {
      if (bulletInsidePlayer(m)) {
        lives--;
        eBullets.splice(m, 1);
        m--;
      }
    }
    if(lives <= 0) {
      lose = true;
    }
}

/** @function bulletInsideEnemy
  * Checks to see if any corners of a bullet are inside an enemy
  * @param {int} i - index of the bullet
  * @param {int} j - index of the Enemy
  * @returns {bool} - true if bullet is inside the enemy, false if it isn't
  */
function bulletInsideEnemy(i, j) {
   if (isInside(bullets[i].bx,bullets[i].by,enemies[j].ex,enemies[j].ey,EWIDTH,EHEIGHT)) {return true;}
   else if (isInside(bullets[i].bx+BSIZE,bullets[i].by,enemies[j].ex,enemies[j].ey,EWIDTH,EHEIGHT)) {return true;}
   else if (isInside(bullets[i].bx,bullets[i].by+BSIZE,enemies[j].ex,enemies[j].ey,EWIDTH,EHEIGHT)) {return true;}
   else if (isInside(bullets[i].bx+BSIZE,bullets[i]+BSIZE.by,enemies[j].ex,enemies[j].ey,EWIDTH,EHEIGHT)) {return true;}
   return false;
}

/** @function bulletInsideEbullet
  * Checks to see if any corners of a bullet are inside an enemy bullet
  * @param {int} i - index of the bullet
  * @param {int} j - index of the Enemy bullet
  * @returns {bool} - true if bullet is inside the enemy bullet, false if it isn't
  */
function bulletInsideEbullet(i, j) {
  if (isInside(bullets[i].bx,bullets[i].by,eBullets[j].bx,eBullets[j].by,BSIZE,BSIZE)) {return true;}
  else if (isInside(bullets[i].bx+BSIZE,bullets[i].by,eBullets[j].bx,eBullets[j].by,BSIZE,BSIZE)) {return true;}
  else if (isInside(bullets[i].bx,bullets[i].by+BSIZE,eBullets[j].bx,eBullets[j].by,BSIZE,BSIZE)) {return true;}
  else if (isInside(bullets[i].bx+BSIZE,bullets[i]+BSIZE.by,eBullets[j].bx,eBullets[j].by,BSIZE,BSIZE)) {return true;}
  return false;
}

/** @function bulletInsidePlayer
  * Checks to see if any corners of a enemy bullet are inside the player
  * @param {int} i - index of the enemy bullet
  * @returns {bool} - true if enemy bullet is inside the player, false if it isn't
  */
function bulletInsidePlayer(i) {
  if (isInside(eBullets[i].bx,eBullets[i].by,x,y,PWIDTH,PHEIGHT)) {return true;}
  else if (isInside(eBullets[i].bx+BSIZE,eBullets[i].by,x,y,PWIDTH,PHEIGHT)) {return true;}
  else if (isInside(eBullets[i].bx,eBullets[i].by+BSIZE,x,y,PWIDTH,PHEIGHT)) {return true;}
  else if (isInside(eBullets[i].bx+BSIZE,eBullets[i]+BSIZE.by,x,y,PWIDTH,PHEIGHT)) {return true;}
  return false;
}

/** @function bulletInsideEbullet
  * Checks to see if a point is inside a box
  * @param {int} px - x coord of the point
  * @param {int} py - y coord of the point
  * @param {int} bx - x coord of upper left corner of box
  * @param {int} by - y coord of upper left corner of box
  * @param {int} w  - width of the box
  * @param {int} h  - height of the box
  * @returns {bool} - true if point is inside the box, false if it isn't
  */
function isInside(px, py, bx, by, w, h) {
  return (px > bx && px < bx+w && py > by && py < by+h);
}

/** @function render
  * Renders the game into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function render(ctx) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawPlayer(ctx);
  drawEnemies(ctx);
  drawBullets(ctx);
  drawUI(ctx);
  if (lose) {
    drawLose(ctx);
  }
}

/** @function drawPlayer
  * Draws the player into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawPlayer(ctx) {
  ctx.fillStyle = "#003A99";
  ctx.fillRect(x,y,PWIDTH,PHEIGHT);
}

/** @function drawBullets
  * Renders the bullets into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawBullets(ctx) {
  for (var i = 0; i < bullets.length; i++) {
    ctx.fillStyle = bullets[i].color;
    ctx.fillRect(bullets[i].bx,bullets[i].by,BSIZE,BSIZE);
  }
  for (var j = 0; j < eBullets.length; j++) {
    ctx.fillStyle = eBullets[j].color;
    ctx.fillRect(eBullets[j].bx,eBullets[j].by,BSIZE,BSIZE);
  }
}

/** @function drawEnemies
  * Renders the enemies into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawEnemies(ctx) {
  for (var i = 0; i < enemies.length; i++) {
    ctx.fillStyle = enemies[i].color;
    ctx.fillRect(enemies[i].ex,enemies[i].ey,EWIDTH,EHEIGHT);
  }
}

/** @function drawUI
  * Renders the UI elements into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawUI(ctx) {
  ctx.fillStyle = "#444444";
  ctx.font = "20px Arial";
  ctx.fillText("Score: "+score.toString(),5,25);
  ctx.fillText("Lives: "+lives.toString(),WIDTH-80,25);
}

/** @function drawLose
  * Renders the Losing text into the canvas
  * @param {canvas} ctx - the canvas the game will be rendered into
  */
function drawLose(ctx) {
  ctx.fillStyle = "#333333";
  ctx.font = "40px Arial";
  ctx.fillText("You Lose",65,125);
  ctx.font = "20px Arial";
  ctx.fillText("Refresh to play again",50, 170);
}

// Start the game loop
window.requestAnimationFrame(loop);
