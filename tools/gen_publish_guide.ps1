# Generate: TikTok Effect House 发布指南 (Santa Cap Catcher)
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Add()
$sel = $word.Selection

# ---------- page setup: A4, 2.54cm margins ----------
$doc.PageSetup.PageWidth = 595.3
$doc.PageSetup.PageHeight = 841.9
$doc.PageSetup.TopMargin = 72
$doc.PageSetup.BottomMargin = 72
$doc.PageSetup.LeftMargin = 72
$doc.PageSetup.RightMargin = 72

# ---------- helpers ----------
function Set-Fonts {
    $sel.Font.Name = 'Calibri'
    $sel.Font.NameFarEast = '微软雅黑'
}
function Add-Title([string]$t) {
    # wdStyleTitle = -63
    try { $sel.Style = -63 } catch {}
    Set-Fonts
    $sel.ParagraphFormat.Alignment = 1
    $sel.Font.Size = 24
    $sel.Font.Bold = $true
    $sel.Font.Color = 0x1F3864
    $sel.ParagraphFormat.SpaceAfter = 6
    $sel.TypeText($t)
    $sel.TypeParagraph()
}
function Add-Subtitle([string]$t) {
    Set-Fonts
    $sel.ParagraphFormat.Alignment = 1
    $sel.Font.Size = 14
    $sel.Font.Bold = $false
    $sel.Font.Color = 0x595959
    $sel.ParagraphFormat.SpaceAfter = 18
    $sel.TypeText($t)
    $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment = 0
}
function Add-H1([string]$t) {
    # wdStyleHeading1 = -2
    try { $sel.Style = -2 } catch {}
    Set-Fonts
    $sel.Font.Size = 15
    $sel.Font.Bold = $true
    $sel.Font.Color = 0x2F5496
    $sel.ParagraphFormat.SpaceBefore = 14
    $sel.ParagraphFormat.SpaceAfter = 6
    $sel.TypeText($t)
    $sel.TypeParagraph()
}
function Add-H2([string]$t) {
    # wdStyleHeading2 = -3
    try { $sel.Style = -3 } catch {}
    Set-Fonts
    $sel.Font.Size = 12.5
    $sel.Font.Bold = $true
    $sel.Font.Color = 0x2F5496
    $sel.ParagraphFormat.SpaceBefore = 10
    $sel.ParagraphFormat.SpaceAfter = 4
    $sel.TypeText($t)
    $sel.TypeParagraph()
}
function Add-Para([string]$t) {
    try { $sel.Style = -1 } catch {}
    Set-Fonts
    $sel.Font.Size = 11
    $sel.Font.Bold = $false
    $sel.Font.Color = 0x000000
    $sel.ParagraphFormat.Alignment = 0
    $sel.ParagraphFormat.SpaceAfter = 6
    $t -split "`r?`n" | ForEach-Object {
        $line = $_.Trim()
        if ($line -ne '') {
            $sel.TypeText($line)
            $sel.TypeParagraph()
        }
    }
}
function Add-Bullet([string]$t) {
    try { $sel.Style = -1 } catch {}
    Set-Fonts
    $sel.Font.Size = 11
    $sel.Font.Bold = $false
    $sel.Font.Color = 0x000000
    $sel.ParagraphFormat.Alignment = 0
    $sel.ParagraphFormat.SpaceAfter = 3
    $t -split "`r?`n" | ForEach-Object {
        $line = $_.Trim()
        if ($line -ne '') {
            $sel.ParagraphFormat.LeftIndent = 21
            $sel.TypeText([char]0x2022 + '  ' + $line)
            $sel.TypeParagraph()
            $sel.ParagraphFormat.LeftIndent = 0
        }
    }
}
function Add-Note([string]$t) {
    Set-Fonts
    $sel.Font.Size = 10
    $sel.Font.Bold = $false
    $sel.Font.Color = 0x808080
    $sel.ParagraphFormat.SpaceAfter = 6
    $t -split "`r?`n" | ForEach-Object {
        $line = $_.Trim()
        if ($line -ne '') {
            $sel.TypeText($line)
            $sel.TypeParagraph()
        }
    }
}
# data rows: lines separated by newline, cells separated by ;;
function Add-Table([string]$rowsText, [int[]]$widthsPt, [switch]$header) {
    Set-Fonts
    $lines = $rowsText -split "`r?`n" | Where-Object { $_.Trim() -ne '' }
    $rows = $lines.Count
    $cols = ($lines[0] -split ';;').Count
    $rng = $sel.Range
    $table = $doc.Tables.Add($rng, $rows, $cols)
    $table.Borders.Enable = $true
    $table.Range.Font.Size = 10.5
    $table.Range.Font.Name = 'Calibri'
    $table.Range.Font.NameFarEast = '微软雅黑'
    for ($i = 0; $i -lt $rows; $i++) {
        $cellsArr = $lines[$i] -split ';;'
        for ($j = 0; $j -lt $cols; $j++) {
            $cell = $table.Cell($i + 1, $j + 1)
            $cell.Range.Text = $cellsArr[$j]
            if ($header -and $i -eq 0) {
                $cell.Range.Font.Bold = $true
                $cell.Range.Font.Color = 0xFFFFFF
                $cell.Shading.BackgroundPatternColor = 0x2F5496
            }
        }
    }
    for ($j = 0; $j -lt $cols; $j++) {
        $table.Columns.Item($j + 1).Width = $widthsPt[$j]
    }
    $sel.EndKey(6) | Out-Null
    $sel.TypeParagraph()
}

# ================= CONTENT =================
Add-Title 'TikTok Effect House 发布指南'
Add-Subtitle 'Santa Cap Catcher（圣诞帽大作战）· AR 互动小游戏|Effect House 5.15.0 · 跟踪类型 Head · 竖屏 720×1280'

Add-H1 '第 1 章 发布前准备'

Add-H2 '1.1 工程概览'
Add-Table @'
项目;;内容
工程路径;;E:\HatGame\SantaCapCatcher（打开 effect.ehproj）
引擎版本;;Effect House 5.15.0
玩法;;用额头接住下落圣诞帽的 AR 小游戏，单局 30 秒
屏幕基准;;720 × 1280 竖屏
跟踪类型;;Head（已在工程中设置）
包体大小;;Assets 约 1.4 MB（平台上限 5 MB，达标）
'@ @(140, 311) -header

Add-H2 '1.2 发布前必须完成的检查'
Add-Bullet @'
打开工程并试玩一遍：File → Open Project → E:\HatGame\SantaCapCatcher\effect.ehproj；场景停在「校准屏」，Preview 面板点播放即可。若弹出 "Configuration update request failed" 网络提示，先关闭弹窗再预览（与本工程无关）。
准备 1024×1024 发布图标：工程 outputs\mcp\texture_cover_icon.png 目前只有 256×256，建议用 E:\HatGame\tools\art.py 的美术资源重新生成一版（方形 1024×1024、主体居中、四周留出圆形裁切余量）。
录制 9:16 演示视频：格式 MOV/MP4，≤15 秒、≤32 MB；内容覆盖 校准 → 3-2-1 倒计时 → 接帽子 → 结算 的完整流程。
确认默认声音：工程已内嵌 Assets\Audio\bgm_loop.mp3，发布表单的 Default sound 可直接选用。
'@

Add-H1 '第 2 章 Publish Effect 表单填写指南'

Add-H2 '2.1 Basic Info（基本信息）'
Add-Bullet @'
What do you want to submit?：首次发布选择 "A new effect"；以后改版更新时，再选 "An update to an existing effect" 并关联已发布的效果。
Effect name（必填）：建议填 "Santa Cap Catcher"。要求简短（一般不超过 30 字符）、不与平台已有同名效果重复、不含品牌/商标词。
Effect icon（必填）：PNG 或 JPEG，最大 1024×1024 px、2 MB。Icon 1 为主图标（用户刷到的圆形展示，主体务必居中）；Icon 2 为副图标（可同图或换构图）。
Hint（建议填）：用户触发效果时弹出的提示语。从下拉选与玩法贴合的条目，例如 "Tap to start!" / "Catch the falling caps!"；若版本支持自定义，可写 "Catch the hats with your forehead!"
Default sound（建议添加）：点 "+ Add" 使用工程内嵌的 bgm_loop.mp3，或从平台素材库选一条节日 BGM。有默认音乐的效果使用率更高。
'@

Add-H2 '2.2 Optional Info（可选信息）'
Add-Bullet @'
Challenge：有对应官方挑战（圣诞 / 帽子 / 节日类）才选择；没有就留空，不要硬绑不相关话题。
Trend：需要蹭当前热门趋势流量时选择；否则留空。
Demo video（强烈建议上传）：MOV/MP4，最长 15 秒、最大 32 MB，推荐 9:16 竖屏。上传录制好的完整玩法演示，有助于过审和用户理解玩法。
'@

Add-H1 '第 3 章 发布后的 TikTok 端操作'
Add-Bullet @'
发布后到 TikTok（建议创作者账号）发一条竖屏短视频演示玩法，并在发布页关联刚过审的效果（Effects 入口选择该效果）。
文案使用第 4 章 caption 模板，带话题标签并 @ 好友一起挑战，引导点赞/合拍（duet）。
留意 TikTok 消息中心与绑定邮箱的审核结果；若被驳回，通常原因集中在名称、图标或音频版权，按驳回理由修改后在 Effect House 里重新提交（提交类型选 "An update to an existing effect"）。
'@

Add-H1 '第 4 章 英文发布文案与描述（可直接复制）'

Add-H2 '4.1 Effect Name 候选'
Add-Bullet @'
Santa Cap Catcher（推荐）
Christmas Hat Catch
Catch The Santa Caps
'@

Add-H2 '4.2 Effect Description（作品描述，提供给创作者/审核侧）'
Add-Para @'
Santa Cap Catcher is a 30-second face-tracking AR mini game. Caps drop from the sky and you catch them with your forehead to score! Gold caps give +3 but white coal makes you lose points. Can you hit 16+ points and reach the rank of SANTA PRIME? Head tracking only, portrait 720×1280, package under 5 MB — runs instantly on TikTok.
'@

Add-H2 '4.3 Hint 提示文案候选'
Add-Bullet @'
Tap to start!
Catch the falling caps!
Use your head... literally!
'@

Add-H2 '4.4 TikTok 视频 Caption 模板'
Add-Bullet @'
模板 A（节日版）：Christmas came early! 🎄 Can you catch all the Santa caps with your forehead? Try the effect and tell me your score below 👇 #SantaCapCatcher #Christmas #ARFilter #HolidayFun
模板 B（挑战版）：Think you can beat my high score? Catch more caps than I did or I will be very disappointed 😤 #SantaCapCatcher #ARGame #FaceFilter #Challenge
模板 C（简洁版）：My new AR game is LIVE! Catch the caps, dodge the coal 💀 Score 16+ = SANTA PRIME 👑 #SantaCapCatcher #NewEffect #TikTokAR
'@

Add-H2 '4.5 推荐话题标签集合'
Add-Para 'SantaCapCatcher  Christmas  ARFilter  ARGame  FaceFilter  Santa  Holiday  TikTokEffect  NewEffect  Challenge'
Add-Note '说明：发布时从以上标签里挑 3~6 个组合使用即可，勿堆砌过多。'

Add-H1 '第 5 章 发布检查清单'
Add-Table @'
检查项;;状态
提交类型选择 "A new effect";;☐
效果名唯一、≤30 字符、无商标词;;☐
Icon 1 / Icon 2 均为 1024×1024 PNG/JPEG，主体居中;;☐
已填写 Hint 提示语;;☐
已添加 Default sound（bgm_loop.mp3 或平台素材）;;☐
Demo video ≤15 秒 / ≤32 MB / 9:16;;☐
Preview 已人工试玩一遍，画面正常;;☐
包体 <5 MB（当前 1.4 MB，达标）;;☐
名称 / 图标 / 音频无商标与版权风险;;☐
'@ @(340, 111) -header

Add-H1 '附录 审核避坑提醒'
Add-Bullet @'
名称：避免运动队、大牌商标词（如 Nike、NBA、Disney 等）；推荐名 "Santa Cap Catcher" 为公共节日形象组合，安全。
图标：使用自有程序化美术资源（E:\HatGame\art 全部由 tools\art.py 生成，无版权问题），不要使用网上搬运图片。
音乐：优先用平台免费素材库；自备的 bgm_loop.mp3 需确认来源与授权。
被驳回：按驳回理由修改后，用 "An update to an existing effect" 重新提交，不要重复创建新效果。
'@

# ---------- page number in footer ----------
try {
    $footerRng = $doc.Sections.Item(1).Footers.Item(1).Range
    $footerRng.ParagraphFormat.Alignment = 1
    $doc.Sections.Item(1).Footers.Item(1).PageNumbers.Add(1) | Out-Null
} catch { }

# ---------- save ----------
$outPath = 'E:\HatGame\TikTok_EffectHouse_发布指南_SantaCapCatcher.docx'
$doc.SaveAs2($outPath, 12)
$doc.Close(0)
$word.Quit()
Write-Output ('SAVED: ' + $outPath)
