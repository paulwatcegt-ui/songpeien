# 代码审查报告 — songpeien 个人作品网站

审查日期：2026-10-19
代码基线：`main` @ `a972fce`（Improve loading performance with WebP assets and deferred WebGL sculpture）
环境验证：`npm install` 通过（18 包，0 漏洞）· `npm run build` 通过（97 模块，1.48s）· dev server 正常

---

## 0. 先说结论

站点的**视觉完成度和配色可访问性相当好**——对比度实测全部达到 WCAG AAA，深色主题、懒加载、WebGL 降级这些细节都有考虑到。

真正的问题集中在两点：

1. **资源瘦身没做完**：上一轮做了 WebP 转换，但旧的 PNG 原图全部留在 `public/media/`，被 Vite 原样复制进 `dist`。产物 8.8MB 里只有 345KB 是代码。
2. **样式是"追加式"维护出来的**：`styles.css` 有 301 个规则块却只有 173 个唯一选择器。每轮迭代都在文件末尾加新规则覆盖旧规则，没有回头合并。这会让后续任何样式改动都变成"猜哪条最终生效"。

---

## 1. 页面加载性能

### P1 · dist 中约 7.8MB 图片无任何代码引用 — 影响：**高**

**位置**
- 资源目录：`public/media/`
- 代码引用点：`src/main.jsx:13`、`src/main.jsx:20,23`、`src/components/HeroHands.jsx:15,16`、`src/components/ExplorationArt.jsx:5`

**实测对照**

代码实际引用的只有 5 个文件：

| 引用文件 | 体积 |
|---|---|
| `reaching-hands-silver-v2.webp` | 124 KB |
| `about-glitch-portrait-cutout.webp` | 275 KB |
| `work-s-virtual-character-subject.webp` | 45 KB |
| `contact-sculpture-iridescent-v2.webp` | 149 KB |
| `work-type.svg` | 0.6 KB |

但 `dist/media/` 里还躺着这些**零引用**文件：

| 未引用文件 | 体积 |
|---|---|
| `about-glitch-portrait-cutout.png` | 2093 KB |
| `contact-sculpture-iridescent-v2.png` | 1708 KB |
| `contact-sculpture-v1.png` | 1693 KB |
| `reaching-hands-v1.png` | 858 KB |
| `reaching-hands-silver-v2.png` | 829 KB |
| `work-s-virtual-character-subject.png` | 805 KB |
| `work-color.svg` / `work-geometry.svg` / `contact-field.svg` | 约 3 KB |
| **合计** | **约 7989 KB（7.8 MB）** |

**为什么需要优化**
Vite 对 `public/` 目录的处理是**原样复制到 `dist/`**，不参与依赖图，因此不做任何 tree-shaking 或未引用检测。这些 PNG 是历次迭代中被 WebP 替换掉的旧素材，功能上早已废弃，却完整进入了每一次部署包。

**影响**
- 部署产物 8.8MB，其中**代码只占 345KB**，96% 是死重量
- Cloudflare Pages 每次推送都要上传/分发这 7.8MB，拖慢构建与 CDN 预热
- `.git` 目录 8.1MB，clone/fetch 成本同步膨胀
- `contact-sculpture-iridescent-v2.png`（1708 KB）还被 `src/components/DitherVeil.jsx:6` 的 `DEFAULT_SRC` 引用，属于死路径——因为 `src/main.jsx:100` 总是显式传 `src`，默认值永远不会生效

**修改建议**
1. 删除 6 个未引用的 PNG 和 3 个未引用的 SVG。若想保留原图，移到仓库外的备份目录，或建 `assets-src/` 并加入 `.gitignore`
2. `src/components/DitherVeil.jsx:6` 的 `DEFAULT_SRC` 改为指向 `.webp`，或直接删掉这个默认值（因为调用方必传）
3. 清理 `.git` 历史：若要真正瘦身需要 `git filter-repo`，但对个人站点收益有限，可选

---

### P2 · DitherVeil 首次显示时在主线程同步跑抖动扩散 — 影响：**中**

**位置**
- `src/components/DitherVeil.jsx:95-122`（`diffuse` 函数）
- `src/components/DitherVeil.jsx:313-332`（`updateDiffusion` 函数）
- 触发点：`src/components/DitherVeil.jsx:366`（在 `frame` 渲染循环内调用）
- 重算触发：`src/components/DitherVeil.jsx:409`（`ResizeObserver`）

**为什么需要优化**
`diffuse()` 是一个纯 CPU 的 Floyd–Steinberg 误差扩散实现，对整张纹理逐像素串行遍历，且在渲染帧里**同步执行**。

按 1920×1080 屏幕、`dpr = 2` 估算：
- `canvas.width = 3840`，`cell = round(pixelSize 2 × dpr 2) = 4`
- `cols = ceil(3840 / 4) = 960`，`rows = ceil(2160 / 4) = 540`
- 纹理像素数 ≈ 51.8 万，每个像素一次 `Math.pow`（`grade` 函数，第 328 行）
- 误差扩散内核 `floyd` 有 6 个 taps，内层循环约 **311 万次**

总计约 360 万次迭代加 52 万次 `Math.pow`，全部阻塞主线程。

**影响**
- 中——用户滚动到联系区时会感知到一次掉帧
- `ResizeObserver`（第 409 行）直接绑定 `layout()` 和 `wake()`，拖拽改变窗口宽度时会**连续反复重算**，卡顿叠加更明显

**修改建议**（按成本从低到高）
1. **加防抖**：resize 后延迟 150ms 再触发 `updateDiffusion`，成本最低，解决拖拽卡顿
2. **限制纹理尺寸**：给 diffusion 纹理设上限（如最大 480×270），再由 GPU 双线性放大。点阵风格下视觉几乎无损，计算量降到约 1/4
3. **按设备降级**：移动端直接传 `pattern="bayer"`（ordered dithering，全 GPU 执行，零 CPU 开销），保留 Floyd 只给桌面端
4. 若追求彻底解决，可把 `diffuse()` 移到 Worker，用 OffscreenCanvas 回传

---

### P3 · 首屏 CSS 整体阻塞渲染 — 影响：**中**

**位置**
- 产物：`dist/index.html` 中的 `<link rel="stylesheet" crossorigin href="/assets/index-BtIndjvv.css">`
- 源：`src/styles.css`（158 行）+ `src/hero.css`（78 行）+ `src/contact.css`（44 行），在 `src/main.jsx:3-5` 依次 import

**为什么需要优化**
三条样式表被合并成一个 37.36KB 的阻塞资源，但其中联系区（`.contact-dither`、`.contact-veil`）、作品弹窗（`.work-dialog`、`.dialog-copy`）的样式在首屏完全用不到。

**影响**
- 中——gzip 后 8.41KB，绝对体积不大，在良好网络下影响有限
- 属于"低成本、可顺手做"的项；若后续样式继续膨胀，影响会逐步放大

**修改建议**
- 把 header + hero 的关键样式内联进 `index.html` 的 `<head>`，其余用 `<link rel="preload" as="style" onload="this.rel='stylesheet'">` 异步加载
- 或接入 `critters` / `vite-plugin-critical` 自动提取首屏 CSS

---

### P4 · 首屏双手图用两个 img 指向同一文件 — 影响：**低**

**位置**：`src/components/HeroHands.jsx:15-16`，两处 `src` 均为 `reaching-hands-silver-v2.webp`

**说明**：靠 `.hand-human` / `.hand-robot` 的 `clip-path` 左右切分实现"双手"。浏览器缓存会去重，**不会产生第二次网络请求**。这是合理实现，仅记录，可不改。

---

## 2. 代码结构与可维护性

### M1 · styles.css 重复覆盖严重：301 规则块 / 173 唯一选择器 — 影响：**高**

**位置**：`src/styles.css`（基础层压在第 2 行；补丁层集中在第 74-158 行）

**实测重复次数**

| 选择器 | 重复次数 |
|---|---|
| `.about-copy h2` | 7 |
| `.about-copy p` | 6 |
| `.about-portrait img` | 6 |
| `.about-grid` | 5 |
| `html` / `.shell` / `.monogram` / `.contact-title>svg` / `.monogram.about-portrait` | 各 4 |
| `.section-kicker`、`.work-grid`、`.art-caption`、`.type-word`、`.dialog-top` 等 | 各 3 |

**典型症状**

`.about-portrait` 的定义被反复推翻：

- `src/styles.css:74-80` — 定义深底 `#19191e` + 描边 + `::after` 渐变遮罩
- `src/styles.css:82-84` — 立刻改回 `background:transparent` `border:0` `::after{content:none}`
- `src/styles.css:88-98` — 又重新定义高度、径向光晕、`mask-image`

`.section-kicker` 的颜色同样被改了三遍：

- `src/styles.css:129` 改边框方向
- `src/styles.css:133` 改字号字重
- `src/styles.css:135` 改子元素颜色
- `src/styles.css:138` 又把 `:first-child` 和 `:last-child` 统一设成 `#f1eff5`

**最终生效的只有最后一条**，前面全是死代码。

**为什么需要优化**
这是典型的"追加式迭代"产物：每一轮 AI 或人工修改不改原规则，而是在文件末尾追加更高优先级的规则。短期能出效果，长期后果是：

- 改一个样式要同时改多处，漏一处就失效
- 无法判断哪条是权威定义，只能靠浏览器 DevTools 实测
- CSS 体积虚高（重复规则占了相当比例）
- 下一次接手的人（包括 AI）会延续这个模式，形成恶性循环

**影响**
- 高——这是**后续所有样式改动的前置障碍**，不清理的话每改一处都会踩坑

**修改建议**
1. 逐选择器合并为唯一定义：以浏览器计算样式为准，取"最终生效值"写回基础层
2. 删除所有被覆盖的死规则
3. 引入 `csscss`（Ruby）或 `stylelint` 的 `no-duplicate-selectors` 规则，防止再次劣化
4. 合并后把三个 CSS 文件按模块重组（如 `base.css` / `hero.css` / `work.css` / `contact.css`），避免跨文件隐式覆盖

---

### M2 · hero.css 用 `!important` 对抗全局 reduce-motion 禁用 — 影响：**中**

**位置**
- 全局规则：`src/styles.css:7`
  ```css
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}}
  ```
- 反制规则：`src/hero.css` 中的
  ```css
  .hero-hands.is-ready .hand-human{animation:human-loop 12s cubic-bezier(.45,0,.55,1) infinite both!important}
  .hero-hands.is-ready .hand-robot{animation:robot-loop 12s cubic-bezier(.45,0,.55,1) infinite both!important}
  .hero-halo{animation:none!important}  /* 多处重复 */
  ```

**为什么需要优化**
产品需求是"减少动态效果设置下仍保留双手循环"，但全局规则用了 `*` + `!important` 一刀切，hero 只能再用 `!important` 反制。双方都用 `!important`，就退化成比拼选择器特异性和文件加载顺序。

**影响**
- 中——形成 `!important` 军备竞赛；日后想真正全局降级时，这层反制会让规则失效或需要再叠加一层

**修改建议**
把全局规则从"一刀切"改为"白名单排除"模式：

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *:not([data-keep-motion]):not([data-keep-motion] *) {
    animation: none !important;
    transition: none !important;
  }
}
```

然后在 `src/components/HeroHands.jsx:14` 的容器上加 `data-keep-motion`，并去掉 `hero.css` 里那几条 `!important`。这样意图显式、不再互相覆盖。

---

### M3 · `.art-image` 基础样式放错文件 — 影响：**低**

**位置**：`src/components/CursorEffects.css` 中的
```css
.art-image { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
```

**为什么需要优化**
`.art-image` 是作品区配图的样式，与光标拖尾毫无关系，却定义在光标组件的样式文件里。另外 `src/styles.css` 中也有 `.work-type .art-image{...}` 定义，两者靠 import 顺序分出胜负——`main.jsx` 先 import `./styles.css`，后经组件链加载 `CursorEffects.css`，所以后者覆盖前者。

**影响**
- 低——当前能正常工作，但破坏了"组件样式跟随组件"的组织原则，改样式时不容易找

**修改建议**
把 `.art-image` 的基础规则移到 `src/styles.css` 的作品区区块。

---

### M4 · main.jsx 作品渲染分支的死代码与冗余 — 影响：**中**

**位置**：`src/main.jsx:93`（无外链作品的渲染分支）

**问题清单**

1. **三元死分支**
   ```jsx
   aria-label={`查看${work.title}${work.url ? "，已上线交互网页" : "，布局示意，非真实项目"}`}
   ```
   这个 `<button>` 只在 `work.url` 为假时才渲染，因此 `"已上线交互网页"` 分支永远不会执行。

2. **重复 key**
   ```jsx
   <React.Fragment key={work.id}> ... <button key={work.id}> ... </button> </React.Fragment>
   ```
   外层 `Fragment` 已有 `key`，内层 `button` 再写一次是冗余。

3. **卡片文案不统一（已撤销）**
   原先判断"两个卡片 `aria-haspopup` 提示不一致"，复核后确认**两个 `<button>` 都带有 `aria-haspopup="dialog"`**，此项属于误判，予以撤销。

4. **`note` 字段（已撤销）**
   原先判断"`02` 作品缺 `note` 字段会导致弹窗输出空 `<p>`"，复核后确认 **`02` 作品实际含有 `note` 字段**，此项属于误判，予以撤销。

**影响**
- 低——本项仅剩「三元死分支」与「重复 key」两处，均为纯可维护性问题，不影响功能与视觉输出

**修改建议**
- 删除三元判断，直接写死文案"布局示意，非真实项目"
- 去掉内层重复的 `key`

---

### M5 · README 与代码不一致 — 影响：**低**

**位置**：`README.md`「光标效果」段落写"40 个跟随点"，而 `src/components/CursorEffects.jsx:94` 实际是
```js
points = Array.from({ length: reduced.matches ? 12 : 28 }, () => ({ x, y }))
```

**影响**：低——不影响运行，但会误导后续修改。

**修改建议**：同步为「28 个跟随点，减少动态效果下 12 个」。

---

## 3. 移动端适配与响应式

### R1 · 断点分散重复，760px 出现 4 次，370/360px 并存 — 影响：**中**

**位置**
- `src/styles.css`：第 5、8、35、49、98、119、122、126、130、136 行等多处 `@media(max-width:760px)`
- `src/hero.css`：`max-width:760px` 出现 3 次，另有 `370px`、`360px`、`760px and (orientation:landscape)` 各一次

**为什么需要优化**
同一断点的规则散落在文件各处，且出现了 `370px` 与 `360px` 两个几乎相同的极小屏断点——说明后期已经难以判断该用哪个。

**影响**
- 中——改一个移动端样式要同时改多处，容易漏；`!important` 叠加后更不可控

**修改建议**
统一断点体系（建议 1200 / 900 / 760 / 400 四档），把同一断点的规则归并到一起；废弃 370/360 中较旧的一个。

---

### R2 · 移动端仍加载 WebGL 雕像与 ogl 库 — 影响：**中**

**位置**
- `src/main.jsx:100`（传入 `DitherVeil` 的调用）
- `src/components/DeferredDitherVeil.jsx:10-22`（距离判断逻辑）

**为什么需要优化**
`DeferredDitherVeil` 只做了"距视区 400px 才加载"的**距离**判断，没有做**设备能力**判断。移动端 GPU 较弱，运行全屏点阵着色器（含 4 路涟漪循环、Floyd 扩散纹理）发热和耗电明显，而移动端触摸交互本就无法像鼠标那样"划过显露"。

**影响**
- 中——可省下 `DitherVeil-B0FW0s7r.js` 68.84KB（gzip 21.32KB）加上雕像图 149KB，以及移动端 GPU 持续开销

**修改建议**
在 `DeferredDitherVeil.jsx` 的 `useEffect` 中增加设备判断：

```js
const coarse = window.matchMedia('(pointer: coarse)').matches;
const weak = (navigator.hardwareConcurrency || 4) <= 4;
if (coarse || weak) { /* 只渲染静态 img，不 lazy import DitherVeil */ }
```

---

### R3 · contact-veil 用固定 `top`/`bottom` 撑高，小屏易与文案重叠 — 影响：**中**

**位置**：`src/contact.css`
```css
.contact-dither .contact-veil{position:absolute;left:50%;top:65px;bottom:110px;width:min(56vw,780px);height:auto;z-index:0}
```

**为什么需要优化**
雕像高度由 `top`/`bottom` 间接决定，而上方 `.contact-title h2` 用 `clamp(42px,4.4vw,76px)`、下方 `.contact-details` 有 `margin:40px 0 50px`，这些高度都随视口宽度非线性变化。两者没有约束关系。

**影响**
- 中——在特定宽度/字号组合下雕像会压住文字，且难以通过单一断点修干净

**修改建议**
改用 grid 给 `.contact-body` 划分明确区域，雕像放在独立网格单元；或给 veil 设 `aspect-ratio` + `max-height: 60svh` 双重约束。

---

## 4. 可访问性

### A1 · 对比度 — **已达标，无需改动**

实测（底色 `#101014`）：

| 用途 | 色值 | 对比度 | 结论 |
|---|---|---|---|
| 正文 | `#f1eff5` | 16.64:1 | AAA |
| `--muted` | `#a6a3b2` | 7.69:1 | AAA |
| `--blue` | `#a4a2ff` | 8.31:1 | AAA |
| 辅助文字 | `#aaa6b6` | 7.99:1 | AAA |
| 标注 | `#b4b0c5` | 9.00:1 | AAA |

全部超过 WCAG AAA 阈值（7:1），这块做得很好。

---

### A2 · 字号过小，6–9px 处较多 — 影响：**中**

**位置**
- `src/styles.css:22` — `.small-label{font-size:9px}`
- `src/styles.css` — `.art-index`（9px，移动端 7px）、`.art-bottom`（移动端 **6px**）
- `src/contact.css` — `.contact-art-caption>span{font-size:7px}`、`.orbit-edition{font-size:10px}`
- `src/styles.css` — `.monogram.orbit-art small`（7px，移动端 **6px**）

**为什么需要优化**
对比度虽然达标，但 6–7px 的中文字符在实际屏幕上基本不可辨认；且 Chrome 对中文有默认最小字号（12px）限制，这些值会被强制抬升，导致**布局与设计预期不符**——你以为排得很紧凑，实际渲染出来行高被撑开。

**影响**
- 中——可读性与跨浏览器一致性

**修改建议**
- 正文类辅助文字提到 ≥12px
- 纯装饰性标注改用 `rem` 单位并保持 ≥10px
- 在 Chrome 中实测确认最小字号限制对这些规则的实际影响，再决定是否调整容器尺寸

---

### A3 · skip-link 目标缺少 `tabIndex` — 影响：**中**

**位置**
- `src/main.jsx:71` — `<a className="skip-link" href="#main">跳至正文</a>`
- `src/main.jsx:79` — `<main id="main">`

**为什么需要优化**
跳转到非可聚焦元素时，Chrome 与 Safari 不会把键盘焦点真正移到 `<main>`。用户按了"跳至正文"后，再按 Tab 仍会从 header 的链接重新开始——skip link 等于失效。

**影响**
- 中——键盘用户最重要的导航手段失效

**修改建议**
```jsx
<main id="main" tabIndex={-1}>
```
（`tabIndex={-1}` 只接受程序化/锚点聚焦，不会被 Tab 键遍历到，无副作用）

---

### A4 · 复制邮箱存在双重无障碍播报 — 影响：**低**

**位置**：`src/main.jsx:27-42`（`CopyEmail` 组件）

**为什么需要优化**
点击复制后同时触发两种通知：
- `<button>` 的可见文本从邮箱地址变成"已复制！"→ 触发按钮名称变化播报
- 内部 `<span role="status" aria-live="polite">` 播报"邮箱地址已复制。"

屏幕阅读器会把两条都念一遍。

**影响**：低——冗余播报，不阻断操作。

**修改建议**
二选一：保留 live region、按钮文本固定为邮箱地址；或去掉 live region、只靠按钮文本变化。

---

### A5 · dialog 无内容时 `aria-labelledby` 悬空 — 影响：**低**

**位置**：`src/main.jsx:108`
```jsx
<dialog ref={dialog} aria-labelledby="dialog-title" aria-describedby="dialog-description" ...>
```

**为什么需要优化**
`selected` 为 `null` 时 dialog 内无子元素，`dialog-title` 与 `dialog-description` 两个 ID 不存在。虽然此时 dialog 是关闭状态、影响有限，但会在 axe / Lighthouse 无障碍检查中报错。

**修改建议**
改为条件渲染：
```jsx
aria-labelledby={selected ? 'dialog-title' : undefined}
aria-describedby={selected ? 'dialog-description' : undefined}
```

---

### A6 · 站内锚点误用外链箭头 — 影响：**低**

**位置**：`src/main.jsx:89` — `<a href="#contact">聊一聊 ↗</a>`

**为什么需要优化**
`↗` 约定俗成表示"新窗口/外部链接"，这里是同页锚点跳转，会误导用户预期。

**影响**：低。

**修改建议**：改为 `→` 或去掉符号。

---

## 5. SEO 基础

### S1 · 纯 CSR，无 JS 时页面完全空白，缺 `<noscript>` 兜底 — 影响：**高**

**位置**：`index.html:11` — `<div id="root"></div>`（空容器）

**为什么需要优化**
所有文案——包括 `<h1>`、作品描述、邮箱——都写在 JS 里。因此：

- 禁用 JS 的爬虫抓到的是空页面
- 社交平台（微信、微博、X、Slack）的抓取机器人**基本不执行 JS**，分享时只能拿到裸链接

**影响**
- 高——直接决定站点能否被正常收录，以及链接分享时有没有预览卡片

**修改建议**
1. 低成本兜底：在 `index.html` 的 `#root` 内放一段静态 HTML（`<h1>`、简介、邮箱、`mailto` 链接），用 `<noscript>` 包裹或作为 JS 接管前的占位
2. 若重视 SEO：接入预渲染。个人站点推荐 `vite-plugin-ssr` 或 Astro 的静态导出；轻量方案可用 `vite-plugin-prerender`
3. 至少补一个 `og:image`，让分享有缩略图

---

### S2 · 缺少 Open Graph / Twitter Card 标签 — 影响：**中**

**位置**：`index.html:3-10`（`<head>` 区块，目前只有 charset / viewport / theme-color / description / icon / title）

**为什么需要优化**
分享到微信、微博、X、Slack、iMessage 时不会显示标题、描述和缩略图，只显示裸 URL，点击率显著下降。

**影响**：中——传播效果。

**修改建议**
补充：
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="宋培恩 — 作品与探索" />
<meta property="og:description" content="宋培恩的个人空间，收集作品、记录想法，保持好奇，持续探索。" />
<meta property="og:url" content="https://你的正式域名/" />
<meta property="og:image" content="https://你的正式域名/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
```
注意：`og:image` 与 `og:url` **必须是绝对 URL**，相对路径社交平台无法解析。图片建议 1200×630。

---

### S3 · 缺少结构化数据 JSON-LD — 影响：**中**

**位置**：`index.html`

**为什么需要优化**
没有 `Person` / `WebSite` 结构化数据，搜索引擎无法判断这是一个个人作品集站点，也难以生成富摘要、知识面板。

**影响**：中。

**修改建议**
在 `</head>` 前加：
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "宋培恩",
  "alternateName": "SONG PEIEN",
  "email": "songpeien@163.com",
  "url": "https://你的正式域名/",
  "jobTitle": "设计师"
}
</script>
```

---

### S4 · 缺 `robots.txt` / `sitemap.xml`，favicon 用绝对路径 — 影响：**低**

**位置**：仓库根目录（无 robots.txt / sitemap.xml）；`index.html:8` — `<link rel="icon" href="/favicon.svg">`

**为什么需要优化**
- 单页站点缺 sitemap 影响有限
- 但 favicon 用绝对路径 `/favicon.svg`，一旦部署到子路径（如 GitHub Pages 的 `/songpeien/`）会 404。项目已有 `netlify.toml` 与 Cloudflare Pages 配置，若切换部署方式容易踩到

**影响**：低。

**修改建议**
- 补 `public/robots.txt` 和 `public/sitemap.xml`
- favicon 改用相对路径 `./favicon.svg`，或在构建时注入 `import.meta.env.BASE_URL`

---

## 6. 优先整改项（收益从高到低）

### ① 清理 7.8MB 未引用图片 — 收益 9.5
**位置**：`public/media/` 下 6 个 PNG + 3 个 SVG；`src/components/DitherVeil.jsx:6` 的死 `DEFAULT_SRC`
**收益**：部署产物 8.8MB → 约 950KB；`.git` 同步瘦身；构建与 CDN 分发变快
**风险**：零。删除的都是无引用的资源
**成本**：极低，就是删文件

### ② 合并 styles.css 的重复规则 — 收益 8.5
**位置**：`src/styles.css` 全部，重点第 74-158 行补丁层
**收益**：规则 301 → 173 条；消除"改一处要猜哪条生效"的陷阱
**风险**：中——需要逐段回归视觉，建议配合截图对比
**成本**：中
**备注**：这是后续所有样式改动的**前置项**，不清理的话每改一处都会踩坑

### ③ 补 SEO 兜底（noscript + OG + JSON-LD）— 收益 8.0
**位置**：`index.html` 第 3-11 行
**收益**：决定站点能否被正常收录，以及分享时有没有预览卡片
**风险**：零
**成本**：低
**备注**：属于"现在不做就一直缺失"的部分，且不会回归影响现有功能

### ④ 移动端跳过 WebGL 雕像加载 — 收益 6.0
**位置**：`src/components/DeferredDitherVeil.jsx:10-22`
**收益**：移动端省 68.84KB JS（gzip 21.32KB）+ 149KB 图片 + GPU 持续开销
**风险**：低——移动端退化为静态图，交互本来也不适用
**成本**：低

### ⑤ 修复 DitherVeil 抖动扩散的主线程卡顿 — 收益 5.5
**位置**：`src/components/DitherVeil.jsx:95-122`、`313-332`、`409`
**收益**：消除滚到联系区的掉帧和拖拽窗口时的连续卡顿
**风险**：中——涉及渲染逻辑，需实测验证
**成本**：中（方案 1 防抖成本低，可先做）

---

## 附：已确认的健康项

以下这些做得不错，不需要动：

- **对比度**全部达 WCAG AAA（最高 16.64:1）
- **无远程字体依赖**，用系统字体栈，零字体请求
- **原生 `<dialog>` + `showModal()`**，Esc 关闭与焦点陷阱由浏览器原生保证，且已实现焦点恢复（`src/main.jsx:68`）
- **图片懒加载**普遍到位，首屏图有 `fetchPriority="high"`
- **WebGL 降级**考虑周到：`DeferredDitherVeil` 延迟加载、离开视区停止渲染、`document.hidden` 暂停、`webglcontextlost` 处理
- **减少动态效果**尊重系统设置（`src/styles.css:7`），仅双手循环按需求保留
- **触屏设备**自动关闭光标拖尾（`src/components/CursorEffects.css` 的 `@media (hover: none)`）
- **语义骨架**基本正确：`<header>` / `<main>` / `<section id>` / `<h1>`→`<h2>`→`<h3>` 层级完整，`aria-current` 指示当前栏目
