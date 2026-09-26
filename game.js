// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 15};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;
let direction = {x: 1, y: 0};
let nextDirection = {x: 1, y: 0};

let level = 1;
let gameSpeed = 100;
let foodEaten = 0;

// Level configurations
const levels = [
    {level: 1, speed: 100, foodPerLevel: 5, obstacles: false},
    {level: 2, speed: 85, foodPerLevel: 7, obstacles: false},
    {level: 3, speed: 70, foodPerLevel: 8, obstacles: true},
    {level: 4, speed: 55, foodPerLevel: 10, obstacles: true},
    {level: 5, speed: 40, foodPerLevel: 12, obstacles: true},
];

let obstacles = [];
let gameInterval;

// Initialize high score display
document.getElementById('highScore').textContent = highScore;

// Event listeners for keyboard controls
document.addEventListener('keydown', handleKeyPress);

function handleKeyPress(e) {
    if (!gameRunning) return;

    switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            if (direction.y === 0) nextDirection = {x: 0, y: -1};
            e.preventDefault();
            break;
        case 'arrowdown':
        case 's':
            if (direction.y === 0) nextDirection = {x: 0, y: 1};
            e.preventDefault();
            break;
        case 'arrowleft':
        case 'a':
            if (direction.x === 0) nextDirection = {x: -1, y: 0};
            e.preventDefault();
            break;
        case 'arrowright':
        case 'd':
            if (direction.x === 0) nextDirection = {x: 1, y: 0};
            e.preventDefault();
            break;
    }
}

function toggleGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        gameInterval = setInterval(update, gameSpeed);
    } else if (!gamePaused) {
        gamePaused = true;
        clearInterval(gameInterval);
    } else {
        gamePaused = false;
        gameInterval = setInterval(update, gameSpeed);
    }
}

function resetGame() {
    snake = [{x: 10, y: 10}];
    food = {x: 15, y: 15};
    score = 0;
    foodEaten = 0;
    level = 1;
    gameSpeed = 100;
    direction = {x: 1, y: 0};
    nextDirection = {x: 1, y: 0};
    gameRunning = false;
    gamePaused = false;
    obstacles = [];
    clearInterval(gameInterval);
    draw();
    updateLevelInfo();
}

function generateObstacles() {
    obstacles = [];
    const obstacleCount = level * 2;
    for (let i = 0; i < obstacleCount; i++) {
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
        } while (isPositionOccupied(obstacle));
        obstacles.push(obstacle);
    }
}

function isPositionOccupied(pos) {
    // Check if position is occupied by snake
    if (snake.some(segment => segment.x === pos.x && segment.y === pos.y)) {
        return true;
    }
    // Check if position is occupied by obstacles
    if (obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)) {
        return true;
    }
    return false;
}

function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (isPositionOccupied(newFood));
    food = newFood;
}

function advanceLevel() {
    if (level < levels.length) {
        level++;
        const currentLevel = levels[level - 1];
        gameSpeed = currentLevel.speed;
        foodEaten = 0;
        clearInterval(gameInterval);
        gameInterval = setInterval(update, gameSpeed);
        
        if (currentLevel.obstacles) {
            generateObstacles();
        }
        
        updateLevelInfo();
    }
}

function updateLevelInfo() {
    const levelDisplay = document.getElementById('levelDisplay');
    if (levelDisplay) {
        levelDisplay.textContent = level;
    }
}

function update() {
    // Update direction
    direction = nextDirection;

    // Calculate new head position
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    // Check obstacle collision
    if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
        endGame();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10 * level;
        foodEaten++;
        document.getElementById('score').textContent = score;

        // Check if level should advance
        if (foodEaten >= levels[level - 1].foodPerLevel) {
            advanceLevel();
        }

        generateFood();
    } else {
        snake.pop();
    }

    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (optional)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw obstacles
    ctx.fillStyle = '#FF6B6B';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // Draw food
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
            // Eyes
            ctx.fillStyle = '#000';
            const eyeOffset = gridSize / 6;
            const eyeSize = gridSize / 8;
            ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
        } else {
            // Body - gradient effect
            ctx.fillStyle = `#66BB6A`;
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        }
    });
}

function endGame() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(gameInterval);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }

    alert(`Game Over!\nLevel: ${level}\nScore: ${score}\nHigh Score: ${highScore}`);
}

// Initial draw
draw();