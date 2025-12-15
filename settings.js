export default class SettingsManager {
    constructor() {
        // 默认设置
        this.defaultSettings = {
            spawnSpeed: 10, // 秒/只
            selectedAnimals: ['dog', 'cat', 'rabbit', 'bear', 'panda', 'pig', 'unicorn', 'frog', 'penguin', 'tiger', 'fish'],
            maxAnimals: 100,
            volumeThreshold: 30
        };

        // 当前设置
        this.settings = this.loadSettings();

        // 绑定UI元素
        this.bindElements();

        // 事件监听器
        this.onSettingsChange = null;
    }

    // 绑定UI元素
    bindElements() {
        // 设置按钮
        this.settingsBtn = document.getElementById('settings-btn');
        this.modal = document.getElementById('settings-modal');
        this.closeBtn = document.getElementById('close-settings');
        this.saveBtn = document.getElementById('save-settings');
        this.resetBtn = document.getElementById('reset-settings');

        // 设置控件
        this.spawnSpeedSlider = document.getElementById('spawn-speed');
        this.spawnSpeedValue = document.getElementById('spawn-speed-value');
        this.selectAllBtn = document.getElementById('select-all');
        this.selectNoneBtn = document.getElementById('select-none');
        this.animalCheckboxes = document.querySelectorAll('.animal-checkboxes input[type="checkbox"]');
        this.maxAnimalsInput = document.getElementById('max-animals');
        this.volumeThresholdInput = document.getElementById('volume-threshold');

        // 绑定事件
        this.settingsBtn.addEventListener('click', () => this.showModal());
        this.closeBtn.addEventListener('click', () => this.hideModal());
        this.saveBtn.addEventListener('click', () => this.saveSettings());
        this.resetBtn.addEventListener('click', () => this.resetToDefault());

        // 滑块事件
        this.spawnSpeedSlider.addEventListener('input', (e) => {
            this.updateSpawnSpeedDisplay(e.target.value);
        });

        // 全选/全不选按钮
        this.selectAllBtn.addEventListener('click', () => this.selectAllAnimals(true));
        this.selectNoneBtn.addEventListener('click', () => this.selectAllAnimals(false));

        // 点击模态框外部关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    // 显示设置模态框
    showModal() {
        this.loadSettingsToUI();
        this.modal.classList.add('active');
    }

    // 隐藏设置模态框
    hideModal() {
        this.modal.classList.remove('active');
    }

    // 加载设置到UI
    loadSettingsToUI() {
        // 生成速度
        this.spawnSpeedSlider.value = this.settings.spawnSpeed;
        this.updateSpawnSpeedDisplay(this.settings.spawnSpeed);

        // 动物种类
        const allTypes = ['dog', 'cat', 'rabbit', 'bear', 'panda', 'pig', 'unicorn', 'frog', 'penguin', 'tiger', 'fish'];
        this.animalCheckboxes.forEach(checkbox => {
            checkbox.checked = this.settings.selectedAnimals.includes(checkbox.value);
        });

        // 高级设置
        this.maxAnimalsInput.value = this.settings.maxAnimals;
        this.volumeThresholdInput.value = this.settings.volumeThreshold;
    }

    // 更新生成速度显示
    updateSpawnSpeedDisplay(value) {
        this.spawnSpeedValue.textContent = `${value}秒/只`;
    }

    // 全选/全不选动物
    selectAllAnimals(select) {
        this.animalCheckboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
    }

    // 获取选中的动物类型
    getSelectedAnimals() {
        const selected = [];
        this.animalCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selected.push(checkbox.value);
            }
        });
        return selected;
    }

    // 保存设置
    saveSettings() {
        // 获取UI中的值
        this.settings.spawnSpeed = parseInt(this.spawnSpeedSlider.value);
        this.settings.selectedAnimals = this.getSelectedAnimals();
        this.settings.maxAnimals = parseInt(this.maxAnimalsInput.value);
        this.settings.volumeThreshold = parseInt(this.volumeThresholdInput.value);

        // 验证设置
        if (!this.validateSettings()) {
            return;
        }

        // 保存到localStorage
        localStorage.setItem('morningReadingZooSettings', JSON.stringify(this.settings));

        // 触发变化事件
        if (this.onSettingsChange) {
            this.onSettingsChange(this.settings);
        }

        // 显示保存成功提示
        this.showToast('设置已保存');

        // 关闭模态框
        this.hideModal();
    }

    // 验证设置
    validateSettings() {
        // 验证生成速度
        if (this.settings.spawnSpeed < 1 || this.settings.spawnSpeed > 60) {
            this.showToast('生成速度必须在1-60秒之间');
            return false;
        }

        // 验证动物选择
        if (this.settings.selectedAnimals.length === 0) {
            this.showToast('请至少选择一种动物');
            return false;
        }

        // 验证最大动物数量
        if (this.settings.maxAnimals < 10 || this.settings.maxAnimals > 500) {
            this.showToast('最大动物数量必须在10-500之间');
            return false;
        }

        // 验证音量阈值
        if (this.settings.volumeThreshold < 0 || this.settings.volumeThreshold > 100) {
            this.showToast('音量阈值必须在0-100之间');
            return false;
        }

        return true;
    }

    // 重置为默认设置
    resetToDefault() {
        if (confirm('确定要恢复默认设置吗？')) {
            this.settings = { ...this.defaultSettings };
            this.loadSettingsToUI();
            this.showToast('已恢复默认设置');
        }
    }

    // 从localStorage加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('morningReadingZooSettings');
            if (saved) {
                const parsedSettings = JSON.parse(saved);
                // 合并默认设置，确保所有字段都存在
                return { ...this.defaultSettings, ...parsedSettings };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
        return { ...this.defaultSettings };
    }

    // 获取当前设置
    getSettings() {
        return { ...this.settings };
    }

    // 获取单个设置项
    getSetting(key) {
        return this.settings[key];
    }

    // 更新单个设置项
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    // 显示提示信息
    showToast(message, type = 'success') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
        toast.textContent = message;

        // 设置样式
        if (type === 'error') {
            toast.style.background = '#f44336';
        } else {
            toast.style.background = '#4CAF50';
        }

        // 添加到页面
        document.body.appendChild(toast);

        // 3秒后移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // 导出设置
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = 'morning-reading-zoo-settings.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // 导入设置
    importSettings(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                this.settings = { ...this.defaultSettings, ...imported };
                this.loadSettingsToUI();
                this.saveSettings();
                this.showToast('设置导入成功');
            } catch (error) {
                this.showToast('设置文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 获取动物类型的中文名称
    getAnimalNameChinese(type) {
        const names = {
            dog: '狗',
            cat: '猫',
            rabbit: '兔子',
            bear: '熊',
            panda: '熊猫',
            pig: '猪',
            unicorn: '独角兽',
            frog: '青蛙',
            penguin: '企鹅',
            tiger: '老虎',
            fish: '鱼'
        };
        return names[type] || type;
    }

    // 获取动物统计信息
    getAnimalStats(animalCounts) {
        const stats = [];
        Object.entries(animalCounts).forEach(([type, count]) => {
            stats.push({
                type: type,
                name: this.getAnimalNameChinese(type),
                count: count
            });
        });
        return stats.sort((a, b) => b.count - a.count);
    }
}