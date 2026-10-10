import os
import json
import base64
import wave
import urllib.request
import urllib.error
from pathlib import Path

# Directory setup
work_dir = Path("odyssey-of-light")
audio_dir = work_dir / "audio"
audio_dir.mkdir(parents=True, exist_ok=True)

# Screenplay for the 7 Acts
SCREENPLAY = [
    {
        "id": "act0_prologue",
        "title": "序幕 · 暗室与烛光",
        "subtitle": "Prologue: The Ancient Light & Pinhole",
        "time_start": 0.0,
        "text": "天地玄黄，万象森罗。若问造化之中何物最是神奥？莫过于光。人人沐于光中，千载以来，却鲜有人知：这照彻尘寰的幽明，究竟为何物？两千余年前，先贤借一孔暗室，见倒悬之景，始知光行有径，直而不回。然而光之本体，是微物？是浮尘？抑或虚空中的涟漪？谜题，方才启幕。"
    },
    {
        "id": "act1_newton",
        "title": "第一幕 · 巨人的独断：三棱镜与微粒说",
        "subtitle": "Act I: Newton's Particles & The Hundred-Year Reign",
        "time_start": 0.0,
        "text": "十七世纪末，近代格致大开。艾萨克·牛顿爵士闭门引光，以一柄水晶三棱镜，将混沌白昼剖分出七彩光谱。牛顿断言：光，乃千万微小疾驰之弹丸，因形体有别，折射各异。荷兰学者惠更斯曾进一言：若光为微弹，两束相交安能不相撞溃散？光必如水波荡漾！然而，牛顿声威如泰山压顶，微粒之说遂成圣训，独步学界达百载之久。"
    },
    {
        "id": "act2_young_poisson",
        "title": "第二幕 · 惊世涟漪：托马斯·杨与泊松亮斑",
        "subtitle": "Act II: Young's Slits & The Poisson Miracle",
        "time_start": 0.0,
        "text": "至一千八百零一年，沉寂的波澜终起惊雷。英伦学者托马斯·杨立双缝于暗室，幕布之上，竟现出明暗相错的斑斓细纹！光与光相融，竟然生出黑暗！唯有波峰遇波谷相互抵消，方能解此奇相。十七年后，数学家泊松力驳波论，讥讽道：若光为波，圆盘阴影正中岂非当现一亮斑？何其荒谬！未料阿拉果当场举灯实验，阴影正央，一枚光核赫然绽放！这便是名垂青史的泊松亮斑。微粒神话，轰然坍塌。"
    },
    {
        "id": "act3_maxwell",
        "title": "第三幕 · 电磁冠冕：麦克斯韦的光之交响",
        "subtitle": "Act III: Maxwell's Electromagnetic Crown",
        "time_start": 0.0,
        "text": "十九世纪中叶，麦克斯韦以四组至美之数学方程，将雷电与磁石融归一统。电激磁，磁生电，互为因果，在虚空中交叠奔涌，其算得之波速，恰恰是每秒三十万公里！麦克斯韦惊叹：光，正是一曲浩瀚的电磁交响！数年后赫兹证实电磁波，物理学穹顶之上万里澄澈。学者皆赞叹：光的本质，水落石出矣！"
    },
    {
        "id": "act4_photoelectric",
        "title": "第四幕 · 晴空骤雷：光电效应与光量子",
        "subtitle": "Act IV: The Photoelectric Tempest & Quanta",
        "time_start": 0.0,
        "text": "然而造化玄奥，岂容凡人轻言洞察？二十世纪初，金属板上的幽微电火，震动了整座物理大厦。何以烈日般灼热之红光激不出一枚电子，而微弱之冷冽紫光却能瞬间击落电子？波动宏论于此溃败。爱因斯坦拾起普朗克的量子火种，发惊世之断语：光并非连绵流水，而是粒粒分明、能量饱满的飞弹！微粒之说，浴火重生！"
    },
    {
        "id": "act5_duality",
        "title": "第五幕 · 乾坤莫辨：波粒二象性与量子深渊",
        "subtitle": "Act V: The Quantum Duality & Ghostly Interference",
        "time_start": 0.0,
        "text": "既是波，又是粒？两者水火不容，这天地究竟如何造就？德布罗意断言：天下万物，电子微尘，无一非波！及至单光子双缝实验，更为诡谲之画卷徐徐展露：光子单个穿行，落下仅是一个个确凿的点；然而千百光子落毕，幕布之上竟累积出波的干涉条纹！难道一个光子，竟能同时穿过两道狭缝，与自己翩然起舞？不看它时，它是概率之波；窥视它时，它坍缩为确定之粒！"
    },
    {
        "id": "act6_epilogue",
        "title": "终曲 · 两者皆非，两者皆是",
        "subtitle": "Epilogue: Neither and Both — The Light of Reason",
        "time_start": 0.0,
        "text": "它究竟是波？是粒？两者皆是？抑或两者皆非？物理学家终于谦卑地垂首：光，既非世俗水池之波澜，亦非粗粝坚实之飞弹。它超越了人类常识的囚笼，是造化深处不可分割的量子造物。我们自暗室蹒跚而来，叩问三百年，方知宇宙之浩荡，非为迎合凡人经验而生。这，便是光的历程：以理性之幽光，照亮无垠的真理长夜。"
    }
]

# Write screenplay json for animation synchronizer
(work_dir / "screenplay.json").write_text(json.dumps(SCREENPLAY, ensure_ascii=False, indent=2))
print(f"Saved screenplay with {len(SCREENPLAY)} acts.")
