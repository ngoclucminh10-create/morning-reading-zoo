export default class AnimalManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animals = [];
        this.maxAnimals = 100;
        this.lastSpawnTime = 0;
        this.spawnInterval = 10000; // 默认10秒生成一只
        this.selectedAnimalTypes = new Set(['dog', 'cat', 'rabbit', 'bear', 'panda', 'pig', 'unicorn', 'frog', 'penguin', 'tiger', 'fish']);

        // 设置画布大小
        this.resizeCanvas();

        // 动物类型配置
        this.animalConfigs = {
            dog: { color: '#8B4513', emoji: '🐕', size: 1.2 },
            cat: { color: '#808080', emoji: '🐱', size: 1.0 },
            rabbit: { color: '#F5F5F5', emoji: '🐰', size: 0.9 },
            bear: { color: '#654321', emoji: '🐻', size: 1.5 },
            panda: { color: '#000000', emoji: '🐼', size: 1.3 },
            pig: { color: '#FFB6C1', emoji: '🐷', size: 1.1 },
            unicorn: { color: '#FF69B4', emoji: '🦄', size: 1.2 },
            frog: { color: '#32CD32', emoji: '🐸', size: 0.8 },
            penguin: { color: '#000000', emoji: '🐧', size: 1.0 },
            tiger: { color: '#FF8C00', emoji: '🐅', size: 1.4 },
            fish: { color: '#00CED1', emoji: '🐠', size: 0.7 }
        };

        // 动画相关
        this.animationFrame = 0;
    }

    // 调整画布大小
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(container.clientWidth - 40, 1200);
        const maxHeight = window.innerHeight - 300;

        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
    }

    // 创建新动物
    spawnAnimal(type = null) {
        if (this.animals.length >= this.maxAnimals) {
            return null;
        }

        // 随机选择动物类型
        if (!type) {
            const types = Array.from(this.selectedAnimalTypes);
            if (types.length === 0) return null;
            type = types[Math.floor(Math.random() * types.length)];
        }

        const config = this.animalConfigs[type];
        const baseSize = 32;
        const size = baseSize * config.size;

        // 随机位置（留出边距）
        const margin = size;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = margin + Math.random() * (this.canvas.height - margin * 2);

        const animal = new Animal(type, x, y, size, config);
        this.animals.push(animal);

        return animal;
    }

    // 更新所有动物
    update(deltaTime, currentVolume = 0) {
        this.animationFrame++;

        // 移除死亡的动物并更新存活动物
        this.animals = this.animals.filter(animal => {
            animal.update(deltaTime, this.canvas.width, this.canvas.height, currentVolume);
            return animal.isAlive();
        });
    }

    // 渲染所有动物
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景效果（可选的网格）
        this.drawGrid();

        // 绘制所有动物
        this.animals.forEach(animal => {
            animal.draw(this.ctx, this.animationFrame);
        });
    }

    // 绘制背景网格
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    // 清空所有动物
    clear() {
        this.animals = [];
    }

    // 获取动物数量
    getAnimalCount() {
        return this.animals.length;
    }

    // 获取动物类型统计
    getAnimalStats() {
        const stats = {};
        this.animals.forEach(animal => {
            stats[animal.type] = (stats[animal.type] || 0) + 1;
        });
        return stats;
    }

    // 设置选中的动物类型
    setSelectedAnimalTypes(types) {
        this.selectedAnimalTypes = new Set(types);
    }

    // 设置生成间隔
    setSpawnInterval(interval) {
        this.spawnInterval = interval;
    }

    // 设置最大动物数量
    setMaxAnimals(max) {
        this.maxAnimals = max;
    }

    // 设置生成间隔（考虑速度倍数）
    setSpawnInterval(interval) {
        this.baseSpawnInterval = interval; // 基础间隔（毫秒）
    }

    // 检查是否应该生成新动物
    shouldSpawnAnimal(currentTime, speedMultiplier = 1) {
        // 如果没有设置基础间隔，使用默认值
        const baseInterval = this.baseSpawnInterval || 10000; // 默认10秒

        // 根据速度倍数计算实际间隔（速度越快，间隔越短）
        const actualInterval = baseInterval / speedMultiplier;

        if (currentTime - this.lastSpawnTime < actualInterval) {
            return false;
        }
        this.lastSpawnTime = currentTime;
        return true;
    }
}

// Animal类定义
class Animal {
    constructor(type, x, y, size, config) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.config = config;
        this.velocity = {
            x: (Math.random() - 0.5) * 50, // -25 到 25 像素/秒
            y: (Math.random() - 0.5) * 50
        };
        this.birthTime = Date.now();
        this.life = 1.0; // 生命值（1.0 = 100%）
        this.maxLife = 1.0;
        this.lastSoundTime = Date.now(); // 最后听到声音的时间
        this.lifeDecayRate = 0.3; // 生命衰减速度（每秒）
        this.soundThreshold = 30; // 声音阈值
        this.animationOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.scale = 0;
        this.targetScale = 1;
        this.isDisappearing = false; // 是否正在消失
    }

    update(deltaTime, canvasWidth, canvasHeight, currentVolume = 0) {
        // 更新缩放动画（生成时的效果）
        if (this.scale < this.targetScale) {
            this.scale += deltaTime * 3;
            if (this.scale > this.targetScale) {
                this.scale = this.targetScale;
            }
        }

        // 检查是否有声音 - 声音可以维持或增加生命值
        if (currentVolume > this.soundThreshold) {
            this.lastSoundTime = Date.now();
            // 大声音可以恢复生命值
            if (this.life < this.maxLife) {
                this.life = Math.min(this.maxLife, this.life + deltaTime * 0.5);
            }
            this.isDisappearing = false;
        }

        // 检查多久没听到声音了
        const timeSinceLastSound = Date.now() - this.lastSoundTime;
        const silenceSeconds = timeSinceLastSound / 1000;

        // 3秒没声音开始消失，5秒完全消失
        if (silenceSeconds > 3) {
            this.isDisappearing = true;
            const disappearDuration = silenceSeconds - 3; // 超过3秒的时间
            this.life = Math.max(0, 1.0 - (disappearDuration / 2)); // 2秒内消失完毕
        }

        // 更新位置（只有在有生命值时才移动）
        if (this.life > 0) {
            this.x += this.velocity.x * deltaTime * this.life;
            this.y += this.velocity.y * deltaTime * this.life;

            // 添加漂浮效果
            const floatAmount = Math.sin(Date.now() * 0.001 + this.animationOffset) * 2;
            this.y += floatAmount * deltaTime * this.life;

            // 边界碰撞检测
            const margin = this.size;
            if (this.x < margin || this.x > canvasWidth - margin) {
                this.velocity.x *= -0.8;
                this.x = Math.max(margin, Math.min(canvasWidth - margin, this.x));
            }
            if (this.y < margin || this.y > canvasHeight - margin) {
                this.velocity.y *= -0.8;
                this.y = Math.max(margin, Math.min(canvasHeight - margin, this.y));
            }

            // 添加旋转（消失时旋转更快）
            const rotationSpeed = this.isDisappearing ? 0.05 : 0.01;
            this.rotation += this.velocity.x * deltaTime * rotationSpeed;
        }
    }

    // 检查动物是否还活着
    isAlive() {
        return this.life > 0;
    }

    draw(ctx, globalFrame) {
        ctx.save();

        // 应用变换
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // 消失时缩小效果
        const currentScale = this.scale * (0.5 + this.life * 0.5);
        ctx.scale(currentScale, currentScale);

        // 设置透明度
        ctx.globalAlpha = this.life;

        // 如果正在消失，添加红色警告效果
        if (this.isDisappearing) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
            ctx.shadowBlur = 10 * (1 - this.life);
        }

        // 根据类型绘制不同的动物
        this.drawPixelAnimal(ctx);

        ctx.restore();
    }

    drawPixelAnimal(ctx) {
        const pixelSize = this.size / 8; // 8x8 像素网格
        const type = this.type;

        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(-this.size * 0.4, this.size * 0.4, this.size * 0.8, this.size * 0.2);

        switch(type) {
            case 'dog':
                this.drawDog(ctx, pixelSize);
                break;
            case 'cat':
                this.drawCat(ctx, pixelSize);
                break;
            case 'rabbit':
                this.drawRabbit(ctx, pixelSize);
                break;
            case 'bear':
                this.drawBear(ctx, pixelSize);
                break;
            case 'panda':
                this.drawPanda(ctx, pixelSize);
                break;
            case 'pig':
                this.drawPig(ctx, pixelSize);
                break;
            case 'unicorn':
                this.drawUnicorn(ctx, pixelSize);
                break;
            case 'frog':
                this.drawFrog(ctx, pixelSize);
                break;
            case 'penguin':
                this.drawPenguin(ctx, pixelSize);
                break;
            case 'tiger':
                this.drawTiger(ctx, pixelSize);
                break;
            case 'fish':
                this.drawFish(ctx, pixelSize);
                break;
            default:
                this.drawDefault(ctx, pixelSize);
        }
    }

    // 绘制各种动物的像素风格 - 卡通可爱版本
    drawDog(ctx, pixelSize) {
        // 主身体 - 更圆润
        ctx.fillStyle = '#D2691E'; // 温暖的棕色
        // 圆润的身体
        ctx.beginPath();
        ctx.ellipse(0, 0, pixelSize * 2.5, pixelSize * 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 大大的头部
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 2, pixelSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 垂下的可爱耳朵
        ctx.fillStyle = '#8B4513'; // 深棕色
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 1.5, -pixelSize * 3, pixelSize * 0.8, pixelSize * 1.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(pixelSize * 1.5, -pixelSize * 3, pixelSize * 0.8, pixelSize * 1.2, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 大大的眼睛
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.5, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.25, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // 可爱的黑鼻子
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 1.3, pixelSize * 0.3, pixelSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 舌头
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(-pixelSize * 0.3, -pixelSize * 0.8, pixelSize * 0.6, pixelSize * 0.4);

        // 短短的小腿
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(-pixelSize * 1.5, pixelSize * 1.2, pixelSize * 0.8, pixelSize);
        ctx.fillRect(pixelSize * 0.7, pixelSize * 1.2, pixelSize * 0.8, pixelSize);
    }

    drawCat(ctx, pixelSize) {
        // 柔软的身体
        ctx.fillStyle = '#FFA500'; // 橙黄色
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 2, pixelSize * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 圆圆的头部
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 1.5, pixelSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 三角形耳朵
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(-pixelSize * 1.3, -pixelSize * 2.5);
        ctx.lineTo(-pixelSize * 0.5, -pixelSize * 1);
        ctx.lineTo(-pixelSize * 1.8, -pixelSize * 1.2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pixelSize * 1.3, -pixelSize * 2.5);
        ctx.lineTo(pixelSize * 0.5, -pixelSize * 1);
        ctx.lineTo(pixelSize * 1.8, -pixelSize * 1.2);
        ctx.closePath();
        ctx.fill();

        // 粉色耳朵内部
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(-pixelSize * 1.2, -pixelSize * 2.2);
        ctx.lineTo(-pixelSize * 0.8, -pixelSize * 1.4);
        ctx.lineTo(-pixelSize * 1.4, -pixelSize * 1.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pixelSize * 1.2, -pixelSize * 2.2);
        ctx.lineTo(pixelSize * 0.8, -pixelSize * 1.4);
        ctx.lineTo(pixelSize * 1.4, -pixelSize * 1.5);
        ctx.closePath();
        ctx.fill();

        // 大大的杏仁眼
        ctx.fillStyle = '#2E8B57'; // 绿色眼睛
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 0.5, -pixelSize * 1.5, pixelSize * 0.3, pixelSize * 0.5, -0.2, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 0.5, -pixelSize * 1.5, pixelSize * 0.3, pixelSize * 0.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 小鼻子
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.moveTo(0, -pixelSize * 0.8);
        ctx.lineTo(-pixelSize * 0.2, -pixelSize * 1.1);
        ctx.lineTo(pixelSize * 0.2, -pixelSize * 1.1);
        ctx.closePath();
        ctx.fill();

        // 胡须
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = pixelSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(-pixelSize * 2, -pixelSize * 0.8);
        ctx.lineTo(-pixelSize * 0.8, -pixelSize * 0.9);
        ctx.moveTo(pixelSize * 0.8, -pixelSize * 0.9);
        ctx.lineTo(pixelSize * 2, -pixelSize * 0.8);
        ctx.stroke();

        // 长长的尾巴
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(pixelSize * 2, pixelSize * 0.5, pixelSize * 1.5, pixelSize * 0.5, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRabbit(ctx, pixelSize) {
        // 雪白的身体
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, 0, pixelSize * 2, pixelSize * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 圆圆的头部
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 2, pixelSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 超长耳朵
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 0.7, -pixelSize * 4, pixelSize * 0.5, pixelSize * 2.5, -0.2, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 0.7, -pixelSize * 4, pixelSize * 0.5, pixelSize * 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 粉色耳朵内部
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 0.7, -pixelSize * 4, pixelSize * 0.3, pixelSize * 2, -0.2, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 0.7, -pixelSize * 4, pixelSize * 0.3, pixelSize * 2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 红宝石眼睛
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.6, -pixelSize * 2, pixelSize * 0.4, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.6, -pixelSize * 2, pixelSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 小鼻子
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 1.3, pixelSize * 0.3, pixelSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 小兔子牙
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-pixelSize * 0.2, -pixelSize * 0.9, pixelSize * 0.15, pixelSize * 0.4);
        ctx.fillRect(pixelSize * 0.05, -pixelSize * 0.9, pixelSize * 0.15, pixelSize * 0.4);

        // 毛茸茸的尾巴
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, pixelSize * 2.5, pixelSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBear(ctx, pixelSize) {
        // 棕色的胖身体
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 2.8, pixelSize * 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 大大的头
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 2, pixelSize * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // 圆圆的耳朵
        ctx.beginPath();
        ctx.arc(-pixelSize * 1.5, -pixelSize * 3.5, pixelSize * 1, 0, Math.PI * 2);
        ctx.arc(pixelSize * 1.5, -pixelSize * 3.5, pixelSize * 1, 0, Math.PI * 2);
        ctx.fill();

        // 棕色耳朵内部
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(-pixelSize * 1.5, -pixelSize * 3.5, pixelSize * 0.5, 0, Math.PI * 2);
        ctx.arc(pixelSize * 1.5, -pixelSize * 3.5, pixelSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 小眼睛
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.3, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 大鼻子
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 1.3, pixelSize * 0.5, pixelSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 微笑
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = pixelSize * 0.15;
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 1.5, pixelSize * 0.8, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // 熊掌
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 1.8, pixelSize * 1.5, pixelSize * 1, pixelSize * 0.7, 0, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 1.8, pixelSize * 1.5, pixelSize * 1, pixelSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 脚掌
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 1.8, pixelSize * 1.5, pixelSize * 0.6, pixelSize * 0.4, 0, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 1.8, pixelSize * 1.5, pixelSize * 0.6, pixelSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPanda(ctx, pixelSize) {
        // 白白的肚子
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 2.5, pixelSize * 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 黑色的身体
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 3, pixelSize * 2.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 白色的头
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 2, pixelSize * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // 黑色眼圈
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 0.8, -pixelSize * 2.2, pixelSize * 0.8, pixelSize * 0.6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 0.8, -pixelSize * 2.2, pixelSize * 0.8, pixelSize * 0.6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 白色眼睛
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.8, -pixelSize * 2.2, pixelSize * 0.4, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.8, -pixelSize * 2.2, pixelSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 黑色瞳孔
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.8, -pixelSize * 2.2, pixelSize * 0.2, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.8, -pixelSize * 2.2, pixelSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 黑鼻子
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 1.2, pixelSize * 0.4, pixelSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 黑耳朵
        ctx.beginPath();
        ctx.arc(-pixelSize * 1.8, -pixelSize * 3.5, pixelSize * 1, 0, Math.PI * 2);
        ctx.arc(pixelSize * 1.8, -pixelSize * 3.5, pixelSize * 1, 0, Math.PI * 2);
        ctx.fill();

        // 黑手臂
        ctx.fillRect(-pixelSize * 3, -pixelSize * 0.5, pixelSize * 1.5, pixelSize * 2);
        ctx.fillRect(pixelSize * 1.5, -pixelSize * 0.5, pixelSize * 1.5, pixelSize * 2);

        // 黑腿
        ctx.fillRect(-pixelSize * 1.5, pixelSize * 2, pixelSize * 1.2, pixelSize * 1.5);
        ctx.fillRect(pixelSize * 0.3, pixelSize * 2, pixelSize * 1.2, pixelSize * 1.5);
    }

    drawPig(ctx, pixelSize) {
        // 粉粉的胖身体
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 2.5, pixelSize * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 大圆头
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 1.8, pixelSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // 垂下的大耳朵
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 2, -pixelSize * 2, pixelSize * 1, pixelSize * 1.5, -0.5, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 2, -pixelSize * 2, pixelSize * 1, pixelSize * 1.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 大大的眼睛
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.35, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // 猪鼻子
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 1.2, pixelSize * 0.8, pixelSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 鼻孔
        ctx.fillStyle = '#C71585';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.2, -pixelSize * 1.2, pixelSize * 0.15, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.2, -pixelSize * 1.2, pixelSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 卷卷的尾巴
        ctx.strokeStyle = '#FFB6C1';
        ctx.lineWidth = pixelSize * 0.5;
        ctx.beginPath();
        ctx.arc(pixelSize * 2.5, pixelSize * 1, pixelSize * 0.8, 0, Math.PI * 1.5);
        ctx.stroke();
    }

    drawUnicorn(ctx, pixelSize) {
        // 白色身体
        ctx.fillStyle = '#FFFACD'; // 柔和的白色
        ctx.beginPath();
        ctx.ellipse(0, 0, pixelSize * 2.5, pixelSize * 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 优美的头部
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 2, pixelSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 彩虹鬃毛
        const colors = ['#FF1493', '#FF69B4', '#FFB6C1', '#DDA0DD', '#9370DB', '#87CEEB'];
        colors.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(0, -pixelSize * 2 - i * pixelSize * 0.4, pixelSize * 1.5 - i * 0.1, pixelSize * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // 独角 - 闪亮的金色
        const gradient = ctx.createLinearGradient(0, -pixelSize * 4, 0, -pixelSize * 2);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(pixelSize * 0.3, -pixelSize * 2.5);
        ctx.lineTo(0, -pixelSize * 5);
        ctx.lineTo(-pixelSize * 0.3, -pixelSize * 2.5);
        ctx.closePath();
        ctx.fill();

        // 星星装饰
        ctx.fillStyle = '#FFD700';
        this.drawStar(ctx, pixelSize * 0.5, -pixelSize * 3.5, pixelSize * 0.3);

        // 温柔的大眼睛
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 0.5, -pixelSize * 2, pixelSize * 0.4, pixelSize * 0.5, -0.2, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 0.5, -pixelSize * 2, pixelSize * 0.4, pixelSize * 0.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 睫毛
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = pixelSize * 0.1;
        ctx.beginPath();
        ctx.moveTo(-pixelSize * 0.8, -pixelSize * 2.3);
        ctx.lineTo(-pixelSize * 0.9, -pixelSize * 2.6);
        ctx.moveTo(pixelSize * 0.8, -pixelSize * 2.3);
        ctx.lineTo(pixelSize * 0.9, -pixelSize * 2.6);
        ctx.stroke();
    }

    drawFrog(ctx, pixelSize) {
        // 鲜绿的身体
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 2.5, pixelSize * 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 大大的脑袋
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 1, pixelSize * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 超大的眼睛
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 1.2, -pixelSize * 1.5, pixelSize * 1, pixelSize * 1.2, -0.3, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 1.2, -pixelSize * 1.5, pixelSize * 1, pixelSize * 1.2, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 青蛙瞳孔
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-pixelSize * 1.2, -pixelSize * 1.5, pixelSize * 0.6, 0, Math.PI * 2);
        ctx.arc(pixelSize * 1.2, -pixelSize * 1.5, pixelSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // 大嘴巴
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = pixelSize * 0.2;
        ctx.beginPath();
        ctx.arc(0, pixelSize * 0.5, pixelSize * 1.5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // 前腿
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 2, pixelSize * 0.5, pixelSize * 0.8, pixelSize * 1.5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 2, pixelSize * 0.5, pixelSize * 0.8, pixelSize * 1.5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 蹼蹼
        ctx.fillStyle = '#90EE90';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 2.2, pixelSize * 1.8, pixelSize * 0.8, pixelSize * 0.5, -0.5, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 2.2, pixelSize * 1.8, pixelSize * 0.8, pixelSize * 0.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 脸颊红晕
        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.arc(-pixelSize * 1.5, pixelSize * 0.2, pixelSize * 0.5, 0, Math.PI * 2);
        ctx.arc(pixelSize * 1.5, pixelSize * 0.2, pixelSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPenguin(ctx, pixelSize) {
        // 黑色的背部
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 2, pixelSize * 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 白色的肚子
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 1.5, pixelSize * 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 黑白分明的头
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 2, pixelSize * 2, pixelSize * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 2, pixelSize * 1.6, pixelSize * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 可爱的眼睛
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.6, -pixelSize * 2, pixelSize * 0.4, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.6, -pixelSize * 2, pixelSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛高光
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-pixelSize * 0.5, -pixelSize * 2.1, pixelSize * 0.15, 0, Math.PI * 2);
        ctx.arc(pixelSize * 0.5, -pixelSize * 2.1, pixelSize * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 橙色的嘴
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(0, -pixelSize * 1.5);
        ctx.lineTo(-pixelSize * 0.5, -pixelSize * 1);
        ctx.lineTo(pixelSize * 0.5, -pixelSize * 1);
        ctx.closePath();
        ctx.fill();

        // 橙色的脚
        ctx.fillRect(-pixelSize * 1.2, pixelSize * 2.5, pixelSize * 0.8, pixelSize * 0.5);
        ctx.fillRect(pixelSize * 0.4, pixelSize * 2.5, pixelSize * 0.8, pixelSize * 0.5);

        // 小翅膀
        ctx.fillStyle = '#000000';
        ctx.fillRect(-pixelSize * 2.5, -pixelSize * 0.5, pixelSize * 0.8, pixelSize * 2);
        ctx.fillRect(pixelSize * 1.7, -pixelSize * 0.5, pixelSize * 0.8, pixelSize * 2);
    }

    drawTiger(ctx, pixelSize) {
        // 橙色身体
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(0, pixelSize * 0.5, pixelSize * 2.8, pixelSize * 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 老虎头
        ctx.beginPath();
        ctx.arc(0, -pixelSize * 2, pixelSize * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // 黑色条纹
        ctx.fillStyle = '#000000';
        // 身体条纹
        ctx.fillRect(-pixelSize * 3, -pixelSize * 0.5, pixelSize * 0.4, pixelSize * 2);
        ctx.fillRect(-pixelSize * 2, pixelSize * 0.5, pixelSize * 0.4, pixelSize * 2);
        ctx.fillRect(pixelSize * 1.6, -pixelSize * 0.5, pixelSize * 0.4, pixelSize * 2);
        ctx.fillRect(pixelSize * 2.6, pixelSize * 0.5, pixelSize * 0.4, pixelSize * 2);

        // 头部条纹
        ctx.fillRect(-pixelSize * 2.2, -pixelSize * 2.5, pixelSize * 0.3, pixelSize * 1);
        ctx.fillRect(pixelSize * 1.9, -pixelSize * 2.5, pixelSize * 0.3, pixelSize * 1);

        // 威严的眼睛
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.5, pixelSize * 0.3, -0.2, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.5, pixelSize * 0.3, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 黑色瞳孔
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.25, pixelSize * 0.15, -0.2, 0, Math.PI * 2);
        ctx.ellipse(pixelSize * 0.7, -pixelSize * 2, pixelSize * 0.25, pixelSize * 0.15, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 白色胡须区
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-pixelSize * 2.5, -pixelSize * 1.5, pixelSize * 0.8, pixelSize * 0.4);
        ctx.fillRect(pixelSize * 1.7, -pixelSize * 1.5, pixelSize * 0.8, pixelSize * 0.4);

        // 粉色鼻子
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(0, -pixelSize * 1.3, pixelSize * 0.3, pixelSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFish(ctx, pixelSize) {
        // 彩色身体
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pixelSize * 2.5);
        bodyGradient.addColorStop(0, '#FFD700');
        bodyGradient.addColorStop(0.5, '#FFA500');
        bodyGradient.addColorStop(1, '#FF6347');

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, pixelSize * 2.5, pixelSize * 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 大大的尾巴
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(pixelSize * 2.3, 0);
        ctx.quadraticCurveTo(pixelSize * 4, -pixelSize * 1.5, pixelSize * 4.5, -pixelSize * 2);
        ctx.lineTo(pixelSize * 4.5, pixelSize * 2);
        ctx.quadraticCurveTo(pixelSize * 4, pixelSize * 1.5, pixelSize * 2.3, 0);
        ctx.closePath();
        ctx.fill();

        // 鱼鳍
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(0, -pixelSize * 1.5);
        ctx.lineTo(-pixelSize, -pixelSize * 2.5);
        ctx.lineTo(pixelSize * 1, -pixelSize * 2.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, pixelSize * 1.5);
        ctx.lineTo(-pixelSize, pixelSize * 2.5);
        ctx.lineTo(pixelSize * 1, pixelSize * 2.5);
        ctx.closePath();
        ctx.fill();

        // 大眼睛
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-pixelSize * 1, -pixelSize * 0.3, pixelSize * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000080';
        ctx.beginPath();
        ctx.arc(-pixelSize * 1, -pixelSize * 0.3, pixelSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛高光
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-pixelSize * 1.1, -pixelSize * 0.4, pixelSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 鱼鳞花纹
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = pixelSize * 0.1;
        for(let i = -1; i <= 1; i++) {
            for(let j = -1; j <= 1; j++) {
                ctx.beginPath();
                ctx.arc(i * pixelSize * 0.8, j * pixelSize * 0.6, pixelSize * 0.2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // 嘴巴
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = pixelSize * 0.15;
        ctx.beginPath();
        ctx.moveTo(-pixelSize * 2.5, 0);
        ctx.lineTo(-pixelSize * 2, pixelSize * 0.3);
        ctx.stroke();
    }

    // 绘制星星的辅助函数
    drawStar(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        for(let i = 0; i < 5; i++) {
            ctx.lineTo(
                Math.cos((i * 4 * Math.PI) / 5) * size,
                Math.sin((i * 4 * Math.PI) / 5) * size
            );
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawDefault(ctx, pixelSize) {
        // 默认方块动物
        ctx.fillStyle = this.config.color;
        ctx.fillRect(-pixelSize, -pixelSize, pixelSize * 2, pixelSize * 2);
    }
}