/**
 * 主程序入口
 * @description 福州中考定向生查询
 */

import { $, $$, show, hide, showToast } from './utils.js';
import { 
  CONFIG, 
  getJuniorSchoolList,
  getAllHighSchools,
  queryDingxiangData 
} from './data.js';

/**
 * 应用状态
 */
var state = {
  dxCurrentResults: [],
  dxCurrentSort: 'score-desc',
  selectedHighSchools: [],
  searchKeyword: ''
};

/**
 * 初始化应用
 */
function init() {
  console.log('福州中考定向生查询系统启动');
  
  // 初始化UI
  initDxEventListeners();
  initCombobox();  // 初始化初中学校下拉搜索
  
  // 显示欢迎提示
  showToast('欢迎使用福州中考定向生查询系统！', 'info', 3000);
}

/**
 * 初始化定向生查询事件监听
 */
function initDxEventListeners() {
  // 定向生搜索按钮
  var dxSearchBtn = $('#dxSearchBtn');
  if (dxSearchBtn) dxSearchBtn.addEventListener('click', handleDxSearch);
  
  // 定向生重置按钮
  var dxResetBtn = $('#dxResetBtn');
  if (dxResetBtn) dxResetBtn.addEventListener('click', handleDxReset);
  
  // 定向生排序按钮
  $$('.dx-sort-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { handleDxSort(btn.dataset.sort); });
  });
  
  // 一键复制按钮
  var copyBtn = $('#copyResultBtn');
  if (copyBtn) copyBtn.addEventListener('click', handleCopyResult);
  
  // 年份筛选变化时清空初中选择
  var dxYearFilter = $('#dxYearFilter');
  if (dxYearFilter) dxYearFilter.addEventListener('change', function() {
    var input = $('#juniorSchoolSearch');
    if (input) {
      input.value = '';
      state.selectedJuniorSchool = '';
    }
  });
}

/**
 * Combobox下拉搜索组件初始化
 */
function initCombobox() {
  console.log('initCombobox called');
  
  var input = document.getElementById('juniorSchoolSearch');
  var dropdown = document.getElementById('juniorSchoolDropdown');
  var hiddenInput = document.getElementById('juniorSchoolValue');
  
  console.log('input:', input);
  console.log('dropdown:', dropdown);
  
  if (!input || !dropdown) {
    console.log('initCombobox: input or dropdown not found');
    return;
  }
  
  // 测试原生事件监听
  input.addEventListener('input', function(e) {
    console.log('NATIVE input event fired, value:', e.target.value);
  });
  
  // 尝试oninput
  input.oninput = function(e) {
    console.log('ONINPUT fired, value:', e.target.value);
  };
  
  var allSchools = getJuniorSchoolList();
  console.log('allSchools:', allSchools);
  
  var highlightedIndex = -1;
  
  // 更新下拉列表
  function updateDropdown(schools, keyword) {
    var html = '';
    if (schools.length === 0) {
      html = '<div class="combobox-option" style="color: var(--text-secondary);">未找到匹配学校</div>';
    } else {
      schools.forEach(function(school, index) {
        var highlighted = index === highlightedIndex ? 'highlighted' : '';
        // 高亮匹配的关键词
        var displayName = school;
        if (keyword) {
          var regex = new RegExp('(' + escapeRegex(keyword) + ')', 'gi');
          displayName = school.replace(regex, '<strong>$1</strong>');
        }
        html += '<div class="combobox-option ' + highlighted + '" data-school="' + school + '">' + displayName + '</div>';
      });
    }
    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
  }
  
  // 选中学校
  function selectSchool(school) {
    input.value = school;
    hiddenInput.value = school;
    state.selectedJuniorSchool = school;
    dropdown.classList.add('hidden');
    highlightedIndex = -1;
    
    // 触发搜索
    handleDxSearchWithSchool(school);
  }
  
  // 隐藏下拉
  function hideDropdown() {
    dropdown.classList.add('hidden');
    highlightedIndex = -1;
  }
  
  // 输入事件
  input.addEventListener('input', function(e) {
    console.log('input event fired, value:', e.target.value);
    var keyword = e.target.value.trim();
    state.searchKeyword = keyword;
    highlightedIndex = -1;
    
    if (!keyword) {
      hideDropdown();
      return;
    }
    
    var filtered = allSchools.filter(function(s) {
      return s.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
    });
    
    console.log('filtered schools:', filtered);
    updateDropdown(filtered, keyword);
  });
  
  // 也添加keyup事件作为备份
  input.addEventListener('keyup', function(e) {
    console.log('keyup event fired, value:', e.target.value);
  });
  
  // 点击选项
  dropdown.addEventListener('click', function(e) {
    var option = e.target.closest('.combobox-option');
    if (option && option.dataset.school) {
      selectSchool(option.dataset.school);
    }
  });
  
  // 键盘导航
  input.addEventListener('keydown', function(e) {
    var keyword = input.value.trim();
    var filtered = keyword ? allSchools.filter(function(s) {
      return s.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
    }) : allSchools;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, filtered.length - 1);
        updateDropdown(filtered, keyword);
        scrollToHighlighted();
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
        updateDropdown(filtered, keyword);
        scrollToHighlighted();
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          selectSchool(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        hideDropdown();
        break;
    }
  });
  
  // 点击外部关闭
  document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });
  
  // 滚动到高亮项
  function scrollToHighlighted() {
    var options = dropdown.querySelectorAll('.combobox-option');
    if (options[highlightedIndex]) {
      options[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  // 转义正则特殊字符
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// 处理带学校的定向生搜索
function handleDxSearchWithSchool(juniorSchool) {
  var year = parseInt($('#dxYearFilter').value) || CONFIG.defaultYear;
  var highSchools = getAllHighSchools(); // 查询所有高中（老九所+其他省一级达标高中）
  
  var filters = {
    year: year,
    highSchools: highSchools,
    juniorSchool: juniorSchool
  };

  var results = queryDingxiangData(filters);
  
  state.dxCurrentResults = results;
  renderDxResults();
  
  if (results.length > 0) {
    showToast('找到 ' + results.length + ' 条定向生数据', 'success', 2000);
  }
}

/**
 * 处理定向生搜索
 */
function handleDxSearch() {
  var year = parseInt($('#dxYearFilter').value) || CONFIG.defaultYear;
  var highSchools = state.selectedHighSchools.length > 0 ? state.selectedHighSchools : getAllHighSchools();
  var juniorSchool = state.selectedJuniorSchool || '';

  var filters = {
    year: year,
    highSchools: highSchools,
    juniorSchool: juniorSchool
  };

  var results = queryDingxiangData(filters);
  
  state.dxCurrentResults = results;
  renderDxResults();
}

/**
 * 处理定向生重置
 */
function handleDxReset() {
  var yearSelect = $('#dxYearFilter');
  if (yearSelect) yearSelect.value = CONFIG.defaultYear;
  
  var juniorSearch = $('#juniorSchoolSearch');
  if (juniorSearch) {
    juniorSearch.value = '';
    state.searchKeyword = '';
  }
  
  var juniorSelect = $('#juniorSchoolSelect');
  if (juniorSelect) {
    juniorSelect.value = '';
    state.selectedJuniorSchool = '';
    // 重新加载所有学校
    handleJuniorSchoolSearch('');
  }
  
  state.selectedHighSchools = [];
  
  handleDxSort('score-desc');
  state.dxCurrentResults = [];
  renderDxResults();
  
  showToast('已重置筛选条件', 'info');
}

/**
 * 处理定向生排序
 */
function handleDxSort(sortType) {
  state.dxCurrentSort = sortType;

  $$('.dx-sort-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.sort === sortType);
  });

  renderDxResults();
}

/**
 * 渲染定向生结果
 */
function renderDxResults() {
  var resultStats = $('#dxResultStats');
  var sortControl = $('#dxSortControl');
  var resultTable = $('#dxResultTable');
  var noResult = $('#dxNoResult');
  var resultCount = $('#dxResultCount');
  var tbody = $('#dxResultTableBody');

  var sortedResults = sortDxResults([].concat(state.dxCurrentResults));

  if (resultCount) resultCount.textContent = sortedResults.length;
  if (resultStats) show(resultStats);
  if (sortControl) show(sortControl);

  if (sortedResults.length === 0) {
    if (resultTable) hide(resultTable);
    if (noResult) show(noResult);
    return;
  }

  if (noResult) hide(noResult);
  if (resultTable) show(resultTable);

  var html = '';
  sortedResults.forEach(function(item) {
    var diffClass = item.diff < 0 ? 'diff-negative' : (item.diff > 0 ? 'diff-positive' : '');
    
    html += '<tr>';
    html += '<td><strong>' + item.juniorSchool + '</strong></td>';
    html += '<td>' + item.highSchool + '</td>';
    html += '<td>' + item.year + '年</td>';
    html += '<td class="score-cell">' + item.dingxiangScore + ' 分</td>';
    html += '<td>' + (item.cityRank ? item.cityRank : '-') + '</td>';
    html += '<td>' + item.dingzhuanScore + ' 分</td>';
    html += '<td class="' + diffClass + '">' + item.diff + '</td>';
    html += '</tr>';
  });
  if (tbody) tbody.innerHTML = html;
}

/**
 * 排序定向生结果
 */
function sortDxResults(results) {
  var sortType = state.dxCurrentSort;
  
  return results.sort(function(a, b) {
    switch (sortType) {
      case 'score-desc':
        return b.dingxiangScore - a.dingxiangScore;
      case 'score-asc':
        return a.dingxiangScore - b.dingxiangScore;
      case 'year-desc':
        return b.year - a.year;
      case 'year-asc':
        return a.year - b.year;
      case 'school-asc':
        return a.juniorSchool.localeCompare(b.juniorSchool, 'zh-CN');
      case 'school-desc':
        return b.juniorSchool.localeCompare(a.juniorSchool, 'zh-CN');
      default:
        return 0;
    }
  });
}

/**
 * 处理复制结果
 */
function handleCopyResult() {
  var results = sortDxResults([].concat(state.dxCurrentResults));
  
  if (results.length === 0) {
    showToast('没有可复制的数据', 'warning');
    return;
  }

  var text = '';
  results.forEach(function(item) {
    text += item.juniorSchool + '\t' + item.highSchool + '\t' + item.year + '年\t' + item.dingxiangScore + '分\t' + (item.cityRank || '-') + '\t' + item.dingzhuanScore + '分\t' + item.diff + '\n';
  });

  var header = '毕业初中\t目标高中\t年份\t定向分\t对应市排\t定转统\t分差\n';
  
  navigator.clipboard.writeText(header + text).then(function() {
    showToast('已复制到剪贴板，共 ' + results.length + ' 条记录', 'success');
  }).catch(function() {
    showToast('复制失败，请手动复制', 'error');
  });
}

/**
 * 页面加载完成后初始化
 */
function onDOMReady() {
  console.log('DOMContentLoaded fired');
  
  // 初始化定向生下拉默认值
  var dxYearFilter = $('#dxYearFilter');
  if (dxYearFilter) dxYearFilter.value = CONFIG.defaultYear;
  
  // 页面加载时显示定向生查询空结果提示
  var noResult = $('#dxNoResult');
  if (noResult) show(noResult);
  
  // 使用setTimeout确保DOM完全加载
  setTimeout(function() {
    console.log('Calling init()');
    init();
  }, 100);
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDOMReady);
} else {
  // DOM已经加载完成
  onDOMReady();
}