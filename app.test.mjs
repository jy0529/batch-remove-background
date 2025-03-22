import { batchRemoveBackground } from './app.mjs';
import fs from 'fs';
import dotenv from 'dotenv';
const log = console.log;

dotenv.config();
const API_KEY = process.env.API_KEY;

async function test() {
    try {
      const results = await batchRemoveBackground({
        apiKey: API_KEY,
        inputDir: './files',
        outputDir: './output',
      });
      
      log('批量处理完成!');
      log(`成功: ${results.filter(r => r.success).length}`);
      log(`失败: ${results.filter(r => !r.success).length}`);
  
      // 输出失败的文件
      results.filter(r => !r.success).forEach(r => {
        log(`失败: ${r.file} - ${r.error}`);
      });

    } catch (error) {
      log('程序执行错误:', error);
    }
  }
  
  // 执行主函数
  test();
                      
              