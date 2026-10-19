# 宋培恩 — 作品与探索

React + Vite 个人网站，所有页面使用炭黑底色（#101014）与柔白文字，最大内容版心 1700px，适配桌面和手机。作品卡片中的配色属于作品图像。

## 运行

安装 Node.js 后运行 `npm install`、`npm run dev`。

本地地址：http://127.0.0.1:5175/ 。生产构建：`npm run build`。

### Windows 稳定启动

双击根目录的 `启动网站.cmd`。它使用项目内的便携 Node.js，将隐藏运行的 `Run-Website.ps1` 注册为当前用户的 Windows 计划任务 `SongPeienLocalWebsite`，并打开浏览器。守护脚本在 Vite 退出后间隔 3 秒重新启动；任务配置登录启动、失败重启和每分钟重复触发，运行期间忽略重复启动。此任务仅监听本机 `127.0.0.1:5175`。电脑休眠、关机或用户注销期间，本地网站不可访问。

启动与退出记录写入 `.runtime/website-supervisor.log`，最近一次 Vite 输出写入 `.runtime/vite.stdout.log` 和 `.runtime/vite.stderr.log`，用于区分应用错误与外部中断。

双击 `停止网站.cmd` 可停止服务并禁用登录启动；再次运行启动脚本即可恢复。如果以后移动项目，请先停止，再到新目录运行启动脚本以更新任务路径。启动脚本只对自身 PowerShell 进程使用执行策略参数，不更改系统执行策略。诊断入口：Windows 任务计划程序中的上述任务。

工作区已有便携 Node，PowerShell 可直接启动：

```powershell
& .\.runtime\node-v22.14.0-win-x64\node.exe .\node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5175 --strictPort
```

上述命令仅在前台临时运行；日常使用建议通过启动脚本托管服务。

## 内容

- 首页、关于、作品、联系四个模块。
- 姓名：宋培恩 / SONG PEIEN；邮箱：songpeien@163.com。
- 三组抽象构图为布局示意，非真实项目；卡片和详情均有标注。
- 首屏银白机械手参考用户提供的图像，素材为 `public/media/reaching-hands-silver-v2.png`。
- 双手起点按参考图设置，指尖初始位于页面约 34% 和 67% 的横向位置，自动靠近、轻触、再分开；每轮 12 秒，无限循环。光圈本体固定大小和透明度，仅最外缘的彩色光带以 12 秒一轮流转；移出可视区时与双手一起暂停。
- 根据用户明确要求，双手循环在减少动态效果设置下也保留，其余非必要动效仍尊重系统设置。
- 联系页中央展示抬头雕像，素材为 `public/media/contact-sculpture-iridescent-v2.png`，通过 DitherVeil 实时生成点阵；鼠标划过显露青蓝、紫粉、橙金虹彩金属渐变，点击产生涟漪。完整提示词见 `public/media/iridescent-sculpture-prompt.md`。
- 图像通过内置 image_gen 工具生成，完整提示词见 `public/media/asset-prompts-v2.md`。

## 文件与交互

- `src/main.jsx`：页面内容和作品弹窗。
- `src/styles.css`：基础布局和作品区域。
- `src/hero.css` 与 `src/components/HeroHands.jsx`：导航、首屏和双手循环。
- `src/contact.css` 与 `src/components/DitherVeil.jsx`：居中雕像排版和基于 ogl 的交互点阵，源于用户提供的 React Bits 组件。
- DitherVeil 离开可视区或隐藏标签页时停止渲染；WebGL2 不可用时显示静态底图。
- 支持锚点导航、当前栏目提示、弹窗 Esc 关闭与焦点恢复。
- 图片与字体均不依赖远程服务，无后端。
- 顶部导航只保留居中的“精选作品 / 联系”；关于模块保留在正文中。
- 联系区侧边文案改为“一个新想法，也许就是下一段故事的开始。”
- 雕像展示区域已放大，保留居中与左右留白；手机端同步增加展示高度和下方文案间距。
## 深色主题

- 导航、正文、作品展示、联系页和弹窗均已适配深色；浏览器 theme-color 与 color-scheme 同步。
- 雕像使用浅色墨点与深色底色，鼠标显露区域保留原始虹彩金属颜色。
- 无 WebGL 时的静态雕像使用反色灰度和 screen 混合，避免出现白色底块。
- 双手 12 秒循环与外圈流动动效保留。

## 光标效果

- 已移除全站及作品图的网格扭曲组件，三张作品使用本地静态 SVG，保留示意项目标注。
- `src/components/CursorEffects.jsx` 与同名 CSS：参考 Smooth Cursor 公开演示独立编写的弹性流线拖尾，40 个跟随点、连续填充轮廓、柔光与由粗到细的尾部，使用网站淡紫色设计变量。速度越快略微变粗，停止后收拢淡出。保留系统指针；已移除字母方块。
- 这是项目内独立编写的 Canvas 效果，不依赖 React Bits Pro 或许可密钥。
- Canvas 装饰不拦截点击和滚动，并跟随原生作品弹窗切换显示层。静止后停止绘制，离开窗口或隐藏标签页时清除并暂停。
- 仅在支持精确指针与悬停的设备开启，触屏关闭。系统减少动态效果模式使用 12 个快速跟随点和较短的尾部，关闭弹性回摆和柔光。无新增依赖。

## GitHub 与 Cloudflare Pages

- 源码仓库：`https://github.com/paulwatcegt-ui/songpeien`，生产分支为 `main`。
- 在 Cloudflare Pages 选择连接 Git，授权这个仓库；构建命令为 `npm run build`，输出目录为 `dist`，根目录使用仓库根目录。
- Node.js 版本由 `.node-version` 固定为 22.14.0；页面不需要任何生产环境密钥。
- Pages 完成 Git 连接后，推送 `main` 会自动构建和更新正式网站；本地保存不会直接上线。
- GitHub Actions 仅验证构建，不再发布到 GitHub Pages。已有 GitHub Pages 站点如需下线，需要在仓库的 Pages 设置中另行取消发布。
