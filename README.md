# 圣诞帽大作战 · Santa Cap Catcher

一个基于 **TikTok Effect House** 的竖屏人脸追踪互动小游戏。玩家通过移动头部接住从屏幕上方落下的圣诞帽，在限时挑战中尽可能得分，同时避开坏怪煤球。

> 项目工程位于 [`SantaCapCatcher/`](SantaCapCatcher/)，使用 Effect House **5.15.0** 创建。游戏主逻辑是 TypeScript，运行在 Effect House 的 APJS 脚本环境中。

## 项目亮点

- 使用人脸追踪结果定位额头，以额头位置作为游戏接取点。
- 包含校准、倒计时、游玩和结算四个阶段。
- 普通帽、金帽和坏怪煤球有不同的分数与风险；难度随成功接取逐步提升。
- 提供分数 HUD、倒计时、飘雪、命中特效、音效和结算卡片。
- 不需要外部服务或单独的后端。

## 快速开始

1. 安装并启动 **TikTok Effect House 5.15.0**。
2. 选择 **File → Open Project**，打开仓库中的 `SantaCapCatcher/effect.ehproj`。
3. 等待项目加载后，在 Preview 面板中启动预览。
4. 让人脸进入额头校准环并保持约 1.2 秒，或点击 **START** 开始。
5. 预览时请允许摄像头访问，并确保 Effect House 能正常检测到人脸。

在 Effect House 中修改并保存脚本后，可使用其内置编译与预览功能验证效果。发布或导出请使用 Effect House 的 **Export / Publish** 流程，并按 TikTok Effect House 的要求完成检查。

## 玩法规则

### 游戏流程

1. **校准**：额头环跟随人脸；检测到人脸并保持约 1.2 秒后自动进入倒计时，也可以点击 START。
2. **倒计时**：3、2、1、GO!。
3. **游玩**：移动头部，用额头接住下落道具。HUD 显示分数、未接次数和剩余时间。
4. **结算**：显示得分、称号及重新开始按钮。

### 道具与分数

| 道具 | 出现权重 | 接住效果 |
| --- | ---: | ---: |
| 普通圣诞帽 | 65% | +1 分 |
| 金色圣诞帽 | 15% | +3 分；下落速度更快 |
| 坏怪煤球 | 20% | −2 分，并增加 1 次未接 |

### 结束与难度

- 单局时长：30 秒。
- 累计未接 8 次，或连续未接 5 次，游戏结束。
- 没接住普通帽或金帽计为未接；坏怪煤球落到底部不扣分，也不计未接。
- 每接住 5 个正面道具，下落速度增加 10%，最高为初始速度的 1.8 倍。
- 结算称号：0–5 分为 **SANTA'S TEMP WORKER**，6–15 分为 **FLEXIBLE ELF**，16 分及以上为 **SANTA PRIME**。

## 代码结构

```text
.
├── README.md
├── LICENSE
├── SantaCapCatcher/
│   ├── effect.ehproj                 # Effect House 项目文件
│   ├── Assets/
│   │   ├── main.scene                # 主场景
│   │   ├── Scripts/Managers/
│   │   │   └── GameManager.ts        # 游戏状态、追踪、计分和 UI 逻辑
│   │   ├── Audio/                    # BGM 与音效
│   │   └── ...                       # 贴图、场景与其他项目资源
│   ├── EffectSettings/               # Effect House 工程设置
│   ├── Graph/                        # Effect House Graph 资源
│   └── tsconfig.json                 # TypeScript 编辑器配置
├── art/                              # 美术源文件与资源
├── build/                            # 构建/生成相关文件
└── tools/                            # 资源生成及项目辅助脚本
```

### 核心脚本

[`SantaCapCatcher/Assets/Scripts/Managers/GameManager.ts`](SantaCapCatcher/Assets/Scripts/Managers/GameManager.ts) 是游戏逻辑的主要入口，负责：

- 初始化场景对象、文本、图片和音效组件。
- 管理 `CALIBRATION → COUNTDOWN → PLAYING → RESULT` 状态流转。
- 读取 APJS 人脸追踪结果，将脸部矩形上方位置平滑映射为屏幕额头坐标；未检测到人脸时，追踪环平滑回到屏幕中心。
- 生成并移动道具，处理接取、漏接、计分、难度递增和结束条件。
- 更新 HUD、飘雪、倒计时、得分弹字、命中特效、屏幕闪烁与轻微抖动。
- 响应触摸开始/重玩，以及 Effect House 的 `RecordStart` 事件；开始录制时重置并回到校准阶段。

主要玩法参数可在脚本类的调参字段中修改：

| 参数 | 默认值 | 说明 |
| --- | ---: | --- |
| `baseSpeed` | 300 | 初始下落速度（像素/秒） |
| `spawnInterval` | 0.85 | 道具生成间隔（秒） |
| `catchRadiusX` | 118 | 额头接取区域横向半径 |
| `catchRadiusY` | 112 | 额头接取区域纵向半径 |
| `maxMiss` | 8 | 累计未接上限 |
| `maxConsecMiss` | 5 | 连续未接上限 |
| `roundSeconds` | 30 | 单局时长（秒） |

游戏画面以 **720 × 1280** 竖屏坐标为基准。UI 英文文案集中在 `GameManager.ts` 文件顶部的 `UI` 常量中。

## 项目说明与发布资料

仓库包含 Effect House 发布指南和游戏设计文档：

- [TikTok Effect House 发布指南](TikTok_EffectHouse_发布指南_SantaCapCatcher.docx)
- [圣诞帽大作战项目设计书](圣诞帽大作战_TikTok互动游戏项目设计书_V1.0.docx)
- [Effect House 工程内说明](SantaCapCatcher/README.md)

## 许可

本项目采用 [MIT License](LICENSE)。
