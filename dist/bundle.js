(() => {
  // src/ball.ts
  var Ball = class {
    radius;
    center;
    direction;
    speed;
    constructor(_radius, _center) {
      this.radius = _radius;
      this.center = _center;
      this.direction = this.randomVector();
      this.speed = 1e-3;
    }
    randomVector() {
      const angle = Math.random() * 2 * Math.PI;
      return { x: Math.cos(angle), y: Math.sin(angle) };
    }
    moveBall() {
      this.center.x += this.direction.x * this.speed;
      this.center.y += this.direction.y * this.speed;
    }
  };

  // src/paddle.ts
  var Paddle = class {
    center;
    drawFrom;
    width;
    height;
    direction;
    speed;
    color;
    constructor(_widthFromCenter, _heightFromCenter, _center) {
      this.width = _widthFromCenter;
      this.height = _heightFromCenter;
      this.center = _center;
      this.drawFrom = { x: _center.x - _widthFromCenter, y: _center.y - _heightFromCenter };
      this.direction = { x: 0, y: 0 };
      this.speed = 1;
    }
    movePaddle() {
      this.center.x += this.direction.x * this.speed;
      this.center.y += this.direction.y * this.speed;
      this.drawFrom.x += this.direction.x * this.speed;
      this.drawFrom.y += this.direction.y * this.speed;
    }
  };

  // src/draw.ts
  function rectangle(drawFrom, dimensions) {
    const canvas2 = document.getElementById("gameCanvas");
    const ctx2 = canvas2.getContext("2d");
    ctx2.fillStyle = "blue";
    ctx2.fillRect((drawFrom.x + 1) / 2 * canvas2.width, (drawFrom.y + 1) / 2 * canvas2.height, dimensions.x * canvas2.width, dimensions.y * canvas2.height);
  }
  function circle(radius, center) {
    const canvas2 = document.getElementById("gameCanvas");
    const ctx2 = canvas2.getContext("2d");
    const midX = Math.floor(canvas2.width / 2);
    const midY = Math.floor(canvas2.height / 2);
    ctx2.beginPath();
    ctx2.arc((center.x + 1) * midX, (center.y + 1) * midY, radius, 0, Math.PI * 2);
    ctx2.fillStyle = "black";
    ctx2.fill();
  }

  // src/game.ts
  var canvas = document.getElementById("gameCanvas");
  var ctx = canvas.getContext("2d");
  var gameIsRunning = true;
  var gameBall = new Ball(canvas.width / 50, { x: 0, y: 0 });
  var paddleLeft = new Paddle(0.05, 0.2, { x: -0.9, y: 0 });
  var paddleRight = new Paddle(0.05, 0.2, { x: 0.9, y: 0 });
  var keys = {};
  function keyEvents() {
    if (keys["ArrowUp"] == true) {
      paddleRight.direction.y += -0.01;
    }
    if (keys["ArrowDown"] == true) {
      paddleRight.direction.y += 0.01;
    }
    if (keys["w"] == true) {
      paddleLeft.direction.y += -0.01;
    }
    if (keys["s"] == true) {
      paddleLeft.direction.y += 0.01;
    }
  }
  function gameLoop() {
    if (gameIsRunning == false) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paddleLeft.direction.y = 0;
    paddleRight.direction.y = 0;
    keyEvents();
    gameBall.moveBall();
    circle(gameBall.radius, gameBall.center);
    paddleLeft.movePaddle();
    paddleRight.movePaddle();
    rectangle(paddleLeft.drawFrom, { x: paddleLeft.width, y: paddleLeft.height });
    rectangle(paddleRight.drawFrom, { x: paddleRight.width, y: paddleRight.height });
    requestAnimationFrame(gameLoop);
  }
  function main() {
    window.addEventListener("keydown", (event) => {
      keys[event.key] = true;
    });
    window.addEventListener("keyup", (event) => {
      keys[event.key] = false;
    });
    gameLoop();
  }
  main();
})();
