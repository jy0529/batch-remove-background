import { rembg } from '@remove-background-ai/rembg.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';


const log = console.log;

/**
 * 批量移除图片背景
 * @param {Object} options - 配置选项
 * @param {string} options.apiKey - API密钥
 * @param {string} options.inputDir - 输入目录路径
 * @param {string} options.outputDir - 输出目录路径
 * @param {string[]} [options.extensions=['png', 'jpg', 'jpeg']] - 要处理的文件扩展名
 * @param {boolean} [options.createOutputDir=true] - 如果输出目录不存在是否创建
 * @param {Function} [options.onProgress] - 进度回调函数
 * @param {Function} [options.onError] - 错误处理回调函数
 * @returns {Promise<Array>} 处理结果数组
 */
export async function batchRemoveBackground({
  apiKey,
  inputDir,
  outputDir,
  extensions = ['png', 'jpg', 'jpeg'],
  createOutputDir = true,
  onProgress = () => {},
  onError = (err) => console.error('处理错误:', err)
}) {
  // 验证必要参数
  if (!apiKey) throw new Error('缺少 API 密钥');
  if (!inputDir) throw new Error('缺少输入目录');
  if (!outputDir) throw new Error('缺少输出目录');

  // 确保输入目录存在
  try {
    await fs.promises.access(inputDir);
  } catch (error) {
    throw new Error(`输入目录不存在: ${inputDir}`);
  }

  // 确保输出目录存在
  try {
    await fs.promises.access(outputDir);
  } catch (error) {
    if (createOutputDir) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    } else {
      throw new Error(`输出目录不存在: ${outputDir}`);
    }
  }

  // 获取所有符合扩展名的文件
  const files = (await fs.promises.readdir(inputDir))
    .filter(file => {
      const ext = path.extname(file).toLowerCase().substring(1);
      return extensions.includes(ext);
    });

  if (files.length === 0) {
    log(`在 ${inputDir} 中没有找到符合条件的图片文件`);
    return [];
  }

  log(`找到 ${files.length} 个文件需要处理`);
  
  const results = [];

  const promises = [];
  
  // 处理每个文件
  files.forEach((file, i) => {
    const inputPath = path.join(inputDir, file);
    const outputFileName = `${path.parse(file).name}.png`;
    const outputPath = path.join(outputDir, outputFileName);
      onProgress({
        current: i + 1,
        total: files.length,
        file,
        percent: Math.round(((i + 1) / files.length) * 100)
      });
      const processPromise = processImage(apiKey, inputPath, outputPath).then(() => {
        results.push({
          file,
          success: true,
          inputPath,
          outputPath,
        });
      }).catch((error) => {
        results.push({
          file,
          success: false,
          error: error.message,
          inputPath
        });
      });
      promises.push(processPromise);
  });

  await Promise.all(promises);
  
  return results;
}

/**
 * 处理单个图片
 * @param {string} apiKey - API密钥
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 * @returns {Promise<Object>} 处理结果
 */
export async function processImage(apiKey, inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    log(`开始处理: ${inputPath}`);
    rembg({
      apiKey,
      inputImage: inputPath,
      outputImagePath: outputPath,
      onDownloadProgress: () => {},
      onUploadProgress: () => {}
    }).then(({ outputImagePath, cleanup }) => {
      fs.promises.copyFile(outputImagePath, outputPath)
        .then(() => {
            cleanup();
            resolve({ outputPath });
        })
    })
    .catch((error) => {
      reject(error);
    });
  });
}

			