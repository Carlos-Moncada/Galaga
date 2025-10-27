const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Cargar todas las imágenes
const images = {
    player: new Image(),
    enemy: new Image(),
    ladybug: new Image(),
    king: new Image(),
    background: new Image(),
    explosionEnemy: new Image(),
    explosionPlayer: new Image()
};

images.player.src = 'player.png';
images.enemy.src = 'enemy.png';
images.ladybug.src = 'Arcade - Galaga Arrangement - Enemies - Ladybug.png';
images.king.src = 'Arcade - Galaga Arrangement - Enemies - King Galaspark.png';
images.background.src = 'Arcade - Galaga Arrangement - Backgrounds - Level Backgrounds.png';
images.explosionEnemy.src = 'Eliminar_enemigo.png';
images.explosionPlayer.src = 'Eliminar_nave.png';

let imagesLoaded = 0;
const totalImages = Object.keys(images).length;
let gameStarted = false;

// Cargar imágenes antes de iniciar
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            initGame();
        }
    };
});

// Variables del juego
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let explosions = [];
let backgroundOffset = 0;

// Configuración del jugador
const player = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 100,
    width: 50,
    height: 60,
    speed: 6,
    frameIndex: 0,
    animationCounter: 0
};

// Controles
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        shoot();
    }
    if (e.key === 'r' || e.key === 'R') {
        if (gameOver) {
            resetGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Clase de Explosión
class Explosion {
    constructor(x, y, type = 'enemy') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.frame = 0;
        this.frameWidth = type === 'enemy' ? 101 : 101;
        this.frameHeight = type === 'enemy' ? 102 : 100;
        this.totalFrames = type === 'enemy' ? 5 : 4;
        this.animationSpeed = 3;
        this.animationCounter = 0;
        this.finished = false;
    }

    update() {
        this.animationCounter++;
        if (this.animationCounter >= this.animationSpeed) {
            this.frame++;
            this.animationCounter = 0;
            if (this.frame >= this.totalFrames) {
                this.finished = true;
            }
        }
    }

    draw() {
        if (this.finished) return;
        
        const img = this.type === 'enemy' ? images.explosionEnemy : images.explosionPlayer;
        const sx = this.frame * this.frameWidth;
        
        ctx.drawImage(
            img,
            sx, 0, this.frameWidth, this.frameHeight,
            this.x - this.frameWidth / 2, this.y - this.frameHeight / 2,
            this.frameWidth, this.frameHeight
        );
    }
}

// Clase Enemy
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 1: butterfly, 2: ladybug, 3: king
        this.speedX = 1.5;
        this.speedY = 0;
        this.alive = true;
        this.shootTimer = Math.random() * 200 + 100;
        this.animationFrame = 0;
        this.animationCounter = 0;
        
        // Dimensiones según el tipo
        if (type === 1) { // Butterfly (enemy.png)
            this.width = 45;
            this.height = 45;
            this.frameWidth = 33;
            this.frameHeight = 33;
            this.totalFrames = 2;
        } else if (type === 2) { // Ladybug
            this.width = 40;
            this.height = 40;
            this.frameWidth = 33;
            this.frameHeight = 33;
            this.totalFrames = 2;
        } else { // King
            this.width = 50;
            this.height = 50;
            this.frameWidth = 64;
            this.frameHeight = 64;
            this.totalFrames = 5;
        }
    }

    draw() {
        if (!this.alive) return;
        
        // Animación
        this.animationCounter++;
        if (this.animationCounter > 10) {
            this.animationFrame = (this.animationFrame + 1) % this.totalFrames;
            this.animationCounter = 0;
        }
        
        let img;
        if (this.type === 1) {
            img = images.enemy;
        } else if (this.type === 2) {
            img = images.ladybug;
        } else {
            img = images.king;
        }
        
        const sx = this.animationFrame * this.frameWidth;
        
        ctx.drawImage(
            img,
            sx, 0, this.frameWidth, this.frameHeight,
            this.x - this.width / 2, this.y - this.height / 2,
            this.width, this.height
        );
    }

    update() {
        this.x += this.speedX;
        
        // Disparar aleatoriamente
        this.shootTimer--;
        if (this.shootTimer <= 0 && Math.random() < 0.02) {
            this.enemyShoot();
            this.shootTimer = Math.random() * 300 + 200;
        }
    }

    enemyShoot() {
        enemyBullets.push({
            x: this.x,
            y: this.y + 15,
            width: 5,
            height: 12,
            speed: 5,
            color: '#ff0000'
        });
    }
}

// Clase Bullet
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = 8;
        this.color = '#ffff00';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    update() {
        this.y -= this.speed;
    }
}

// Crear enemigos
function createEnemies() {
    enemies = [];
    const rows = Math.min(4 + Math.floor(level / 2), 5);
    const cols = Math.min(8 + Math.floor(level / 3), 10);
    const startX = canvas.width / 2 - (cols * 60) / 2;
    const startY = 80;
    const spacing = 60;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let type;
            if (row === 0) {
                type = 3; // King en la primera fila
            } else if (row <= 2) {
                type = 1; // Butterfly
            } else {
                type = 2; // Ladybug
            }
            
            enemies.push(new Enemy(
                startX + col * spacing,
                startY + row * spacing,
                type
            ));
        }
    }
}

// Disparar
function shoot() {
    if (!gameOver && bullets.length < 2) {
        bullets.push(new Bullet(player.x + player.width / 2 - 2, player.y));
    }
}

// Dibujar jugador
function drawPlayer() {
    // Animación sutil
    player.animationCounter++;
    if (player.animationCounter > 15) {
        player.frameIndex = (player.frameIndex + 1) % 2;
        player.animationCounter = 0;
    }
    
    const frameWidth = 33;
    const frameHeight = 42;
    const sx = player.frameIndex * frameWidth;
    
    ctx.drawImage(
        images.player,
        sx, 0, frameWidth, frameHeight,
        player.x, player.y,
        player.width, player.height
    );
}

// Mover enemigos
function moveEnemies() {
    let changeDirection = false;
    
    for (let enemy of enemies) {
        if (enemy.alive) {
            if (enemy.x <= 50 || enemy.x >= canvas.width - 50) {
                changeDirection = true;
                break;
            }
        }
    }
    
    if (changeDirection) {
        for (let enemy of enemies) {
            if (enemy.alive) {
                enemy.speedX *= -1;
                enemy.y += 20;
            }
        }
    }
}

// Detectar colisiones
function checkCollisions() {
    // Balas del jugador vs enemigos
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width / 2 &&
                bullet.x + bullet.width > enemy.x - enemy.width / 2 &&
                bullet.y < enemy.y + enemy.height / 2 &&
                bullet.y + bullet.height > enemy.y - enemy.height / 2) {
                
                enemy.alive = false;
                bullets.splice(i, 1);
                score += enemy.type === 3 ? 150 : enemy.type === 1 ? 80 : 50;
                
                // Crear explosión
                explosions.push(new Explosion(enemy.x, enemy.y, 'enemy'));
                break;
            }
        }
    }

    // Balas enemigas vs jugador
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            enemyBullets.splice(i, 1);
            lives--;
            
            // Explosión del jugador
            explosions.push(new Explosion(player.x + player.width / 2, player.y + player.height / 2, 'player'));
            
            if (lives <= 0) {
                gameOver = true;
                document.getElementById('gameOverText').textContent = '¡GAME OVER! Presiona R para reiniciar';
            }
        }
    }

    // Verificar si todos los enemigos están muertos
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) {
        level++;
        setTimeout(() => {
            createEnemies();
        }, 1000);
    }
}

// Actualizar interfaz
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

// Actualizar juego
function update() {
    if (gameOver) return;

    // Mover jugador
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Actualizar balas
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }

    // Actualizar balas enemigas
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }

    // Actualizar enemigos
    for (let enemy of enemies) {
        if (enemy.alive) {
            enemy.update();
        }
    }

    // Actualizar explosiones
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        if (explosions[i].finished) {
            explosions.splice(i, 1);
        }
    }

    // Mover fondo
    backgroundOffset += 0.5;
    if (backgroundOffset >= canvas.height) {
        backgroundOffset = 0;
    }

    moveEnemies();
    checkCollisions();
    updateUI();
}

// Dibujar todo
function draw() {
    // Fondo espacial con scroll
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo con patrón de estrellas
    const bgScale = canvas.width / images.background.width;
    const bgHeight = images.background.height * bgScale;
    
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.drawImage(
        images.background,
        0, backgroundOffset - bgHeight,
        canvas.width, bgHeight
    );
    ctx.drawImage(
        images.background,
        0, backgroundOffset,
        canvas.width, bgHeight
    );
    ctx.restore();

    // Dibujar jugador
    drawPlayer();

    // Dibujar balas
    for (let bullet of bullets) {
        bullet.draw();
    }

    // Dibujar balas enemigas
    for (let bullet of enemyBullets) {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    }

    // Dibujar enemigos
    for (let enemy of enemies) {
        if (enemy.alive) {
            enemy.draw();
        }
    }

    // Dibujar explosiones
    for (let explosion of explosions) {
        explosion.draw();
    }
}

// Loop principal
function gameLoop() {
    if (!gameStarted) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Reiniciar juego
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    bullets = [];
    enemyBullets = [];
    explosions = [];
    backgroundOffset = 0;
    player.x = canvas.width / 2 - 30;
    player.y = canvas.height - 100;
    document.getElementById('gameOverText').textContent = '';
    createEnemies();
}

// Iniciar juego cuando las imágenes estén cargadas
function initGame() {
    gameStarted = true;
    createEnemies();
    gameLoop();
}