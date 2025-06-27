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
      this.speed = 1;
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
      this.direction = { x: -1, y: 0 };
      this.speed = 1;
    }
    movePaddle() {
      this.center.x += this.direction.x * this.speed;
      this.center.y += this.direction.y * this.speed;
    }
  };

  // src/draw.ts
  function rectangle(drawFrom, dimensions) {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "blue";
    ctx.fillRect((drawFrom.x + 1) / 2 * canvas.width, (drawFrom.y + 1) / 2 * canvas.height, dimensions.x * canvas.width, dimensions.y * canvas.height);
  }
  function circle(radius, center) {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const midX = Math.floor(canvas.width / 2);
    const midY = Math.floor(canvas.height / 2);
    ctx.beginPath();
    ctx.arc((center.x + 1) * midX, (center.y + 1) * midY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
  }

  // src/game.ts
  var gameIsRunning = true;
  var gameBall = new Ball(25, { x: 0, y: 0 });
  var paddleLeft = new Paddle(0.05, 0.2, { x: -0.9, y: 0 });
  var paddleRight = new Paddle(0.05, 0.2, { x: 0.9, y: 0 });
  function gameLoop() {
    if (gameIsRunning == false) return;
    circle(gameBall.radius, gameBall.center);
    rectangle(paddleLeft.drawFrom, { x: paddleLeft.width, y: paddleLeft.height });
    rectangle(paddleRight.drawFrom, { x: paddleRight.width, y: paddleRight.height });
    circle(2, { x: -0.9, y: 0 });
    circle(2, { x: 0.9, y: 0 });
  }
  function main() {
    gameLoop();
  }
  main();
})();
