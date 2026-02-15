# 网站待修改优化清单

更新时间：2026-02-15

## 1. SEO 与可发现性

- [x] 在 `index.html` 增加 `meta description`
- [x] 增加 Open Graph 元信息：`og:title`、`og:description`、`og:image`、`og:url`、`og:type`
- [x] 增加 Twitter Card 元信息：`twitter:card`、`twitter:title`、`twitter:description`、`twitter:image`
- [x] 增加 `canonical` 链接
- [x] 新增 `robots.txt`
- [x] 新增 `sitemap.xml`

## 2. 生产资源清理

- [x] 删除未被 `index.html` 引用的历史哈希包（如 `js/app.5cccd579.js`、`js/app.9e327b79.js`）
- [x] 删除线上不需要的 `*.map` 文件
- [x] 去除已发布 `js/css` 文件里的 `sourceMappingURL` 注释

## 3. 前端加载性能

- [x] 检查并优化 `preload` 资源，仅保留关键首屏资源
- [x] 为非关键图片增加懒加载策略（`loading=\"lazy\"` / `decoding=\"async\"`）
- [x] 检查第三方脚本加载策略（尽量 `defer` 或按需加载）

## 4. 数据请求兼容性

- [x] 清理或兼容 `http://127.0.0.1:5000` 的硬编码请求地址
- [x] 为详情页数据接口增加静态数据降级逻辑（接口不可达时不影响页面可用）
- [x] 减少控制台错误日志，避免线上出现无意义报错

## 5. 验证与发布流程

- [x] 本地启动后做首页与关键路由冒烟检查（含图片、控制台、404 请求）
- [ ] 推送后检查 GitHub Pages 构建状态为 `built`
- [ ] 对线上地址做回归验证：`https://bistu-serc.github.io/#/`
