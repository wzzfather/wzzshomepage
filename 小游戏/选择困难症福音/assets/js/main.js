// 主页导航功能
function navigateToGame(gameType) {
    const gameUrls = {
        'dice': 'games/dice/index.html',
        'wheel': 'games/wheel/index.html',
        'coin': 'games/coin/index.html'
    };
    
    if (gameUrls[gameType]) {
        window.location.href = gameUrls[gameType];
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加页面加载动画
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // 添加键盘导航支持
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case '1':
                navigateToGame('dice');
                break;
            case '2':
                navigateToGame('wheel');
                break;
            case '3':
                navigateToGame('coin');
                break;
        }
    });
}); 