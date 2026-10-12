# 丹尼实验室 DENIER ATELIER

一个关于连裤袜的小型科普网站（中英双语）：纤维材质图鉴、丹尼数（Denier, D）拖拽可视化、
款式形制图谱、知名品牌巡礼、色彩效果与选购指南。

## 运行

线上版本（GitHub Pages）：<https://vhxubo.github.io/pantyhose-lab/>

本地预览——纯静态站点，无构建步骤，任选一种方式：

```bash
cd pantyhose-lab
python3 -m http.server 8931
# 打开 http://127.0.0.1:8931/
```

或 `npx http-server -p 8931`。

## 部署

推送到 `main` 即自动部署：`.github/workflows/deploy.yml` 使用官方
actions（configure-pages / upload-pages-artifact / deploy-pages），首次运行会自动启用
Pages（`enablement: true`），无需手动到仓库设置里开关。

## 功能

- **验布光箱（核心交互）**：拖动底部刻度尺 5D → 200D，腿模上袜子的透明度、光泽、针织密度实时渐变；
  可切换四种材质（锦纶 / 天鹅绒 / 棉 / 羊毛）与十种颜色，同一 D 数呈现不同观感。
  深色袜采用 `multiply` 混合模拟真实染色，浅色袜普通覆盖。
- **丹尼尺**：首屏色阶条直观展示 5D–200D 的全部变化，点击任一格载入光箱。
- **深链**：`?d=120&mat=wool&color=%23232B45` 可直达指定光箱状态。
- **纤维材质**：六种纤维样本卡（CSS 织物纹理），附手感 / 季节 / 常见 D 数。
- **款式形制**：十四种款式图谱——经典薄透、T裆、棉裆、收腹、压力分级、防勾丝、
  露趾、踩脚、网袜、罗纹、蕾丝、提花、假高筒、光腿神器，每款配原创 SVG 平铺示意图
  （共享平铺轮廓 + 网纹 / 罗纹 / 蕾丝 / 提花等织纹 pattern，金色虚线标出该款特征）。
- **品牌馆**：欧洲 / 美洲 / 亚洲十六个代表品牌巡礼（产地 · 创立 · 定位 · 招牌特点），
  科普性梳理、排名不分先后。
- **色彩**：每色 8D / 40D / 120D 三段试色卡，点击同步到光箱。
- **实拍图库**：7 张 Wikimedia Commons 自由授权图片（CC0 / CC BY / CC BY-SA），署名见
  `assets/img/CREDITS.md`（CC BY-SA 系列若公开使用须保留署名）。
- 响应式（桌面 / 移动端）、键盘可访问（原生 range 滑杆 + aria 标注）、尊重 `prefers-reduced-motion`。
- **i18n**：导航右侧 中/EN 一键切换；中文为页面源文案（无 JS 兜底），英文覆盖见 `js/i18n.js`。
  语言偏好存 `localStorage`，支持 `?lang=en` 深链；JS 生成的文案（材质注释、色名、分类提示、图库说明）随切换重建。

## 结构

```
pantyhose-lab/
├── index.html          # 页面结构 + 腿模 / 平铺图 / 款式示意图 SVG
├── css/style.css       # 样本册 × 验布光箱双世界设计系统
├── js/i18n.js          # 英文覆盖词典（中文为源文案）
├── js/app.js           # D 数→透明度/光泽映射、材质修正、针织密度透镜（canvas）、i18n 切换
└── assets/img/         # 实拍图片 + CREDITS.md 授权署名
```

D 数映射：`alpha = clamp((D/200)^0.5 × 材质系数, 0.06, 0.96)`；光泽随 D 数升高消退（哑光化）；
针织透镜的纱线数量与粗细随 D 数增加，材质决定模糊与线宽。

非商业科普项目。界面与插画（腿模、平铺线稿）为原创 SVG。
