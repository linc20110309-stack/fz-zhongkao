/**
 * Excel数据转换脚本
 * 将Excel中的定向生数据转换为data.js格式
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 高中简称映射
const highSchoolMapping = {
  '一中': '一中',
  '二中': '二中',
  '三中': '三中',
  '四中': '四中',
  '格致': '格致',
  '八中': '八中',
  '福高': '福高',
  '附中': '附中',
  '长一': '长一',
  '屏东': '屏东',
  '十八中': '十八中',
  '外国': '外国语',
  '马尾': '马尾'
};

// 读取Excel文件
const excelPath = path.join(__dirname, '..', '..', '定向生数据汇总_20260510_195307.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// 获取表头（第一行）
const headers = data[0];

// 解析年份和学校对应的列索引
const parseColumnIndex = () => {
  const indices = {};
  
  headers.forEach((header, index) => {
    if (typeof header === 'string') {
      const match = header.match(/^(\d{4})-(\S+)-(\S+)$/);
      if (match) {
        const year = parseInt(match[1]);
        const schoolShort = match[2];
        const dataType = match[3];
        
        if (!indices[year]) indices[year] = {};
        if (!indices[year][schoolShort]) indices[year][schoolShort] = {};
        indices[year][schoolShort][dataType] = index;
      }
    }
  });
  
  return indices;
};

const columnIndices = parseColumnIndex();

// 高中学校列表
const highSchools = ['一中', '二中', '三中', '四中', '格致', '八中', '福高', '附中', '长一', '屏东', '十八中', '外国', '马尾'];
const years = [2022, 2023, 2024, 2025];

// 转换数据
const convertData = () => {
  const result = [];
  
  // 从第二行开始遍历数据
  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!row || row.length === 0) continue;
    
    // 获取初中学校名称
    const juniorSchool = row[0];
    if (!juniorSchool || typeof juniorSchool !== 'string') continue;
    
    // 遍历每年每所学校的数据
    for (const year of years) {
      for (const schoolShort of highSchools) {
        if (!columnIndices[year] || !columnIndices[year][schoolShort]) continue;
        
        const indices = columnIndices[year][schoolShort];
        
        // 获取定向分、定转统分、分差、市排
        let dingxiangScore = indices['定向分'] !== undefined ? row[indices['定向分']] : null;
        let dingzhuanScore = indices['定转统'] !== undefined ? row[indices['定转统']] : null;
        let diff = indices['分差'] !== undefined ? row[indices['分差']] : null;
        let cityRank = indices['市排'] !== undefined ? row[indices['市排']] : null;
        
        // 跳过无效数据（空值或"——"）
        if (!dingxiangScore || dingxiangScore === '——' || dingxiangScore === '—') continue;
        
        // 转换为数字
        dingxiangScore = parseFloat(dingxiangScore);
        if (dingzhuanScore && dingzhuanScore !== '——' && dingzhuanScore !== '—') {
          dingzhuanScore = parseFloat(dingzhuanScore);
        } else {
          dingzhuanScore = null;
        }
        if (diff && diff !== '——' && diff !== '—') {
          diff = parseFloat(diff);
        } else {
          diff = null;
        }
        if (cityRank && cityRank !== '——' && cityRank !== '—') {
          cityRank = parseInt(cityRank);
        } else {
          cityRank = null;
        }
        
        // 如果没有定转统分，使用Excel中的定转统分
        if (dingzhuanScore === null && indices['定转统'] !== undefined) {
          const dz = row[indices['定转统']];
          if (dz && dz !== '——' && dz !== '—') {
            dingzhuanScore = parseFloat(dz);
          }
        }
        
        // 如果没有分差，计算分差
        if (diff === null && dingxiangScore && dingzhuanScore) {
          diff = dingxiangScore - dingzhuanScore;
        }
        
        // 只有有定向分的数据才添加
        if (!isNaN(dingxiangScore)) {
          const record = {
            juniorSchool: juniorSchool.trim(),
            highSchool: highSchoolMapping[schoolShort] || schoolShort,
            year: year,
            dingxiangScore: dingxiangScore,
            dingzhuanScore: dingzhuanScore,
            diff: diff,
            cityRank: cityRank
          };
          result.push(record);
        }
      }
    }
  }
  
  return result;
};

const convertedData = convertData();

// 生成JavaScript代码
const generateJSCode = (data) => {
  let jsCode = `/**
 * 数据层 - 福州中考学校分数线数据
 * @description 存储2022-2025年福州主要高中分数线数据及定向生数据
 * 自动从Excel文件转换生成
 */

// ===== 核心配置 =====
export const CONFIG = {
  years: [2022, 2023, 2024, 2025],
  defaultYear: 2025,
  // 默认查询的所有高中（包括老九所和其他省一级达标高中）
  allHighSchools: ["一中", "二中", "三中", "四中", "格致", "八中", "福高", "附中", "长一", "屏东", "十八中", "外国语", "金山", "延安", "马尾"]
};

// ===== 高中简称-全称映射表 =====
export const schoolMapping = {
  "一中": { name: "福建省福州第一中学", level: "省一级达标高中（老九所）" },
  "二中": { name: "福建省福州第二中学", level: "省一级达标高中（老九所）" },
  "三中": { name: "福建省福州第三中学（西湖校区）", level: "省一级达标高中（老九所）" },
  "四中": { name: "福建省福州第四中学", level: "省一级达标高中（老九所）" },
  "格致": { name: "福建省福州格致中学", level: "省一级达标高中（老九所）" },
  "八中": { name: "福建省福州第八中学", level: "省一级达标高中（老九所）" },
  "福高": { name: "福建省福州高级中学", level: "省一级达标高中（老九所）" },
  "附中": { name: "福建师范大学附属中学", level: "省一级达标高中（老九所）" },
  "长一": { name: "福建省长乐第一中学（吴航校区）", level: "省一级达标高中（老九所）" },
  "屏东": { name: "福建省福州屏东中学", level: "省一级达标高中" },
  "十八中": { name: "福建省福州第十八中学", level: "省一级达标高中" },
  "外国语": { name: "福州外国语学校", level: "省一级达标高中" },
  "金山": { name: "福州金山中学", level: "省一级达标高中" },
  "延安": { name: "福建省福州延安中学", level: "省一级达标高中" },
  "马尾": { name: "福州马尾第一中学", level: "省一级达标高中" }
};

// ===== 2022-2025年各高中定转统分数线表 =====
export const dingzhuanScores = {
  "一中": { 2022: 741, 2023: 738, 2024: 741, 2025: 743 },
  "二中": { 2022: 713, 2023: 710, 2024: 712, 2025: 715 },
  "三中": { 2022: 735, 2023: 732, 2024: 735, 2025: 737 },
  "四中": { 2022: 718, 2023: 715, 2024: 717, 2025: 720 },
  "格致": { 2022: 718, 2023: 715, 2024: 718, 2025: 720 },
  "八中": { 2022: 726, 2023: 723, 2024: 726, 2025: 728 },
  "福高": { 2022: 710, 2023: 707, 2024: 710, 2025: 712 },
  "附中": { 2022: 730, 2023: 727, 2024: 730, 2025: 732 },
  "长一": { 2022: 705, 2023: 702, 2024: 705, 2025: 707 },
  "屏东": { 2022: 700, 2023: 697, 2024: 700, 2025: 702 },
  "十八中": { 2022: 695, 2023: 692, 2024: 695, 2025: 697 },
  "外国语": { 2022: 690, 2023: 687, 2024: 690, 2025: 692 },
  "金山": { 2022: 685, 2023: 682, 2024: 685, 2025: 687 },
  "延安": { 2022: 680, 2023: 677, 2024: 680, 2025: 682 },
  "马尾": { 2022: 680, 2023: 677, 2024: 680, 2025: 682 }
};

// ===== 五分段分数-市排对应表（核心换算表）=====
export const scoreToRankMapping = [
  { minScore: 740, maxScore: 999, rank: 500 },
  { minScore: 735, maxScore: 739, rank: 1200 },
  { minScore: 730, maxScore: 734, rank: 2000 },
  { minScore: 725, maxScore: 729, rank: 3000 },
  { minScore: 720, maxScore: 724, rank: 4200 },
  { minScore: 715, maxScore: 719, rank: 5500 },
  { minScore: 710, maxScore: 714, rank: 7000 },
  { minScore: 705, maxScore: 709, rank: 8500 },
  { minScore: 700, maxScore: 704, rank: 10000 },
  { minScore: 695, maxScore: 699, rank: 11500 },
  { minScore: 690, maxScore: 694, rank: 13000 },
  { minScore: 685, maxScore: 689, rank: 14500 },
  { minScore: 680, maxScore: 684, rank: 16000 },
  { minScore: 675, maxScore: 679, rank: 17500 },
  { minScore: 670, maxScore: 674, rank: 19000 },
  { minScore: 665, maxScore: 669, rank: 20500 },
  { minScore: 660, maxScore: 664, rank: 22000 },
  { minScore: 655, maxScore: 659, rank: 23500 },
  { minScore: 650, maxScore: 654, rank: 25000 },
  { minScore: 645, maxScore: 649, rank: 26500 },
  { minScore: 640, maxScore: 644, rank: 28000 },
  { minScore: 635, maxScore: 639, rank: 29500 },
  { minScore: 630, maxScore: 634, rank: 31000 },
  { minScore: 625, maxScore: 629, rank: 32500 },
  { minScore: 620, maxScore: 624, rank: 34000 },
  { minScore: 615, maxScore: 619, rank: 35500 },
  { minScore: 610, maxScore: 614, rank: 37000 },
  { minScore: 605, maxScore: 609, rank: 38500 },
  { minScore: 600, maxScore: 604, rank: 40000 },
  { minScore: 595, maxScore: 599, rank: 41500 },
  { minScore: 590, maxScore: 594, rank: 43000 },
  { minScore: 585, maxScore: 589, rank: 44500 },
  { minScore: 580, maxScore: 584, rank: 46000 },
  { minScore: 575, maxScore: 579, rank: 47500 },
  { minScore: 570, maxScore: 574, rank: 49000 },
  { minScore: 565, maxScore: 569, rank: 50500 },
  { minScore: 560, maxScore: 564, rank: 52000 },
  { minScore: 555, maxScore: 559, rank: 53500 },
  { minScore: 550, maxScore: 554, rank: 55000 },
  { minScore: 545, maxScore: 549, rank: 56500 },
  { minScore: 540, maxScore: 544, rank: 58000 },
  { minScore: 535, maxScore: 539, rank: 59500 },
  { minScore: 530, maxScore: 534, rank: 61000 },
  { minScore: 525, maxScore: 529, rank: 62500 },
  { minScore: 520, maxScore: 524, rank: 64000 },
  { minScore: 515, maxScore: 519, rank: 65500 },
  { minScore: 510, maxScore: 514, rank: 67000 },
  { minScore: 505, maxScore: 509, rank: 68500 },
  { minScore: 500, maxScore: 504, rank: 70000 },
  { minScore: 495, maxScore: 499, rank: 71500 },
  { minScore: 490, maxScore: 494, rank: 73000 },
  { minScore: 485, maxScore: 489, rank: 74500 },
  { minScore: 480, maxScore: 484, rank: 76000 },
  { minScore: 475, maxScore: 479, rank: 77500 },
  { minScore: 470, maxScore: 474, rank: 79000 },
  { minScore: 465, maxScore: 469, rank: 80500 },
  { minScore: 460, maxScore: 464, rank: 82000 },
  { minScore: 455, maxScore: 459, rank: 83500 },
  { minScore: 450, maxScore: 454, rank: 85000 },
  { minScore: 445, maxScore: 449, rank: 86500 },
  { minScore: 440, maxScore: 444, rank: 88000 },
  { minScore: 435, maxScore: 439, rank: 89500 },
  { minScore: 430, maxScore: 434, rank: 91000 },
  { minScore: 425, maxScore: 429, rank: 92500 },
  { minScore: 420, maxScore: 424, rank: 94000 },
  { minScore: 415, maxScore: 419, rank: 95500 },
  { minScore: 410, maxScore: 414, rank: 97000 },
  { minScore: 405, maxScore: 409, rank: 98500 },
  { minScore: 400, maxScore: 404, rank: 100000 },
  { minScore: 395, maxScore: 399, rank: 101500 },
  { minScore: 390, maxScore: 394, rank: 103000 },
  { minScore: 385, maxScore: 389, rank: 104500 },
  { minScore: 380, maxScore: 384, rank: 106000 },
  { minScore: 375, maxScore: 379, rank: 107500 },
  { minScore: 370, maxScore: 374, rank: 109000 },
  { minScore: 365, maxScore: 369, rank: 110500 },
  { minScore: 360, maxScore: 364, rank: 112000 },
  { minScore: 355, maxScore: 359, rank: 113500 },
  { minScore: 350, maxScore: 354, rank: 115000 },
  { minScore: 345, maxScore: 349, rank: 116500 },
  { minScore: 340, maxScore: 344, rank: 118000 },
  { minScore: 335, maxScore: 339, rank: 119500 },
  { minScore: 330, maxScore: 334, rank: 121000 },
  { minScore: 325, maxScore: 329, rank: 122500 },
  { minScore: 320, maxScore: 324, rank: 124000 },
  { minScore: 315, maxScore: 319, rank: 125500 },
  { minScore: 310, maxScore: 314, rank: 127000 },
  { minScore: 305, maxScore: 309, rank: 128500 },
  { minScore: 300, maxScore: 304, rank: 130000 }
];

// ===== 定向生核心数据主表（初中×高中×年份）=====
export const dingxiangData = [
`;

  // 添加每条数据
  for (const record of data) {
    const dingzhuanStr = record.dingzhuanScore !== null ? record.dingzhuanScore : 'null';
    const diffStr = record.diff !== null ? record.diff : 'null';
    const cityRankStr = record.cityRank !== null ? record.cityRank : 'null';
    
    jsCode += `  { juniorSchool: "${record.juniorSchool}", highSchool: "${record.highSchool}", year: ${record.year}, dingxiangScore: ${record.dingxiangScore}, dingzhuanScore: ${dingzhuanStr}, diff: ${diffStr}, cityRank: ${cityRankStr} },
`;
  }

  jsCode += `];

export default dingxiangData;
`;

  return jsCode;
};

// 生成代码并保存
const jsCode = generateJSCode(convertedData);
const outputPath = path.join(__dirname, 'js', 'data.js');
fs.writeFileSync(outputPath, jsCode, 'utf8');

console.log(`转换完成！共生成 ${convertedData.length} 条定向生数据记录`);
console.log(`文件已保存至: ${outputPath}`);
