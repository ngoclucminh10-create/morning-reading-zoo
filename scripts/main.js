import AudioDetector from './audio.js';
import AnimalManager from './animals.js';
import SettingsManager from './settings.js';

class MorningReadingZoo {
    constructor() {
        this.audio = null;
        this.animals = null;
        this.settings = null;
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.totalSpawnedAnimals = 0;
        this.startTime = null;

        // UI元素
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.mainScreen = document.getElementById('main-screen');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.welcomeStartBtn = document.getElementById('welcome-start-btn');
        this.volumeValue = document.getElementById('volume-value');
        this.volumeFill = document.getElementById('volume-fill');
        this.animalCount = document.getElementById('animal-count');
        this.avgVolume = document.getElementById('avg-volume');
        this.currentTime = document.getElementById('current-time');
        this.errorToast = document.getElementById('error-toast');
        this.errorMessage = document.getElementById('error-message');

        // 速度控制相关
        this.currentSpeedDisplay = document.getElementById('current-speed-value');
        this.currentSpeedMultiplier = 2; // 默认正常速度

        // 初始化
        this.init();
    }

    async init() {
        try {
            // 初始化设置管理器
            this.settings = new SettingsManager();
            this.settings.onSettingsChange = (settings) => this.onSettingsChange(settings);

            // 初始化画布
            const canvas = document.getElementById('zoo-canvas');
            this.animals = new AnimalManager(canvas);

            // 绑定事件
            this.bindEvents();

            // 更新时间显示
            this.updateTime();

            console.log('应用初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }

    bindEvents() {
        // 欢迎界面开始按钮
        this.welcomeStartBtn.addEventListener('click', () => this.start());

        // 主界面控制按钮
        this.startBtn.addEventListener('click', () => this.startReading());
        this.pauseBtn.addEventListener('click', () => this.pauseReading());
        this.clearBtn.addEventListener('click', () => this.clearZoo());

        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // 窗口大小改变
        window.addEventListener('resize', () => {
            this.animals.resizeCanvas();
        });

        // 页面卸载时清理资源
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // 立即绑定速度按钮（不使用setTimeout）
        this.bindSpeedButtons();
    }

    // 绑定速度控制按钮
    bindSpeedButtons() {
        // 使用多种选择器确保能找到按钮
        this.speedButtons = document.querySelectorAll('.speed-btn');

        if (this.speedButtons && this.speedButtons.length > 0) {
            console.log('找到速度按钮:', this.speedButtons.length, '个');

            this.speedButtons.forEach((btn, index) => {
                console.log(`绑定第${index + 1}个按钮:`, btn.textContent, btn.dataset.speed);

                // 移除之前的事件监听器（如果有）
                btn.replaceWith(btn.cloneNode(true));

                // 重新获取按钮引用并绑定事件
                const newBtn = document.querySelectorAll('.speed-btn')[index];
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('速度按钮被点击:', e.target.textContent, e.target.dataset.speed);
                    this.changeSpeed(e);
                });

                // 添加视觉反馈
                newBtn.addEventListener('mouseenter', () => {
                    console.log('鼠标悬停在按钮上:', newBtn.textContent);
                });
            });

            console.log('速度按钮绑定完成');
        } else {
            console.error('未找到速度按钮，尝试其他方法...');
            // 备用方法：使用事件委托
            document.addEventListener('click', (e) => {
                if (e.target && e.target.classList.contains('speed-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('通过事件委托捕获速度按钮点击:', e.target.textContent);
                    this.changeSpeed(e);
                }
            });
        }
    }

    // 开始应用
    async start() {
        try {
            this.showLoading(true);

            // 初始化音频系统
            this.audio = new AudioDetector();
            this.audio.onVolumeChange = (volume) => this.onVolumeChange(volume);
            await this.audio.init();

            // 应用设置
            this.applySettings();

            // 切换到主界面
            this.welcomeScreen.classList.remove('active');
            this.mainScreen.classList.add('active');

            // 开始游戏循环
            this.gameLoop();

            console.log('应用启动成功');
        } catch (error) {
            console.error('启动失败:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 开始早读
    startReading() {
        if (!this.audio) {
            this.showError('音频系统未初始化');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();

        // 开始监听声音
        this.audio.start();

        // 更新按钮状态
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;

        this.showToast('早读开始！大声朗读吧！');
    }

    // 暂停早读
    pauseReading() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.audio.stop();
            this.pauseBtn.textContent = '继续';
            this.showToast('已暂停');
        } else {
            this.audio.start();
            this.pauseBtn.textContent = '暂停';
            this.showToast('继续早读！');
        }
    }

    // 清空动物园
    clearZoo() {
        if (confirm('确定要清空所有动物吗？')) {
            this.animals.clear();
            this.totalSpawnedAnimals = 0;
            this.updateStats();
            this.showToast('动物园已清空');
        }
    }

    // 打开设置
    openSettings() {
        if (this.settings) {
            this.settings.showModal();
        } else {
            console.error('设置管理器未初始化');
        }
    }

    // 游戏主循环
    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
        this.lastTime = currentTime;

        if (this.isRunning && !this.isPaused) {
            // 获取当前音量
            const currentVolume = this.audio ? this.audio.getVolumeLevel() : 0;

            // 更新动物，传入当前音量
            this.animals.update(deltaTime, currentVolume);

            // 检查是否应该生成新动物
            if (this.audio.isAboveThreshold()) {
                // 获取音频速度倍数（基于音量）
                const audioSpeedMultiplier = this.audio.getSpawnSpeedMultiplier();

                // 综合速度 = 用户设置的速度 × 音量速度
                const totalSpeedMultiplier = this.currentSpeedMultiplier * audioSpeedMultiplier;

                // 检查是否可以生成（传入综合速度倍数）
                if (this.animals.shouldSpawnAnimal(currentTime, totalSpeedMultiplier)) {
                    // 增加生成概率，让效果更明显
                    const spawnChance = Math.min(0.8, totalSpeedMultiplier * 0.15); // 最高80%概率

                    if (Math.random() < spawnChance) {
                        const animal = this.animals.spawnAnimal();
                        if (animal) {
                            this.totalSpawnedAnimals++;
                            this.onAnimalSpawned(animal);
                            console.log(`生成动物! 速度倍数: ${totalSpeedMultiplier.toFixed(2)}, 概率: ${(spawnChance * 100).toFixed(1)}%, 当前音量: ${currentVolume.toFixed(1)}dB`);
                        }
                    }
                }
            }
        } else {
            // 即使暂停时也要更新动物（让它们可以消失）
            const currentVolume = this.audio ? this.audio.getVolumeLevel() : 0;
            this.animals.update(deltaTime, currentVolume);
        }

        // 渲染
        this.animals.render();

        // 继续循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // 音量变化处理
    onVolumeChange(volume) {
        // 更新音量显示
        this.volumeValue.textContent = Math.round(volume);
        this.volumeFill.style.width = `${Math.min(100, volume)}%`;

        // 根据音量改变音量条颜色
        if (volume < 30) {
            this.volumeFill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        } else if (volume < 60) {
            this.volumeFill.style.background = 'linear-gradient(90deg, #FFC107, #FF9800)';
        } else {
            this.volumeFill.style.background = 'linear-gradient(90deg, #FF5722, #F44336)';
        }

        // 更新平均音量
        this.updateStats();
    }

    // 设置变化处理
    onSettingsChange(settings) {
        this.applySettings();
        console.log('设置已更新:', settings);
    }

    // 应用设置
    applySettings() {
        const settings = this.settings.getSettings();

        // 应用到动物管理器（考虑速度倍数）
        this.applySpeedToAnimals();
        this.animals.setMaxAnimals(settings.maxAnimals);
        this.animals.setSelectedAnimalTypes(settings.selectedAnimals);

        // 应用到音频检测器
        if (this.audio) {
            this.audio.setVolumeThreshold(settings.volumeThreshold);
        }
    }

    // 动物生成事件
    onAnimalSpawned(animal) {
        // 添加生成动画效果
        this.updateStats();

        // 可以在这里添加音效或其他视觉效果
    }

    // 更新统计信息
    updateStats() {
        // 更新动物数量
        this.animalCount.textContent = this.animals.getAnimalCount();

        // 更新平均音量
        if (this.audio) {
            this.avgVolume.textContent = this.audio.getAverageVolume();
        }
    }

    // 更新时间显示
    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.currentTime.textContent = `${hours}:${minutes}`;

        // 每秒更新一次
        setTimeout(() => this.updateTime(), 1000);
    }

    // 显示错误信息
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorToast.classList.add('show');

        setTimeout(() => {
            this.errorToast.classList.remove('show');
        }, 5000);
    }

    // 显示提示信息
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        toast.style.background = '#4CAF50';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        if (show) {
            this.welcomeStartBtn.textContent = '加载中...';
            this.welcomeStartBtn.disabled = true;
        } else {
            this.welcomeStartBtn.textContent = '开始使用';
            this.welcomeStartBtn.disabled = false;
        }
    }

    // 清理资源
    cleanup() {
        if (this.audio) {
            this.audio.dispose();
        }

        console.log('资源已清理');
    }

    // 改变动物生成速度
    changeSpeed(e) {
        // 确保事件对象存在
        if (!e || !e.target) {
            console.error('速度切换事件无效');
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const target = e.target;
        const speedMultiplier = parseFloat(target.dataset.speed);

        // 验证速度倍数
        if (isNaN(speedMultiplier)) {
            console.error('无效的速度倍数:', target.dataset.speed);
            return;
        }

        console.log('点击速度按钮:', target.textContent, '倍数:', speedMultiplier);

        // 重新获取所有速度按钮
        const allSpeedButtons = document.querySelectorAll('.speed-btn');
        console.log('找到速度按钮总数:', allSpeedButtons.length);

        // 更新按钮状态
        allSpeedButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        target.classList.add('active');

        // 更新速度倍数
        this.currentSpeedMultiplier = speedMultiplier;
        console.log('速度倍数已更新为:', this.currentSpeedMultiplier);

        // 更新显示文本
        const speedText = target.textContent;
        if (this.currentSpeedDisplay) {
            this.currentSpeedDisplay.textContent = speedText;
        }

        // 应用到动物管理器
        this.applySpeedToAnimals();

        // 显示提示
        this.showToast(`生成速度已设置为: ${speedText}`);
        console.log('速度设置完成:', speedText, '倍数:', speedMultiplier);

        // 立即重置生成计时器，让新速度立即生效
        if (this.animals) {
            this.animals.lastSpawnTime = 0;
        }
    }

    // 应用速度到动物管理器
    applySpeedToAnimals() {
        if (this.animals) {
            // 设置中的spawnSpeed是基础值（秒）
            const baseSpeed = this.settings.getSetting('spawnSpeed') || 10;

            // 使用更合理的速度计算：基础间隔 / 速度倍数
            // 0.5x = 20秒, 1x = 10秒, 2x = 5秒, 3x = 3.3秒, 5x = 2秒
            const adjustedInterval = (baseSpeed / this.currentSpeedMultiplier) * 1000;

            this.animals.setSpawnInterval(adjustedInterval);
            console.log(`动物生成间隔已设置为: ${adjustedInterval}ms (基础: ${baseSpeed}s, 倍数: ${this.currentSpeedMultiplier}x)`);
        }
    }

    // 获取应用状态
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            animalCount: this.animals.getAnimalCount(),
            totalSpawned: this.totalSpawnedAnimals,
            currentVolume: this.audio ? this.audio.getVolumeLevel() : 0,
            elapsedTime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
            speedMultiplier: this.currentSpeedMultiplier
        };
    }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    window.zooApp = new MorningReadingZoo();
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    if (window.zooApp) {
        window.zooApp.showError('发生了一个错误，请刷新页面重试');
    }
});

// 处理未捕获的Promise错误
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
    if (window.zooApp) {
        window.zooApp.showError('发生了一个错误，请刷新页面重试');
    }
});