// 检查部署问题的脚本
// 在浏览器控制台运行

console.log('=== 部署检查开始 ===');

// 1. 检查是否在 HTTPS
console.log('1. 协议检查:', location.protocol);
if (location.protocol !== 'https:') {
    console.error('❌ 需要 HTTPS！');
}

// 2. 检查文件加载
console.log('2. 文件加载检查:');

// 检查 CSS
const cssLink = document.querySelector('link[href="styles/style.css"]');
if (cssLink) {
    fetch('styles/style.css')
        .then(r => r.ok ? console.log('✅ CSS 加载成功') : console.error('❌ CSS 加载失败'))
        .catch(e => console.error('❌ CSS 错误:', e));
} else {
    console.error('❌ 没有找到 CSS 链接');
}

// 3. 检查 JavaScript 模块
const scriptTag = document.querySelector('script[src="scripts/main.js"]');
if (scriptTag) {
    console.log('✅ 找到主脚本标签');
    // 检查其他 JS 文件
    const jsFiles = [
        'scripts/audio.js',
        'scripts/animals.js',
        'scripts/settings.js'
    ];

    jsFiles.forEach(file => {
        fetch(file)
            .then(r => r.ok ? console.log(`✅ ${file} 加载成功`) : console.error(`❌ ${file} 加载失败`))
            .catch(e => console.error(`❌ ${file} 错误:`, e));
    });
} else {
    console.error('❌ 没有找到主脚本标签');
}

// 4. 检查按钮
const startBtn = document.getElementById('welcome-start-btn');
if (startBtn) {
    console.log('✅ 找到开始按钮');
    startBtn.addEventListener('click', () => {
        console.log('开始按钮被点击！');
    });
} else {
    console.error('❌ 没有找到开始按钮');
}

console.log('=== 部署检查结束 ===');