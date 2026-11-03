# 圣诞帽大作战 · Santa Cap Catcher

TikTok Effect House AR 互动小游戏工程（已完整搭建，可直接打开测试）。

- 工程目录：`E:\HatGame\SantaCapCatcher`
- 引擎版本：Effect House 5.15.0
- 屏幕基准：720 × 1280（竖屏）
- 包体：`Assets/` 约 1.4 MB（全部贴图 ≤ 512 × 512）

---

## 一、如何打开

1. 启动 Effect House。
2. 菜单 `File → Open Project`，选择目录 `E:\HatGame\SantaCapCatcher`。
   （或直接打开 `E:\HatGame\SantaCapCatcher\effect.ehproj`）
3. 打开后场景默认停在**校准屏**，右侧 Preview 面板点播放即可开始。
4. 发布：`File → Export / Publish`，跟踪类型已设为 Head。

> 注意：本机每次启动 Effect House 会先弹一个网络提示
> “Configuration update request failed …”，点掉即可，与工程本身无关。
> 如果 Preview 面板一直黑屏/不刷新，先确认这个弹窗已经关闭。

---

## 二、玩法

| 阶段 | 表现 |
|---|---|
| 校准 | 金色光环跟随额头移动，脸部在圈内保持约 1.2 秒自动开始；也可点「START」跳过 |
| 倒计时 | 3 → 2 → 1 → GO!（每 0.72 秒） |
| 游玩 | 帽子从上方掉落，用额头去接；顶部 HUD 显示得分、未接次数、剩余时间条 |
| 结算 | 半透明金色雪花卡片显示得分与称号，附分享文案与「再玩一次」按钮 |

### 道具与计分

| 道具 | 出现概率 | 效果 |
|---|---|---|
| 普通圣诞帽 | 65% | +1 分 |
| 金色圣诞帽 | 15% | +3 分，且该道具下落速度快 30% |
| 绿色坏怪煤球 | 20% | −2 分，并计 1 次未接 |

### 结束条件（任一触发即结算）

- 累计未接 **8** 次
- 连续未接 **5** 次
- 单局时间到 **30 秒**

未接住「好道具」算 1 次未接；坏怪煤球掉下去不扣分也不算未接。

### 难度递进

每接到 **5** 个正确道具，全局下落速度 +10%，上限为初始速度的 **1.8 倍**。

### 结算称号

| 得分 | 称号（UI 英文） |
|---|---|
| 0 – 5 | SANTA'S TEMP WORKER（手残圣诞老人的临时工） |
| 6 – 15 | FLEXIBLE ELF（灵活的圣诞小精灵） |
| 16 + | SANTA PRIME（圣诞本老） |

结算卡固定文案（UI 英文，本地化常量集中在 `GameManager.ts` 顶部 `UI` 对象）：
- `@ your clumsiest friend to try!`
- `Tap below to make a duet!`

---

## 三、工程结构

```
SantaCapCatcher/
├─ Assets/
│  ├─ Scripts/Managers/GameManager.ts   主逻辑（唯一脚本，无手工绑定项）
│  ├─ CapRed / CapGold / BadBomb         掉落道具贴图
│  ├─ ForeheadRing                       额头接取光环
│  ├─ StarBurst / Snowflake              命中星光、飘雪
│  ├─ HudPlate / ResultCard / RetryButton / White
│  └─ bgm_loop.mp3 + sfx_click/pop/success/fail.mp3
└─ main.scene
```

### 场景层级

```
General
├─ GameManager        (Empty，挂 GameManager.ts)
├─ Camera             (3D 主相机，显示摄像头画面)
├─ Face Binding → HeadTracker   (Head Tracker，驱动人脸追踪 + 头部遮挡)
├─ BgmPlayer / SfxClick / SfxPop / SfxSuccess / SfxFail
└─ 2D Foreground
   └─ 2D Camera → GameRoot
      ├─ Snow0..3                      飘雪（常显）
      ├─ CalibDim / CalibRing / CalibTitle / CalibSub / CalibBtn / CalibBtnText
      ├─ PlayRing / Item0..5 / Burst
      ├─ HudPlate / HudScore / HudLife / BarBg / BarFill / CountText / Flash
      └─ ResCard / ResTitle / ResScore / ResRank / ResShare1 / ResShare2 / ResBtn / ResBtnText
```

游玩层与结算层在场景里默认隐藏，由脚本在对应状态打开，因此打开工程只会看到校准屏。

---

## 四、脚本说明（`Assets/Scripts/Managers/GameManager.ts`）

- 状态机：`CALIBRATION → COUNTDOWN → PLAYING → RESULT`
- **额头碰撞盒**：每帧读
  `APJS.AlgorithmManager.getResult().getFaceBaseInfo(0).rect`（归一化、原点左下、height 向上），
  取脸部矩形上方 94% 处作为额头点，换算到 720×1280 屏幕坐标，并做指数平滑。
  判定为以额头点为中心的椭圆盒（横向 ±118 px、纵向 ±112 px）。
  速度倍数 ≥ 1.4 时判定半径自动放大 8%（`reach`），缓解高分段判定误差。
- **无脸兜底**：检测不到人脸时光环平滑回到屏幕中心，游戏仍可继续（便于预览）。
- `RecordStart` 事件 → 重置全部状态并回到校准屏（每录制一条视频自动重开一局）。
- 触点：全局 `EventType.Touch` + `TouchUtils.isScreenPointOnImage` 判定开始/重试按钮。
- 音效：`AudioComponent.play()`；BGM 已设为 `Infinity` 循环 + 自动播放。
- 手感特效：命中星光爆裂（缩放+淡出）、得分飘字、未接红闪 + 2D 相机抖动。
- **UI 文案统一在脚本顶部 `UI` 常量管理**（开机时覆盖场景静态字样），切换语言只改一处。

### 可调参数（`GameManager.ts` 顶部的字段）

| 参数 | 默认 | 说明 |
|---|---|---|
| `baseSpeed` | 300 | 初始下落速度 px/秒 |
| `spawnInterval` | 0.85 | 生成间隔（秒，会随速度提升而缩短） |
| `catchRadiusX` | 118 | 接取盒横向半径 px |
| `catchRadiusY` | 112 | 接取盒纵向半径 px |
| `maxMiss` | 8 | 累计未接上限（匹配 30s 单局节奏） |
| `maxConsecMiss` | 5 | 连续未接上限 |
| `roundSeconds` | 30 | 单局时长（适配 TikTok 短视频 15-30s 节奏） |

改完保存即自动重新编译生效。

> 注意：`Item0..Item3` 固定是普通帽、`Item4` 金帽、`Item5` 坏怪。
> 生成时按 65/15/20 的权重挑选类型，再取该类型下空闲的道具槽位，
> 所以三种道具的概率严格按权重，而不是按槽位数量。

---

## 五、性能与规范

- `Assets/` 总大小约 1.4 MB（发布包体远低于 5 MB 上限）。
- 最大的贴图为 512 × 512（`CapRed` / `CapGold` / `BadBomb` / `HudPlate`），
  全部 ≤ 1024 × 1024。
- 同屏最多 6 个掉落物 + 4 片雪花，均为静态贴图平移，无实例化、无物理，
  在 ≥ 30 FPS 目标下余量充足。
- 所有 HUD 位于安全区内（X ∈ [-340, 260]，Y ∈ [-400, 500] 的近似范围内）。

---

## 六、已知限制

- **运行时画面未能自动截图验证**：本机 Effect House 的 Preview 截图通道
  （`capture_preview` / `interact_by_dsl(screenshot)`）每次调用都会长时间不返回，
  与工程内容无关（同类调用在空场景同样挂起）。因此最终视觉确认请在
  Preview 面板里人工点播一次。
- 生成的脚本已通过编译（`get_script_logs` 无 error/warning），
  场景保存并重新打开无异常。
- 分享文案为画面内文字，真正带话题发布仍需在 TikTok 端完成。
