# Git 使用说明

本项目在 Windows PowerShell / VS Code 终端中操作，先进入项目：

```powershell
cd 'D:\CodexWork\个人主页设计'
```

## 当前配置

- 分支：`main`，跟踪 `origin/main`。
- 远程：`https://github.com/paulwatcegt-ui/songpeien.git`。
- 已保留原 GitHub 仓库完整 main 历史，没有重新创建无关历史。
- 提交身份：`paulwatcegt-ui <paulwatcege@gmail.com>`，仅在本仓库显式配置。
- 本仓库 `pull.ff=only`：发生分叉时停止，让开发者先检查。
- 依赖、构建产物、本地运行记录、缓存、环境密钥不提交；源码、图片和模型资源保留。
- 项目所有者已于 2026-10-24 明确授权将当前改动提交并推送到 GitHub；后续按用户指令执行推送。

## 每次修改后的提交

先审查改动，再构建验证。提交会在本地创建版本记录，推送才会上传 GitHub。

```powershell
git status
git diff
npm run build
git add -- src/main.jsx
git diff --cached
git commit -m "说明本次修改的内容"
```

将示例文件路径换成实际修改的文件；需要提交多个文件时逐个列出。`git add` 前检查新文件是否包含密钥。

确认允许首次上传后，上传前先检查远程更新：

```powershell
git fetch origin
git status -sb
git log --oneline --left-right main...origin/main
```

如果只有本地领先，可以执行 `git push origin main`。如果只有本地落后且工作区干净，使用 `git pull --ff-only`。如果双方都有新增提交，停止并请 Codex 检查，不强推、不自动合并。GitHub 可能要求浏览器登录；不要使用 GitHub 密码或把 Token 写入项目。

交接说明记录 main 关联 Cloudflare Pages；推送可能触发正式网站部署。

## 查看历史与安全恢复

```powershell
git log --oneline --graph --decorate -20
git show <提交编号>
git diff <旧提交编号> HEAD -- src/main.jsx
```

把尖括号占位符替换成真实提交编号后执行。

只查看旧版文件而不修改当前文件：

```powershell
git show <提交编号>:src/main.jsx
```

需要撤销某次提交时，先提交或妥善保存当前改动，再执行：

```powershell
git branch backup-before-revert
git revert <要撤销的提交编号>
npm run build
```

`revert` 创建新的撤销提交，保留原历史。若提示冲突，停止请 Codex 协助；可用 `git revert --abort` 取消这次未完成的撤销。不要执行 `git reset --hard`、`git clean -fd` 或强制推送。

VS Code 左侧“源代码管理”可查看差异、暂存和提交。“同步更改”可能同时拉取和推送，首次上传确认前不要使用。若终端找不到 Git 或 npm，请让 Codex 检查实际安装路径，不需要重新初始化仓库。
