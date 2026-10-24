# 宋培恩个人网站 · 交接说明

> 本文件面向接手的开发者或 AI。读完后无需其他上下文即可继续开发。
> 最后更新：2026-10-24

> 版本管理：用户已于 2026-10-24 明确授权将本轮累计改动提交并推送至 `origin/main`；下文“未提交、未推送”描述的是各轮完成当时的状态。

## myGym 作品接入（2026-10-24）

- myGym 已替换原“字有引力”示意作品，并按最新要求置于首位 `/01`，虚拟人实验室调整为第二位 `/02`；标题、封面、介绍及详情随作品整体换位，无 JavaScript 兜底顺序同步。
- myGym 区块标题为“训练，让每一次坚持被看见。”，介绍明确说明基于 openGym 二次开发。
- 作品简介已简述相较 openGym 的改动：内置动作编辑与隐藏、筛选偏好保存、中文资料补齐、累计时长展示、进度照片操作及 AI 问答与教练记忆；卡片、弹窗和无 JavaScript 兜底同步。
- 简介增加 DeepSeek、豆包等国产模型 API 接入说明；myGym 的 `maintenance` 字段在卡片和弹窗中以浅紫底色与左侧强调线突出持续维护及下载体验提示，无 JavaScript 版本同步显示。
- 两个真实作品共用 `LiveWorkCard` 和 `WorkHeading`：桌面左图右文，900px 及以下上下排列；点击封面查看原生弹窗，卡片与弹窗均提供新标签页官网链接。
- 新封面 `public/media/work-mygym-cover.jpg` 原样复制自关联项目的 `website/img/og-cover.2eb0a04787.jpg`（1200×630、45,545 字节）。由品牌排版和使用演示数据的真实 Web 界面组成，不含用户训练数据及第三方动作媒体；不将其描述为用户真机截图。历史 SVG 素材保留。
- `works` 为每项提供 `heading`、`intro`、`coverWidth`、`coverHeight`、`coverBackground`；封面组件以 CSS 变量同步容器比例和底色。虚拟人封面保持 1916×904，myGym 使用 1200×630；无 JavaScript 兜底也包含 myGym 介绍。
- 已完成生产构建、1440/900/390/320px Chromium 浏览器检查：两作品封面及弹窗比例正确，布局断点正确，无整页横向溢出；Esc、焦点恢复、滚动解锁、官网新标签页链接正常，无脚本异常及本地资源失败。myGym 官网实际访问返回 200。
- 本轮本地预览：`http://127.0.0.1:5176/#work`。原 5175 端口运行的是旧目录副本，已保留该服务；默认启动脚本的端口仍为 5175。当前项目可用 `npm run dev -- --port 5176` 临时预览。
- 浏览器检查脚本、报告及截图位于被忽略的 `.runtime/mygym-validation/`。未修改 myGym 源项目，未新增依赖，未提交、推送或部署；保留此前全部未提交修改。

## 本轮续作记录（2026-10-22）

- 接手基线为 `main` @ `a8197aa`，工作区干净；本轮只修改本地文件，未提交、未推送或部署。
- 6 张 PNG 原图已从 `public/media/` 移至仓库内 `assets-source/`，保留全部源素材，避免 Vite 将其复制到 `dist/`。后文目录表及历史审查中的 PNG 位置以此为准。
- `DitherVeil` 默认图已改用 WebP；联系区只在支持悬停的精确指针设备加载交互模块，触屏设备在接近视区时显示静态雕像。指针能力变化会同步切换。
- 已补 `noscript` 介绍、作品链接及邮箱，OG / Twitter 标题和描述、Person JSON-LD；favicon 使用 Vite 的 `BASE_URL`。尚未确认正式域名，所以未虚构 canonical、`og:url`、分享图片绝对地址或 sitemap。
- 已补正文目标 `tabIndex={-1}`、修正站内联系箭头和作品封面的固有尺寸（1916×904）。弹窗条件标签与邮箱固定无障碍名称在接手前已修好，不再属于待办。
- 生产构建通过；未做浏览器视觉及屏幕阅读器回归。现有 CSS 与动效设计保留。
- 仍待处理：CSS 覆盖逐段整理及视觉回归、雕像抖动扩散性能实测、小字号检查、正式域名确认后的分享图片与 sitemap。第 6 节和 `CODE_REVIEW.md` 为历史问题清单，已完成项以上述记录为准。

---

## 1. 项目目标与功能范围

**目标**：宋培恩（SONG PEIEN）的个人作品与探索空间。一个单页站点，用克制的动效和深色排版展示作品、介绍本人、提供联系方式。

**功能范围**

- 单页四段式结构：首屏（`#home`）→ 关于（`#about`）→ 作品（`#work`）→ 联系（`#contact`），无路由、无后端。
- 首屏双手靠近—触碰—分开的循环动画。
- 关于段的人像故障切片艺术图。
- 作品列表：虚拟人实验室与 myGym 两张真实作品卡片，点开为原生 `<dialog>` 详情。
- 联系段的雕像点阵交互（WebGL），鼠标划过显露虹彩、点击产生涟漪。
- 全站光标弹性拖尾（Canvas）。
- 部署为纯静态站点，生产构建产物是 `dist/`。

**明确不做的事**：没有 CMS、没有表单提交、没有用户系统、没有服务端逻辑，联系只靠 `mailto:` 和邮箱复制。

---

## 2. 技术栈与版本要求

| 项 | 说明 |
|---|---|
| 框架 | React 19（`react@^19.0.0`、`react-dom@^19.0.0`） |
| 构建 | Vite 6（`vite@^6.0.0`，devDependency） |
| WebGL | `ogl@^1.0.11`（仅用于联系段雕像点阵） |
| Node.js | `.node-version` 声明 **22.14.0**；Vite 6 要求 Node ≥ 18，22.x 全系可用（本机实际跑 22.22.2） |
| 样式 | 原生 CSS（四个文件），**未使用 Tailwind / CSS-in-JS** |
| 语言 | 纯 JavaScript + JSX，**不是 TypeScript**（`jsconfig.json` 只提供 `@/*` 路径别名供 IDE 使用） |

**没有 `vite.config.js`**。所有构建与开发参数都在 `package.json` 的 scripts 里，见第 4 节。

依赖总数只有 4 个（3 运行时 + 1 开发），**不要随意新增依赖**——项目刻意保持轻量。

---

## 3. 目录结构

```
.
├── index.html                 入口 HTML（仅一个空 #root 容器 + meta）
├── package.json               依赖与脚本
├── package-lock.json          锁定版本（CI 用 npm ci）
├── .node-version              Node 版本约定：22.14.0
├── jsconfig.json              @/* → src/* 路径别名（IDE 用）
├── components.json            shadcn 配置残留，实际未使用（见 6.3）
├── .env.example               环境变量占位（实际不需要，见 4.3）
├── netlify.toml               Netlify 部署配置（备用平台）
├── .github/workflows/pages.yml  CI：仅验证 npm ci + npm run build
├── .openai/hosting.json       静态托管元数据（directory: dist）
│
├── src/
│   ├── main.jsx               页面骨架、作品数据、共享卡片与作品弹窗（核心文件）
│   ├── styles.css             基础布局、关于段、作品段、弹窗
│   ├── hero.css               首屏与双手动画
│   ├── contact.css            联系段排版
│   └── components/
│       ├── HeroHands.jsx      首屏双手循环（CSS 动画驱动）
│       ├── ExplorationArt.jsx 关于段人像
│       ├── DitherVeil.jsx     雕像点阵 WebGL（429 行，含 GLSL）
│       ├── DitherVeil.css     点阵容器样式
│       ├── DeferredDitherVeil.jsx  上面组件的懒加载包装
│       ├── CursorEffects.jsx  光标拖尾（Canvas，28 个跟随点）
│       └── CursorEffects.css  光标层样式
│
├── public/
│   ├── favicon.svg
│   └── media/                 静态素材（见 3.1）
│
├── Start-Website.ps1          Windows 守护：注册计划任务
├── Stop-Website.ps1           Windows 守护：停止并禁用
├── Run-Website.ps1            Windows 守护：supervisor 主循环
├── Resolve-Node.ps1           Windows 守护：Node 路径解析（被上两者 dot-source）
├── Run-Website.vbs            Windows 守护：无窗口启动器
├── 启动网站.cmd / 停止网站.cmd  双击入口
│
├── README-legacy.md           上一版说明（含素材生成提示词等历史细节，可查证）
└── CODE_REVIEW.md             2026-10-19 的代码审查报告，第 6 节问题来源
```

### 3.1 `public/media/` 素材说明

| 文件 | 用途 | 是否被代码引用 |
|---|---|---|
| `reaching-hands-silver-v2.webp` | 首屏双手 | ✓ |
| `about-glitch-portrait-cutout.webp` | 关于段人像 | ✓ |
| `contact-sculpture-iridescent-v2.webp` | 联系段雕像 | ✓ |
| `work-s-virtual-character-subject.webp` | 作品 02 虚拟人封面 | ✓ |
| `work-mygym-cover.jpg` | 作品 01 myGym 黑绿品牌封面 | ✓ |
| `work-type.svg` / `work-geometry.svg` / `work-color.svg` | 历史抽象构图源素材 | ✗ |
| `contact-field.svg` | 联系段装饰 | ✓ |
| `*.png`（6 个） | 上述 webp 的**原始大图源文件** | ✗ 未引用，共约 7.8 MB |
| `*.md`（3 个） | 素材生成的完整提示词，存档用 | ✗ |

`asset-prompts-v2.md`、`hero-image-prompt.md`、`iridescent-sculpture-prompt.md` 记录了图片的生成提示词，重新生成素材时直接复用。

> 6 个 PNG 是源文件而非临时产物，因此保留；若只关心部署体积，可删掉它们（`dist` 只用 webp）。

---

## 4. 安装与启动

### 4.1 标准流程

```bash
npm install
npm run dev        # → http://127.0.0.1:5175/
npm run build      # → dist/
npm run preview    # 预览生产构建，同样是 5175
```

### 4.2 端口是写死的

`package.json`：

```json
"dev":     "vite --host 127.0.0.1 --port 5175 --strictPort",
"preview": "vite preview --host 127.0.0.1 --port 5175 --strictPort"
```

**`--strictPort` 意味着 5175 被占用时直接报错退出，不会自动顺延到 5176。** 换端口必须同时改三处：`package.json` 的 dev、preview，以及 `Run-Website.ps1` 里的端口判断与启动参数（全文共 9 处出现 5175）。

只监听 `127.0.0.1`，局域网内其他设备访问不到，这是有意的。

### 4.3 环境变量

**不需要配置任何环境变量。** 代码只用到 Vite 内置的 `import.meta.env.BASE_URL`。

`.env.example` 里的 `REACTBITS_LICENSE_KEY` 是历史遗留：`components.json` 曾用于从 React Bits Pro 拉取组件，但当前代码**没有任何地方引用它**，`package.json` 也没有对应依赖。若将来确实要用 React Bits Pro，把它复制为 `.env.local` 再填值——注意变量名不能加 `VITE_` 前缀，它只是安装凭据，不应进浏览器包。

### 4.4 Windows 常驻启动（可选）

双击 `启动网站.cmd`：

1. `Start-Website.ps1` 用 `Resolve-Node.ps1` 找到 Node（顺序：`.runtime/node-path.txt` 记录 → `.runtime` 内 pinned runtime → PATH → 常见安装位置）；
2. 把绝对路径写入 `.runtime/node-path.txt`，让计划任务环境也能定位到它；
3. 注册计划任务 `SongPeienLocalWebsite`（仅登录时触发）；
4. 任务用 `wscript` 运行 `Run-Website.vbs`，后者无窗口启动 supervisor `Run-Website.ps1`；
5. supervisor 拉起 Vite，进程退出则 3 秒后重启，循环常驻。

日志在 `.runtime/`：`website-supervisor.log`、`vite.stdout.log`、`vite.stderr.log`。

`停止网站.cmd` 停止服务并禁用登录启动。移动项目后要先停止，再到新位置运行启动脚本——否则旧任务指向老路径，`Start-Website.ps1` 会因 `WorkingDirectory` 不符直接抛错。

**这套守护只在 Windows 有效。** macOS / Linux 上直接用 `npm run dev`。

---

## 5. 已完成功能

### 页面与内容
- 四段式单页；锚点导航与滚动高亮（`IntersectionObserver`，`rootMargin: -15%/-55%`）。
- 作品弹窗用原生 `<dialog>` + `showModal()`：Esc 关闭、点背景关闭、关闭后焦点回到触发元素、打开时锁滚动。
- 响应式：主断点 `760px`，另有 `1150px`、`1100px`、`900px`、`370px` 若干细节断点。
- 深色主题全站一致（`#101014` 背景），`theme-color` 与 `color-scheme` 同步。

### 动效
- **双手**：12 秒一轮的靠近—触碰—分开，起点指尖位于页面横向 34% / 67%，离开视区暂停。`prefers-reduced-motion` 下**仍保留**（用户明确要求），其余动效尊重系统设置。
- **光标拖尾**：28 个跟随点（减少动态时 12 个），连续填充轮廓、由粗到细、速度越快略变粗、停止后收拢淡出。仅精确指针设备启用，触屏关闭。
- **雕像点阵**：Floyd–Steinberg 抖动扩散 + 鼠标涟漪 + 点击爆发，虹彩调色；离开视区或标签页隐藏时停止渲染；WebGL2 不可用时回落静态图。

### 性能
- 四张 webp 共约 607 KB，首屏手部 `fetchPriority="high"`，其余 `loading="lazy"`。
- `DeferredDitherVeil` 在距视区 400px 时才 `import()` 雕像组件与 ogl（省下约 69 KB JS）。
- 抖动扩散改为复用 `Float32Array` 缓冲，避免拖拽窗口时反复分配数 MB。

### 可访问性
- 对比度实测全部达 WCAG **AAA**（正文 16.64:1、`--muted` 7.69:1、`--blue` 8.31:1）。
- 有 skip-link、`aria-current` 标当前栏目、`aria-live` 播报复制结果、弹窗有 `aria-labelledby/describedby`。

### 工程
- GitHub Actions 只做构建校验（不发布）；GitHub Pages 已停用。
- 生产部署走 Cloudflare Pages（构建 `npm run build`，输出 `dist`）。

---

## 6. 待办事项与已知问题

### 6.1 高优先级

| # | 问题 | 位置 | 建议 |
|---|---|---|---|
| 1 | **7.8 MB 未引用 PNG 仍在仓库** | `public/media/*.png` | 移到仓库外存档，或改放 `assets-source/`。Vite 对 `public/` 原样复制，`dist` 因此虚胖 |
| 2 | **纯 CSR，无 SEO 兜底** | `index.html` | `#root` 是空容器，社交平台抓取不到内容。至少补 `noscript`、OG/Twitter Card、JSON-LD |
| 3 | **`styles.css` 大量重复覆盖** | `src/styles.css` | 301 个规则块只有 173 个唯一选择器，64 组同条件重复。合并**必须逐组人工核对**，详见 7.3 |
| 4 | **skip-link 焦点不转移** | `src/main.jsx` 的 `<main id="main">` | 补 `tabIndex={-1}`，否则 Chrome/Safari 只跳转不聚焦 |

### 6.2 中低优先级

- **移动端仍加载 ogl + WebGL**：`DeferredDitherVeil` 只判距离不判设备，移动端可跳过，省 69 KB JS 与 GPU 开销。
- **抖动扩散在主线程同步执行**：1920×1080@dpr2 约 51.8 万像素 × 6 taps。可考虑降采样或挪到 Worker。
- **字号过小处较多**：`.art-bottom` 移动端 6px、`.contact-art-caption > span` 7px，会被 Chrome 中文最小 12px 限制撑开布局。
- **复制邮箱双重播报**：按钮文本变化 + `aria-live` 同时触发，屏幕阅读器可能读两遍。
- **`DitherVeil.jsx:6` 的 `DEFAULT_SRC`** 指向一个 1.7 MB 的 png 且从不被使用（调用方总是显式传 `src`），属死路径。
- **README-legacy.md 有过时描述**：写着"40 个跟随点"（实际 28/12）、"每分钟重复触发"（已删除）、"项目内便携 Node"（已改为自动解析）。以本文件为准。

### 6.3 可以忽略的遗留物

- `components.json`：shadcn 配置，`tailwind.config` 为空、项目并未用 Tailwind，实际不生效。
- `.openai/hosting.json`、`netlify.toml`：多平台部署残留，与 Cloudflare Pages 并存但不冲突。
- `tech-preview.png`：根目录截图，未引用。

---

## 7. 关键设计决策与代码约定

### 7.1 刻意为之的选择

| 决策 | 原因 |
|---|---|
| 单页无路由 | 内容量小，锚点足够；避免引入 router 依赖 |
| 无后端 | 纯静态可托管到任意 CDN，零运维 |
| 原生 `<dialog>` | 浏览器自带焦点陷阱与 Esc 关闭，比手写 modal 更可靠 |
| 依赖只有 4 个 | 刻意保持轻量，动效全部手写而非引库 |
| `--strictPort` | 守护脚本靠固定端口判断实例存活，端口漂移会让 supervisor 反复拉起多实例 |
| 端口绑 `127.0.0.1` | 仅本机可见，不暴露到局域网 |
| PNG 与 webp 并存 | PNG 是源文件，webp 是优化输出版 |

### 7.2 代码约定

- **文案与注释用中文**，标识符用英文。重构后的函数级注释写英文。
- `main.jsx` 刻意拆成 `SiteHeader` / `HeroSection` / `AboutSection` / `WorksSection`（内嵌 `LiveWorkCard`、`StudyWorkCard`）/ `ContactSection` / `WorkDialog`，**不要再合并回巨型组件**。
- 组件的 `useEffect` 按职责分节注释，长逻辑拆成具名子函数（见 `DitherVeil`、`CursorEffects`）。
- 魔法数字提取为文件顶部具名常量（`CursorEffects.jsx` 是范例）。
- 图片路径统一 `${import.meta.env.BASE_URL}media/xxx`，不要写死 `/media/`，以便部署到子路径。
- 装饰性元素加 `aria-hidden="true"`；纯装饰 `<img>` 的 `alt` 留空字符串。

### 7.3 CSS 的坑（务必先读）

这个项目的 CSS 是**追加式迭代**的产物，同一属性常被多处覆盖，改之前必须算清哪条生效：

- `src/styles.css` **301 个规则块 / 173 个唯一选择器**，`.about-copy h2` 重复 7 次。
- 典型：`.about-portrait` 在 74–80 行定义、82–84 行推翻、88–98 行再定义，只有最后一段生效。
- 特异性相同时**靠书写顺序取胜**。例如 `.work-dialog .art{height:390px}` 与 `.work-dialog .art-project{aspect-ratio:...}` 同为 `(0,2,0)`，后者必须写在后面才生效。
- `hero.css` 用 `!important` 对抗 `styles.css` 顶部的全局 reduce-motion 禁用，属既成事实。
- **不要自动合并重复规则**：若两次出现之间夹了同样作用于该元素的规则，把后者前移会改变层叠结果。审查时已验证 64 组中 0 组可自动化安全合并。

### 7.4 响应式约定

主断点 `760px`。作品区在 `900px` 以下从"左图右文"变单栏堆叠。封面统一用 `object-fit: contain` 保证不裁切不变形，容器比例与图片实际比例保持一致（作品 01 是 `1916/904`）。

---

## 8. 数据结构与组件接口

### 8.1 作品数据 `works`（`src/main.jsx` 顶部）

```js
{
  id:    '01',                    // 显示为 /01
  kind:  'virtual',               // 决定卡片样式类 work-<kind>；已有 virtual / type / geometry / color
  title: '虚拟人实验室',            // 卡片与弹窗标题
  en:    'S — VIRTUAL CHARACTER', // 弹窗里的小标签
  tag:   '交互网页 / WEB',         // 仅示意卡片显示
  text:  '…',                     // 作品描述
  note:  '…',                     // 弹窗补充说明
  url:   'https://…',             // 可选。有 url → LiveWorkCard（出站链接）；无 → StudyWorkCard（标注"布局示意"）
  cover: 'media/xxx.webp'         // 可选。有 cover → 用真实截图；无 → 用 work-<kind>.svg 抽象构图
  // 当前两个真实作品还提供以下展示数据：
  // heading: ['标题前半句，', '强调后半句。'], intro: ['简介第一行。', '简介第二行。'],
  // coverWidth: 1200, coverHeight: 630, coverBackground: '#070b09'
}
```

**新增真实作品只需往数组里加一项**，补齐上面的标题、简介、官网和封面尺寸；`WorksSection` 会自动渲染独立标题与共享卡片。当前不再渲染布局示意卡片。

### 8.2 `DitherVeil` props（`src/components/DitherVeil.jsx`）

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `src` | string | `DEFAULT_SRC` | 底图地址 |
| `fit` | `'cover' \| 'contain'` | `'cover'` | 底图适配方式 |
| `pattern` | `'floyd' \| 'atkinson'` | — | 抖动核 |
| `pixelSize` | number | `3` | 点阵粒度（越小越细） |
| `inkColor` / `paperColor` | string | — | 点阵墨色 / 纸色 |
| `revealRadius` / `softness` | number | — | 鼠标显露半径 / 边缘柔化 |
| `linger` | number | — | 鼠标离开后停留时间 |
| `brightness` / `contrast` | number | — | 预处理亮度 / 对比度 |
| `clickBurst` | boolean | `false` | 点击是否产生涟漪 |
| `className` | string | — | 容器类名 |

`DeferredDitherVeil` 透传全部 props，额外只做懒加载：距视区 400px 内才挂载，加载期间显示静态 `<img>` 兜底。

### 8.3 其他组件

- `CursorEffects`：无 props，挂载即生效，自动按 `(hover: hover) and (pointer: fine)` 与 `prefers-reduced-motion` 决定行为。
- `HeroHands`：无 props，图片源由内部常量 `HAND_SRC` 决定。
- `ExplorationArt`：无 props，固定一张图。
- `CopyEmail({ className })`：可复用按钮，点击复制 `email` 并做无障碍播报。

### 8.4 全局常量

- `email = 'songpeien@163.com'`（`src/main.jsx` 顶部）
- 设计变量在 `styles.css` 的 `:root`：`--paper:#101014` `--ink:#f1eff5` `--muted:#a6a3b2` `--orange:#ff542a` `--blue:#a4a2ff` `--line:#ffffff26`

---

## 9. 下一步入手点

1. **先跑起来确认基线**：`npm install && npm run dev`，打开 5175，滚一遍四个段落，确认动效都正常。
2. **要减体积**：删 `public/media/*.png`（7.8 MB）并把 `DitherVeil.jsx:6` 的 `DEFAULT_SRC` 改成 webp，`dist` 立刻从 8.8 MB 降到约 1 MB。零风险。
3. **要改样式**：先读 7.3，明确哪条规则真正生效，再动手。
4. **要加作品**：只改 `works` 数组（8.1），其余无需变动。
5. **要补 SEO**：`index.html` 里加 `noscript` 静态摘要 + OG/Twitter Card + JSON-LD，不动 React 代码。
6. **要上线**：推 `main` 分支，Cloudflare Pages 自动构建部署。本地 `dist` 不会自动上传。

---

## 附：相关资源

- 仓库：`https://github.com/paulwatcegt-ui/songpeien`（生产分支 `main`）
- 线上：Cloudflare Pages 项目，构建命令 `npm run build`，输出 `dist`
- 关联项目（作品 02 虚拟人实验室）：`https://s-virtual-character.pages.dev/`，源码在另一仓库 `D:\CodexWork\虚拟形象设计`（React + TS + Three.js）
- 关联项目（作品 01 myGym 官网）：`https://mygym-ckr.pages.dev/`，源码在另一仓库 `D:\CodexWork\基于openGym的二次开发\openGym`。
