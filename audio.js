export default class AudioDetector {
    constructor() {
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.dataArray = null;
        this.isListening = false;
        this.volumeThreshold = 30;
        this.currentVolume = 0;
        this.volumeHistory = [];
        this.maxHistorySize = 100;
        this.animationId = null;

        // 音量变化事件监听器
        this.onVolumeChange = null;
    }

    // 初始化音频系统
    async init() {
        try {
            // 请求麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;

            // 连接麦克风到分析器
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            // 初始化数据数组
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            console.log('音频系统初始化成功');
            return true;
        } catch (error) {
            console.error('音频初始化失败:', error);
            throw new Error('无法访问麦克风，请检查权限设置');
        }
    }

    // 开始监听
    start() {
        if (!this.analyser) {
            throw new Error('音频系统未初始化');
        }

        this.isListening = true;
        this.updateVolume();
        console.log('开始监听声音');
    }

    // 停止监听
    stop() {
        this.isListening = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('停止监听声音');
    }

    // 更新音量
    updateVolume() {
        if (!this.isListening) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // 计算RMS值
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        const rms = Math.sqrt(sum / this.dataArray.length);

        // 映射到0-100分贝范围
        const normalizedVolume = Math.min(100, Math.max(0, rms * 2));

        // 应用平滑处理
        this.currentVolume = this.currentVolume * 0.7 + normalizedVolume * 0.3;

        // 更新历史记录
        this.volumeHistory.push(this.currentVolume);
        if (this.volumeHistory.length > this.maxHistorySize) {
            this.volumeHistory.shift();
        }

        // 触发音量变化事件
        if (this.onVolumeChange) {
            this.onVolumeChange(this.currentVolume);
        }

        // 继续更新
        this.animationId = requestAnimationFrame(() => this.updateVolume());
    }

    // 获取当前音量
    getVolumeLevel() {
        return Math.round(this.currentVolume);
    }

    // 获取平均音量
    getAverageVolume() {
        if (this.volumeHistory.length === 0) return 0;
        const sum = this.volumeHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.volumeHistory.length);
    }

    // 设置音量阈值
    setVolumeThreshold(threshold) {
        this.volumeThreshold = Math.max(0, Math.min(100, threshold));
    }

    // 检查是否超过阈值
    isAboveThreshold() {
        return this.currentVolume >= this.volumeThreshold;
    }

    // 获取音量强度等级
    getVolumeIntensity() {
        if (this.currentVolume < this.volumeThreshold) {
            return 'silent';
        } else if (this.currentVolume < this.volumeThreshold + 20) {
            return 'low';
        } else if (this.currentVolume < this.volumeThreshold + 40) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    // 获取生成速度倍数
    getSpawnSpeedMultiplier() {
        const volume = this.currentVolume;
        const threshold = this.volumeThreshold;

        if (volume < threshold) return 0;

        // 超过阈值后，音量越大，生成速度越快
        const excessVolume = volume - threshold;
        const multiplier = 1 + (excessVolume / (100 - threshold)) * 4;

        return Math.min(multiplier, 5); // 最大5倍速
    }

    // 清理资源
    dispose() {
        this.stop();

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
            this.microphone = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
        this.dataArray = null;
        this.volumeHistory = [];

        console.log('音频资源已清理');
    }
}