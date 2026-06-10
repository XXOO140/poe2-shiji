# POE2 Trade Filter Saver

POE2 交易网站高级过滤器模板保存器 (Tampermonkey 脚本)

## 功能

- 保存当前搜索的高级过滤器 (query.stats)
- 一键应用已保存的模板
- 自动替换 stats 并重新搜索
- 保留当前的分类、名称、价格、在线状态等条件
- 支持删除和覆盖重名模板

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 Tampermonkey 图标 → 添加新脚本
3. 复制 `poe2-filter-saver-v5.user.js` 的内容并保存

## 使用方法

1. 打开 [POE2 交易网站](https://www.pathofexile.com/trade2/search/poe2/Standard)
2. 页面右下角会出现「POE2 高级过滤器模板」面板
3. **先搜索一次**（让脚本捕获查询数据）
4. 输入模板名称，点击【保存】
5. 以后选择好武器分类后，点击【应用】即可自动套用过滤器并搜索

## 文件说明

| 文件 | 说明 |
|------|------|
| `poe2-filter-saver-v5.user.js` | 主脚本（推荐使用） |
| `poe2-filter-saver.user.js` | 早期版本 |

## 注意事项

- 脚本只保存 `query.stats`（高级过滤器），不保存武器名称、分类、价格等
- 应用模板时会保留当前页面的所有其他条件
- 需要先执行一次搜索才能保存模板
