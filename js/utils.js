/**
 * 工具函数模块
 * @description 提供通用的辅助函数
 */

/**
 * DOM选择器快捷函数
 */
export function $(selector) {
  return document.querySelector(selector);
}

export function $$(selector) {
  return document.querySelectorAll(selector);
}

/**
 * 显示/隐藏元素
 */
export function show(element) {
  if (typeof element === 'string') {
    element = $(element);
  }
  element?.classList.remove('hidden');
}

export function hide(element) {
  if (typeof element === 'string') {
    element = $(element);
  }
  element?.classList.add('hidden');
}

/**
 * 显示提示消息
 */
export function showToast(message, type = 'info', duration = 3000) {
  // 移除已存在的toast
  const existingToast = $('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // 添加样式
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '500',
    zIndex: '9999',
    animation: 'slideDown 0.3s ease'
  });

  // 根据类型设置背景色
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  toast.style.backgroundColor = colors[type] || colors.info;

  document.body.appendChild(toast);

  // 自动移除
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 二检分数转换为中考预估分数
 * @param {number} erjianScore 二检分数
 * @returns {number} 中考预估分数
 */
export function convertErjianToZhongkao(erjianScore) {
  // 福州二检满分850，中考满分900
  // 估算系数约为1.06
  const factor = 1.06;
  return Math.round(erjianScore * factor);
}

/**
 * 计算录取概率
 * @param {number} studentScore 学生预估中考分数
 * @param {number} schoolScore 学校录取分数线
 * @returns {object} 概率信息
 */
export function calculateProbability(studentScore, schoolScore) {
  const diff = studentScore - schoolScore;
  
  if (diff >= 30) {
    return { level: 'high', text: '稳妥', percent: 95 };
  } else if (diff >= 15) {
    return { level: 'high', text: '较稳', percent: 85 };
  } else if (diff >= 5) {
    return { level: 'medium', text: '可冲', percent: 70 };
  } else if (diff >= -5) {
    return { level: 'medium', text: '有风险', percent: 55 };
  } else if (diff >= -15) {
    return { level: 'low', text: '冲一冲', percent: 35 };
  } else {
    return { level: 'low', text: '风险大', percent: 20 };
  }
}

/**
 * 格式化数字
 */
export function formatNumber(num) {
  return num?.toLocaleString('zh-CN') || '暂无数据';
}

/**
 * 防抖函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 生成唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 深拷贝
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const copiedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copiedObj[key] = deepClone(obj[key]);
      }
    }
    return copiedObj;
  }
}

// 添加动画样式到head
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(styleSheet);
