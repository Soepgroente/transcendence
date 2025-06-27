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
    width;
    height;
    direction;
    speed;
    constructor(_width, _height, _center) {
      this.width = _width;
      this.height = _height;
      this.center = _center;
      this.direction = { x: -1, y: 0 };
      this.speed = 1;
    }
    movePaddle() {
      this.center.x += this.direction.x * this.speed;
      this.center.y += this.direction.y * this.speed;
    }
  };

  // src/draw.ts
  function rectangle(center, dimensions) {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const midX = Math.floor(canvas.width / 2);
    const midY = Math.floor(canvas.height / 2);
    ctx.fillStyle = "blue";
    ctx.fillRect((center.x + 1) * midX, (center.y + 1) * midY, dimensions.x, dimensions.y);
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
  function runGame() {
    let gameBall = new Ball(4, { x: 0, y: 0 });
    let paddleLeft = new Paddle(5, 25, { x: -0.9, y: 0 });
    let paddleRight = new Paddle(5, 25, { x: 0.9, y: 0 });
    circle(gameBall.radius, gameBall.center);
    rectangle(paddleLeft.center, { x: paddleLeft.width, y: paddleLeft.height });
    rectangle(paddleRight.center, { x: paddleRight.width, y: paddleRight.height });
  }
  function main() {
    console.log("Hello world");
    runGame();
  }
  main();
})();
