#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 apps/Baicizhan/data/defaults.json(构建时种子,§10.3:主列表≥5 且多样)。

词表为 GRE 常见词,含真机录屏出现过的词(prudent/arid/appropriate/brim/monarch/
cascade/dissolve/default 等),释义与例句真实,干扰项为似是而非的中文释义。
改本文件后重跑,并把 constants.ts 的 DATA_VERSION +1。
"""
import json
from pathlib import Path

OUT = Path(__file__).parents[1] / "data" / "defaults.json"

# (word, phonetic, pos, 正确释义, [3个干扰释义], 英文例句, 中译, examFreq, roots)
W = [
    ("prudent", "/ˈpruːdnt/", "adj.", "谨慎的,精明的", ["吊着的,悬挂的", "谈性色变者", "堕落的,颓废的"],
     "The lemur has always been prudent to guard his house.", "狐猴在看家的时候总会很谨慎。", 15, "prud(小心)+ent → 小心的 = 谨慎的"),
    ("arid", "/ˈærɪd/", "adj.", "干旱的,干燥的", ["辛辣的,刻薄的", "独唱曲,咏叹调", "格子;网格"],
     "The lake turned to an arid place.", "这个湖变成了一个干旱之地。", 41, "ar(干燥)+id(形容词后缀) → 干旱的"),
    ("appropriate", "/əˈprəʊpriət/", "adj.", "合适的,适当的", ["征用,没收,剥夺", "学徒,徒弟", "评估,估价"],
     "Wearing a helmet is appropriate when riding a bicycle.", "骑自行车时戴头盔是合适的。", 22, "ap+propri(自己的)+ate → 据为己有 / 恰当的"),
    ("brim", "/brɪm/", "n.", "边缘;(浅底容器的)边缘", ["拘谨的,整洁的", "修剪,装饰", "严肃的,坚定的"],
     "The glass was full to the brim.", "这个玻璃杯被装得满满的。", 8, None),
    ("monarch", "/ˈmɒnərk/", "n.", "君主,帝王", ["无政府状态,政治混乱", "修道院", "(精神等)病态的"],
     "They bowed down before the monarch, who ruled the country.", "他们向统治国家的君主鞠躬。", 6, "mon(单一)+arch(统治) → 独裁者 = 君主"),
    ("cascade", "/kæˈskeɪd/", "n.", "小瀑布;像瀑布般冲下", ["后退,退化,恶化", "煽动", "使…习惯,使…适应"],
     "The cascade of warm water felt great!", "温水如瀑布般冲下感觉很棒!", 5, None),
    ("dissolve", "/dɪˈzɒlv/", "v.", "(使)溶解", ["不一致;不调和", "被移交;转让", "宣告…无罪;赦免"],
     "The tablet will dissolve in water.", "药片会在水中溶解。", 9, "dis(分开)+solve(松开) → 分解 = 溶解"),
    ("default", "/dɪˈfɔːlt/", "n.", "默认;违约,缺席", ["谨慎的,精明的", "小瀑布", "君主,帝王"],
     "You can sign in with the default settings.", "你可以用默认设置登录。", 7, "de(否定)+fault(过错) → 缺席 / 默认"),
    ("badger", "/ˈbædʒər/", "n.", "獾;v. 纠缠,烦扰", ["浮雕玉石", "名字;名声", "照相机"],
     "The badger dug a deep hole under the fence.", "獾在栅栏下挖了一个深洞。", 4, None),
    ("tackle", "/ˈtækl/", "v.", "对付,处理,解决", ["积攒;逐渐增加", "陪伴,陪同", "告知收到"],
     "We must tackle this problem right away.", "我们必须立刻解决这个问题。", 6, None),
    ("cameo", "/ˈkæmiəʊ/", "n.", "浮雕玉石;客串", ["名字;名声", "照相机,摄影机", "骆驼;浮船箱"],
     "The famous actor made a brief cameo in the film.", "那位著名演员在电影里短暂客串。", 3, None),
    ("acknowledge", "/əkˈnɒlɪdʒ/", "v.", "告知收到;承认", ["加速,增长", "陪伴,伴随", "积攒;聚积"],
     "She refused to acknowledge her mistake.", "她拒绝承认自己的错误。", 11, "ac+knowledge(知道) → 承认"),
    ("dilemma", "/dɪˈlemə/", "n.", "困境,进退两难", ["独白,自言自语", "对话,谈话", "民主,平等"],
     "He faced the dilemma of telling the truth or keeping silent.", "他面临说真话还是保持沉默的两难。", 10, "di(二)+lemma(前提) → 两个前提 = 两难"),
    ("potential", "/pəˈtenʃl/", "n.", "潜力,潜能;adj. 潜在的", ["势力,势能", "耐心,忍耐", "专利,许可"],
     "The young player has great potential.", "这位年轻球员很有潜力。", 12, "potent(有力的)+ial → 潜在的力量"),
    ("resident", "/ˈrezɪdənt/", "n.", "居民,住户", ["总统,主席", "总裁,总监", "常驻记者"],
     "The residents complained about the noise.", "居民们抱怨噪音。", 7, "resid(居留)+ent(人) → 居民"),
    ("departure", "/dɪˈpɑːtʃər/", "n.", "离开,启程;背离", ["部门,系", "百货公司", "出发点"],
     "Our departure was delayed by the storm.", "我们的出发被暴风雨耽搁了。", 6, "depart(离开)+ure(名词) → 离开"),
    ("blossom", "/ˈblɒsəm/", "n.", "花;v. 开花,兴旺", ["扫帚", "手足,兄弟", "预算,经费"],
     "The cherry trees blossom in spring.", "樱花在春天开放。", 5, None),
    ("famine", "/ˈfæmɪn/", "n.", "饥荒", ["女性的;阴柔的", "著名的,出名的", "家庭,家族"],
     "The famine forced many people to flee.", "饥荒迫使许多人逃离。", 6, "fam(饿)+ine → 饥荒"),
    ("ethics", "/ˈeθɪks/", "n.", "伦理学;道德准则", ["种族,民族", "回声,反响", "习惯,风俗"],
     "Medical ethics guide a doctor's decisions.", "医学伦理指导医生的决定。", 9, "eth(品行)+ics(学) → 伦理学"),
    ("feast", "/fiːst/", "n.", "盛宴,宴会;节日", ["野兽,畜生", "壮举,功绩", "拳头,一把"],
     "They held a great feast to celebrate.", "他们举办盛宴来庆祝。", 5, None),
    ("precisely", "/prɪˈsaɪsli/", "adv.", "精确地,恰好", ["珍贵地", "简洁地", "严肃地,坚定地"],
     "That is precisely what I meant.", "那正是我的意思。", 8, "precise(精确的)+ly → 精确地"),
    ("fortnight", "/ˈfɔːtnaɪt/", "n.", "两星期", ["堡垒,要塞", "幸运,财富", "先见之明"],
     "We will meet again in a fortnight.", "我们两周后再见面。", 3, "fort(十四)+night → 十四夜 = 两周"),
    ("fragrant", "/ˈfreɪɡrənt/", "adj.", "芳香的", ["脆弱的,易碎的", "残片,碎块", "坦率的,直率的"],
     "The garden was fragrant with roses.", "花园里玫瑰芬芳。", 5, "fragr(香)+ant → 芳香的"),
    ("genuine", "/ˈdʒenjuɪn/", "adj.", "真正的,真诚的", ["宽宏大量的", "天才,天赋", "温和的,亲切的"],
     "She showed genuine concern for others.", "她对他人表现出真诚的关心。", 8, "gen(生)+uine → 天生的 = 真正的"),
    ("melancholy", "/ˈmelənkəli/", "n.", "忧郁,悲伤;adj. 忧郁的", ["旋律,曲调", "混合物", "颂歌,赞美诗"],
     "A deep melancholy settled over him.", "一种深深的忧郁笼罩着他。", 7, "melan(黑)+choly(胆汁) → 黑胆汁 = 忧郁"),
    ("critical", "/ˈkrɪtɪkl/", "adj.", "批判的;关键的,危急的", ["古典的,经典的", "临床的", "循环的,周期的"],
     "The next few days are critical to the plan.", "接下来几天对计划至关重要。", 13, "crit(判断)+ical → 批判的 / 关键的"),
    ("renowned", "/rɪˈnaʊnd/", "adj.", "著名的,有声望的", ["重建的,翻新的", "退回的,归还的", "更新的,续订的"],
     "She is a renowned scientist.", "她是一位著名的科学家。", 7, "re+nown(名声) → 有名的"),
    ("coordinate", "/kəʊˈɔːdɪneɪt/", "v.", "协调;n. 坐标", ["从属,隶属", "服从,顺从", "普通的,平凡的"],
     "We need to coordinate our efforts.", "我们需要协调各自的努力。", 8, "co(共同)+ordin(次序)+ate → 使同序 = 协调"),
    ("merchandise", "/ˈmɜːtʃəndaɪz/", "n.", "商品,货品;v. 推销", ["商人,批发商", "怜悯,慈悲", "水银,水星"],
     "The store sells a wide range of merchandise.", "这家店销售各种各样的商品。", 6, "merch(交易)+andise → 商品"),
    ("dialogue", "/ˈdaɪəlɒɡ/", "n.", "对话,谈话", ["独白,自言自语", "目录,分类", "方言,土话"],
     "The two leaders held a constructive dialogue.", "两位领导人进行了建设性对话。", 5, "dia(之间)+logue(说) → 之间说话 = 对话"),
    ("abundant", "/əˈbʌndənt/", "adj.", "丰富的,充裕的", ["多余的,过剩的", "冗长的,啰嗦的", "傲慢的,自大的"],
     "The region has abundant natural resources.", "这个地区有丰富的自然资源。", 9, "abund(涌流)+ant → 涌流的 = 丰富的"),
    ("candid", "/ˈkændɪd/", "adj.", "坦率的,直言的", ["谨慎的,小心的", "华丽的,炫目的", "苍白的,虚弱的"],
     "She gave a candid account of the events.", "她坦率地叙述了事情经过。", 6, "cand(白)+id → 清白的 = 坦率的"),
    ("deficit", "/ˈdefɪsɪt/", "n.", "赤字,亏损;不足", ["盈余,顺差", "存款,押金", "定义,界定"],
     "The company reported a large deficit.", "公司报告了巨额亏损。", 7, "de(否定)+fic(做)+it → 做得不够 = 不足"),
    ("elaborate", "/ɪˈlæbərət/", "adj.", "精心制作的,复杂的;v. 详述", ["合作的,协作的", "可推敲的", "劳动的,费力的"],
     "He gave an elaborate explanation.", "他给出了详尽的解释。", 8, "e+labor(劳动)+ate → 费工的 = 精心的"),
    ("hostile", "/ˈhɒstaɪl/", "adj.", "敌对的,怀有敌意的", ["好客的,殷勤的", "人质的", "历史的"],
     "The crowd grew hostile toward the speaker.", "人群对演讲者变得充满敌意。", 9, "host(敌人)+ile → 敌对的"),
    ("inevitable", "/ɪnˈevɪtəbl/", "adj.", "不可避免的,必然的", ["无价值的", "无止境的", "不可估量的"],
     "Change is inevitable in any organization.", "任何组织中变革都不可避免。", 10, "in(不)+evit(避开)+able → 不可避开的"),
    ("lucrative", "/ˈluːkrətɪv/", "adj.", "有利可图的,赚钱的", ["润滑的", "松散的,散漫的", "透明的,清澈的"],
     "Selling software can be a lucrative business.", "卖软件可能是很赚钱的生意。", 6, "lucr(利润)+ative → 有利可图的"),
    ("notorious", "/nəʊˈtɔːriəs/", "adj.", "臭名昭著的", ["著名的,受尊敬的", "显而易见的", "夜行的"],
     "The area is notorious for crime.", "这个地区因犯罪而臭名昭著。", 8, "not(知道)+orious → 广为人知的(贬)"),
    ("obscure", "/əbˈskjʊər/", "adj.", "晦涩的,模糊的;v. 遮蔽", ["安全的,可靠的", "华丽的", "急切的"],
     "The meaning of the poem remains obscure.", "这首诗的含义依然晦涩。", 9, "ob+scur(覆盖) → 被盖住的 = 模糊的"),
    ("plausible", "/ˈplɔːzəbl/", "adj.", "似乎合理的,貌似可信的", ["可鼓掌的", "可塑的,柔软的", "可责备的"],
     "His excuse sounded plausible enough.", "他的借口听起来足够可信。", 8, "plaus(鼓掌)+ible → 可获掌声的 = 可信的"),
    ("reluctant", "/rɪˈlʌktənt/", "adj.", "不情愿的,勉强的", ["流畅的,顺畅的", "多余的,冗余的", "反射的"],
     "He was reluctant to admit the truth.", "他不愿承认真相。", 9, "re(反)+luct(挣扎)+ant → 挣扎着的 = 不情愿的"),
    ("scrutiny", "/ˈskruːtəni/", "n.", "仔细审查,细看", ["丑闻,流言", "废墟,残骸", "对称,匀称"],
     "The plan came under close scrutiny.", "这个计划受到了严格审查。", 8, "scrut(检查)+iny → 审查"),
    ("tangible", "/ˈtændʒəbl/", "adj.", "有形的,可触摸的;确凿的", ["纠缠的,复杂的", "可尝的", "易怒的"],
     "We need tangible evidence, not guesses.", "我们需要确凿的证据,而不是猜测。", 8, "tang(接触)+ible → 可触的 = 有形的"),
    ("vigorous", "/ˈvɪɡərəs/", "adj.", "精力充沛的,有力的", ["警惕的,机警的", "巨大的,庞大的", "邪恶的,恶毒的"],
     "She took vigorous exercise every morning.", "她每天早上做剧烈运动。", 7, "vig(活力)+orous → 精力充沛的"),
    ("chagrin", "/ʃəˈɡrɪn/", "n.", "懊恼,失望", ["古代双轮马拉战车", "慈善机构;施舍", "一系列;链条"],
     "Much to his chagrin, he was beaten by the younger boy.", "让他非常懊恼的是,他输给了更小的男孩。", 4, None),
    ("frugal", "/ˈfruːɡl/", "adj.", "节俭的,朴素的", ["丰饶的,肥沃的", "脆弱的,易碎的", "残暴的,凶猛的"],
     "Her frugal lifestyle helped her save a fortune.", "她节俭的生活方式帮她攒下了一大笔钱。", 6, "frug(果实)+al → 有果实的 = 节俭有余"),
    ("meticulous", "/məˈtɪkjələs/", "adj.", "一丝不苟的,细致的", ["恶毒的,狠毒的", "含金属的", "机械的,呆板的"],
     "He kept meticulous records of every experiment.", "他为每个实验都保存了细致的记录。", 7, "metic(害怕)+ulous → 因怕错而细致"),
    ("ambiguous", "/æmˈbɪɡjuəs/", "adj.", "模棱两可的,含糊的", ["雄心勃勃的", "两栖的", "环境的,周围的"],
     "The instructions were so ambiguous that no one understood them.", "说明如此含糊,以至于没人看得懂。", 9, "ambi(两边)+gu(走)+ous → 两边走 = 模棱两可"),
    ("benevolent", "/bəˈnevələnt/", "adj.", "仁慈的,慈善的", ["恶意的,狠毒的", "暴力的", "暧昧的,含糊的"],
     "The benevolent old man donated all his savings.", "那位仁慈的老人捐出了全部积蓄。", 6, "bene(好)+vol(意愿)+ent → 好意的 = 仁慈的"),
    ("conspicuous", "/kənˈspɪkjuəs/", "adj.", "显眼的,惹人注目的", ["共谋的,串通的", "多疑的,可疑的", "连续的,持续的"],
     "Her red coat made her conspicuous in the crowd.", "她的红大衣让她在人群中很显眼。", 8, "con+spic(看)+uous → 大家都看得到 = 显眼的"),
    ("diligent", "/ˈdɪlɪdʒənt/", "adj.", "勤奋的,勤勉的", ["聪明的,机灵的", "有耐心的", "挑剔的,苛求的"],
     "A diligent student, she never missed a class.", "作为一个勤奋的学生,她从不缺课。", 7, "di+lig(选择)+ent → 用心选择去做 = 勤勉"),
    ("eloquent", "/ˈeləkwənt/", "adj.", "雄辩的,有说服力的", ["优雅的,精致的", "谦逊的,谦虚的", "冗长的,啰嗦的"],
     "The lawyer gave an eloquent closing argument.", "律师作了雄辩的结案陈词。", 6, "e(出)+loqu(说)+ent → 说得出彩 = 雄辩的"),
    ("formidable", "/ˈfɔːmɪdəbl/", "adj.", "强大的,令人敬畏的", ["可塑的,易变形的", "可原谅的", "可食用的"],
     "They faced a formidable opponent in the final.", "他们在决赛中面对一个强大的对手。", 8, "formid(害怕)+able → 令人害怕的 = 令人敬畏的"),
    ("indifferent", "/ɪnˈdɪfrənt/", "adj.", "漠不关心的,冷淡的", ["无法区分的", "不可或缺的", "间接的"],
     "He remained indifferent to their complaints.", "他对他们的抱怨依旧漠不关心。", 7, "in(不)+different(不同)→ 觉得没差别 = 漠不关心"),
    ("perpetual", "/pərˈpetʃuəl/", "adj.", "永久的,持续不断的", ["困惑的,迷惑的", "垂直的", "个人的,私人的"],
     "The machine is in perpetual motion.", "这台机器处于永不停歇的运动中。", 6, "per(始终)+pet(寻求)+ual → 始终不停 = 永久的"),
    ("resilient", "/rɪˈzɪliənt/", "adj.", "有韧性的,能恢复的", ["顺从的,恭顺的", "多余的,冗余的", "闪耀的,灿烂的"],
     "Children are often remarkably resilient.", "孩子们往往有着惊人的恢复力。", 7, "re(回)+sil(跳)+ient → 弹回来 = 有韧性的"),
    ("skeptical", "/ˈskeptɪkl/", "adj.", "怀疑的,多疑的", ["骨骼的", "敏感的", "球形的"],
     "Scientists were skeptical of the bold claim.", "科学家们对这一大胆断言持怀疑态度。", 8, "skept(观察)+ical → 反复审视 = 怀疑的"),
    ("tedious", "/ˈtiːdiəs/", "adj.", "冗长乏味的,枯燥的", ["美味的,可口的", "凶猛的,残暴的", "短暂的,片刻的"],
     "Filling out the forms was a tedious task.", "填这些表格是件枯燥乏味的差事。", 6, "ted(厌倦)+ious → 令人厌倦的 = 乏味的"),
    ("versatile", "/ˈvɜːsətaɪl/", "adj.", "多才多艺的,多用途的", ["垂直的", "真实的,真诚的", "易挥发的"],
     "A versatile tool that can do many jobs.", "一件能干许多活的多用途工具。", 6, "vers(转)+atile → 能转向多方 = 多才多艺的"),
    ("wary", "/ˈweəri/", "adj.", "警惕的,谨慎的", ["疲倦的,厌烦的", "多样的,不同的", "温暖的,热情的"],
     "Be wary of deals that sound too good.", "对听起来太美好的交易要保持警惕。", 5, None),
    ("zealous", "/ˈzeləs/", "adj.", "热心的,狂热的", ["嫉妒的,羡慕的", "无价值的", "零散的"],
     "He was a zealous supporter of the reform.", "他是这项改革的狂热支持者。", 5, "zeal(热情)+ous → 满怀热情的 = 狂热的"),
    ("obstinate", "/ˈɒbstɪnət/", "adj.", "固执的,顽固的", ["障碍的,阻碍的", "明显的,显著的", "抽象的"],
     "The obstinate child refused to apologize.", "那个固执的孩子拒绝道歉。", 6, "ob+stin(站)+ate → 站着不动 = 固执的"),
]

# 批量词库(word, pos, meaning)—— 干扰项与例句由脚本自动生成,用于把词库扩到数百词(Gate4v3 要求)
# Gate4v4:补基础高频词(此前查 hello 都查不到)
BULK = [
    ("hello", "int.", "喂;你好(打招呼用语)"), ("world", "n.", "世界;领域"), ("apple", "n.", "苹果"),
    ("book", "n.", "书;v. 预订"), ("water", "n.", "水"), ("friend", "n.", "朋友"),
    ("school", "n.", "学校"), ("teacher", "n.", "老师"), ("student", "n.", "学生"),
    ("family", "n.", "家庭;家人"), ("mother", "n.", "母亲"), ("father", "n.", "父亲"),
    ("happy", "adj.", "快乐的,高兴的"), ("sad", "adj.", "悲伤的"), ("good", "adj.", "好的"),
    ("bad", "adj.", "坏的,糟糕的"), ("big", "adj.", "大的"), ("small", "adj.", "小的"),
    ("morning", "n.", "早晨,上午"), ("night", "n.", "夜晚"), ("today", "n.", "今天"),
    ("tomorrow", "n.", "明天"), ("yesterday", "n.", "昨天"), ("time", "n.", "时间"),
    ("food", "n.", "食物"), ("music", "n.", "音乐"), ("movie", "n.", "电影"),
    ("phone", "n.", "电话,手机"), ("computer", "n.", "计算机,电脑"), ("home", "n.", "家"),
    ("city", "n.", "城市"), ("country", "n.", "国家;乡村"), ("money", "n.", "钱"),
    ("work", "v.", "工作;n. 工作"), ("study", "v.", "学习"), ("read", "v.", "阅读"),
    ("write", "v.", "写"), ("speak", "v.", "说,讲"), ("listen", "v.", "听"),
    ("run", "v.", "跑;经营"), ("walk", "v.", "走,散步"), ("eat", "v.", "吃"),
    ("drink", "v.", "喝"), ("sleep", "v.", "睡觉"), ("love", "v.", "爱;n. 爱"),
    ("like", "v.", "喜欢"), ("help", "v.", "帮助"), ("open", "v.", "打开;adj. 开着的"),
    ("close", "v.", "关闭;adj. 亲近的"), ("start", "v.", "开始"), ("stop", "v.", "停止"),
    ("beautiful", "adj.", "美丽的"), ("important", "adj.", "重要的"), ("difficult", "adj.", "困难的"),
    ("easy", "adj.", "容易的"), ("new", "adj.", "新的"), ("old", "adj.", "旧的,老的"),
    ("young", "adj.", "年轻的"), ("hot", "adj.", "热的"), ("cold", "adj.", "冷的"),
    ("abandon", "v.", "抛弃,放弃"), ("abolish", "v.", "废除,取消"), ("absorb", "v.", "吸收,吸引"),
    ("abstract", "adj.", "抽象的"), ("accelerate", "v.", "加速,促进"), ("accompany", "v.", "陪伴,伴随"),
    ("accumulate", "v.", "积累,积聚"), ("accurate", "adj.", "精确的,准确的"), ("acquire", "v.", "获得,习得"),
    ("adapt", "v.", "适应,改编"), ("adequate", "adj.", "足够的,适当的"), ("adjacent", "adj.", "邻近的,毗连的"),
    ("adopt", "v.", "采纳,收养"), ("advocate", "v.", "提倡,拥护"), ("aesthetic", "adj.", "美学的,审美的"),
    ("aggregate", "n.", "总和,聚合"), ("alleviate", "v.", "减轻,缓和"), ("allocate", "v.", "分配,拨给"),
    ("ambitious", "adj.", "有雄心的,有抱负的"), ("analogy", "n.", "类比,类推"), ("anticipate", "v.", "预期,期望"),
    ("apparent", "adj.", "明显的,表面的"), ("appeal", "v.", "呼吁,上诉"), ("arbitrary", "adj.", "任意的,专断的"),
    ("articulate", "adj.", "口齿清晰的"), ("aspire", "v.", "渴望,追求"), ("assemble", "v.", "集合,装配"),
    ("assert", "v.", "断言,主张"), ("assess", "v.", "评估,估价"), ("assign", "v.", "分配,指派"),
    ("assume", "v.", "假定,承担"), ("attain", "v.", "达到,获得"), ("attribute", "v.", "把…归因于"),
    ("authentic", "adj.", "真正的,可信的"), ("autonomy", "n.", "自治,自主"), ("aversion", "n.", "厌恶,反感"),
    ("bewilder", "v.", "使迷惑,使为难"), ("bias", "n.", "偏见,偏差"), ("bizarre", "adj.", "古怪的,离奇的"),
    ("boost", "v.", "促进,提高"), ("boundary", "n.", "边界,界限"), ("brisk", "adj.", "轻快的,活跃的"),
    ("calculate", "v.", "计算,估计"), ("cancel", "v.", "取消,抵消"), ("capable", "adj.", "有能力的"),
    ("capacity", "n.", "容量,能力"), ("catastrophe", "n.", "大灾难"), ("cease", "v.", "停止,终止"),
    ("cherish", "v.", "珍爱,怀有"), ("circulate", "v.", "循环,流通"), ("clarify", "v.", "澄清,阐明"),
    ("coherent", "adj.", "连贯的,一致的"), ("collapse", "v.", "倒塌,崩溃"), ("commence", "v.", "开始"),
    ("compel", "v.", "强迫,迫使"), ("compensate", "v.", "补偿,弥补"), ("competent", "adj.", "有能力的,称职的"),
    ("comply", "v.", "遵从,服从"), ("comprehensive", "adj.", "综合的,全面的"), ("comprise", "v.", "包含,构成"),
    ("conceal", "v.", "隐藏,隐瞒"), ("concede", "v.", "承认,让步"), ("conceive", "v.", "构想,怀孕"),
    ("condemn", "v.", "谴责,判刑"), ("confront", "v.", "面对,对抗"), ("consecutive", "adj.", "连续的"),
    ("consensus", "n.", "共识,一致"), ("conserve", "v.", "保存,节约"), ("consistent", "adj.", "一致的,连贯的"),
    ("conspire", "v.", "密谋,共谋"), ("constrain", "v.", "限制,约束"), ("contaminate", "v.", "污染"),
    ("contemplate", "v.", "沉思,考虑"), ("contradict", "v.", "反驳,与…矛盾"), ("controversy", "n.", "争论,争议"),
    ("convey", "v.", "传达,运送"), ("cooperate", "v.", "合作,协作"), ("cope", "v.", "应付,处理"),
    ("corrupt", "adj.", "腐败的,堕落的"), ("credible", "adj.", "可信的"), ("crucial", "adj.", "至关重要的"),
    ("cultivate", "v.", "培养,耕作"), ("cumulative", "adj.", "累积的"), ("curb", "v.", "抑制,约束"),
    ("decay", "v.", "腐烂,衰败"), ("deceive", "v.", "欺骗"), ("dedicate", "v.", "奉献,致力于"),
    ("deduce", "v.", "推断,演绎"), ("defer", "v.", "推迟,遵从"), ("deliberate", "adj.", "故意的,深思熟虑的"),
    ("demolish", "v.", "拆毁,推翻"), ("denote", "v.", "表示,意味着"), ("deplete", "v.", "耗尽,枯竭"),
    ("deprive", "v.", "剥夺"), ("derive", "v.", "起源,衍生"), ("designate", "v.", "指定,标明"),
    ("deteriorate", "v.", "恶化,变坏"), ("devise", "v.", "设计,想出"), ("diminish", "v.", "减少,缩小"),
    ("discard", "v.", "丢弃,抛弃"), ("discern", "v.", "辨别,察觉"), ("disclose", "v.", "揭露,透露"),
    ("dispatch", "v.", "派遣,发送"), ("disperse", "v.", "驱散,散布"), ("disrupt", "v.", "扰乱,中断"),
    ("distort", "v.", "扭曲,歪曲"), ("distract", "v.", "分散(注意力)"), ("distribute", "v.", "分发,分布"),
    ("diverse", "adj.", "多样的,不同的"), ("dominate", "v.", "支配,统治"), ("dubious", "adj.", "可疑的,怀疑的"),
    ("durable", "adj.", "耐用的,持久的"), ("dynamic", "adj.", "动态的,有活力的"), ("eligible", "adj.", "有资格的"),
    ("embrace", "v.", "拥抱,接受"), ("emerge", "v.", "出现,浮现"), ("eminent", "adj.", "杰出的,著名的"),
    ("emphasize", "v.", "强调"), ("endorse", "v.", "支持,背书"), ("endure", "v.", "忍受,持久"),
    ("enhance", "v.", "提高,增强"), ("enormous", "adj.", "巨大的"), ("enrich", "v.", "使丰富,使富裕"),
    ("entail", "v.", "需要,使承担"), ("epidemic", "n.", "流行病"), ("equivalent", "adj.", "相等的,等价的"),
    ("erode", "v.", "侵蚀,削弱"), ("essential", "adj.", "必要的,本质的"), ("evacuate", "v.", "疏散,撤离"),
    ("evaluate", "v.", "评估,评价"), ("evoke", "v.", "唤起,引起"), ("exaggerate", "v.", "夸大,夸张"),
    ("exceed", "v.", "超过,胜过"), ("exclude", "v.", "排除,拒绝"), ("exempt", "adj.", "被免除的"),
    ("exert", "v.", "施加,尽力"), ("exotic", "adj.", "异国的,奇异的"), ("expedite", "v.", "加快,促进"),
    ("explicit", "adj.", "明确的,清楚的"), ("exploit", "v.", "利用,开发"), ("extract", "v.", "提取,榨取"),
    ("fabricate", "v.", "捏造,制造"), ("facilitate", "v.", "促进,使便利"), ("feasible", "adj.", "可行的"),
    ("fluctuate", "v.", "波动,起伏"), ("foster", "v.", "培养,促进"), ("fulfil", "v.", "履行,实现"),
    ("fundamental", "adj.", "基本的,根本的"), ("generate", "v.", "产生,生成"), ("glimpse", "n.", "一瞥"),
    ("gloomy", "adj.", "阴郁的,悲观的"), ("gorgeous", "adj.", "华丽的,极好的"), ("gracious", "adj.", "亲切的,优雅的"),
    ("hamper", "v.", "妨碍,阻碍"), ("hazard", "n.", "危险,危害"), ("heritage", "n.", "遗产,传统"),
    ("hinder", "v.", "阻碍,妨碍"), ("humble", "adj.", "谦逊的,卑微的"), ("hypothesis", "n.", "假设,假说"),
    ("identical", "adj.", "完全相同的"), ("ignite", "v.", "点燃,引发"), ("illuminate", "v.", "照亮,阐明"),
    ("imitate", "v.", "模仿"), ("immense", "adj.", "巨大的"), ("impair", "v.", "损害,削弱"),
    ("impose", "v.", "强加,征收"), ("incentive", "n.", "激励,动机"), ("incline", "v.", "倾向,倾斜"),
    ("indispensable", "adj.", "不可或缺的"), ("induce", "v.", "诱导,引起"), ("indulge", "v.", "放纵,沉溺"),
    ("inevitable", "adj.", "不可避免的"), ("infer", "v.", "推断"), ("inhabit", "v.", "居住于"),
    ("inherent", "adj.", "固有的,内在的"), ("inhibit", "v.", "抑制,阻止"), ("initiate", "v.", "开始,发起"),
    ("innovate", "v.", "创新,革新"), ("insert", "v.", "插入"), ("integrate", "v.", "整合,使一体化"),
    ("intense", "adj.", "强烈的,紧张的"), ("intervene", "v.", "干预,介入"), ("intricate", "adj.", "复杂的,错综的"),
    ("intrigue", "v.", "激起兴趣,密谋"), ("intrinsic", "adj.", "内在的,固有的"), ("invade", "v.", "入侵,侵犯"),
    ("investigate", "v.", "调查,研究"), ("isolate", "v.", "隔离,孤立"), ("jeopardize", "v.", "危及,损害"),
    ("justify", "v.", "证明…正当,辩护"), ("legitimate", "adj.", "合法的,正当的"), ("linger", "v.", "逗留,徘徊"),
    ("magnify", "v.", "放大,夸大"), ("maintain", "v.", "维持,主张"), ("manipulate", "v.", "操纵,控制"),
    ("marginal", "adj.", "边缘的,微小的"), ("mediate", "v.", "调解,斡旋"), ("mitigate", "v.", "减轻,缓和"),
    ("modify", "v.", "修改,更改"), ("monitor", "v.", "监控,监测"), ("negligible", "adj.", "微不足道的"),
    ("nourish", "v.", "滋养,养育"), ("obscure", "adj.", "晦涩的,模糊的"), ("obsolete", "adj.", "过时的,废弃的"),
    ("optimistic", "adj.", "乐观的"), ("originate", "v.", "起源,发起"), ("outrage", "n.", "暴行,愤怒"),
    ("overwhelm", "v.", "压倒,淹没"), ("paradox", "n.", "悖论,矛盾"), ("penetrate", "v.", "穿透,渗透"),
    ("perceive", "v.", "感知,察觉"), ("persist", "v.", "坚持,持续"), ("pervasive", "adj.", "普遍的,弥漫的"),
    ("phenomenon", "n.", "现象"), ("pledge", "v.", "保证,发誓"), ("plunge", "v.", "猛跌,投入"),
    ("ponder", "v.", "沉思,考虑"), ("portray", "v.", "描绘,刻画"), ("precede", "v.", "先于,领先"),
    ("predominant", "adj.", "占主导的,显著的"), ("prevail", "v.", "盛行,占优势"), ("proclaim", "v.", "宣布,声明"),
    ("profound", "adj.", "深刻的,深远的"), ("prohibit", "v.", "禁止"), ("prominent", "adj.", "突出的,著名的"),
    ("propel", "v.", "推进,驱使"), ("prosper", "v.", "繁荣,兴旺"), ("provoke", "v.", "激怒,引起"),
    ("pursue", "v.", "追求,继续"), ("radical", "adj.", "激进的,根本的"), ("reckon", "v.", "认为,估计"),
    ("reconcile", "v.", "调和,使和解"), ("refine", "v.", "提炼,改进"), ("refute", "v.", "驳斥,反驳"),
    ("reinforce", "v.", "加强,增援"), ("reject", "v.", "拒绝,排斥"), ("relevant", "adj.", "相关的,切题的"),
    ("reluctant", "adj.", "不情愿的"), ("render", "v.", "使成为,给予"), ("resemble", "v.", "类似,像"),
    ("reside", "v.", "居住,存在于"), ("restore", "v.", "恢复,修复"), ("restrain", "v.", "抑制,约束"),
    ("retain", "v.", "保留,记住"), ("retrieve", "v.", "取回,检索"), ("reveal", "v.", "揭示,显示"),
    ("rigorous", "adj.", "严格的,严谨的"), ("robust", "adj.", "强健的,稳健的"), ("scatter", "v.", "散布,驱散"),
    ("scrutinize", "v.", "仔细审查"), ("simultaneous", "adj.", "同时的"), ("sophisticated", "adj.", "复杂的,老练的"),
    ("spontaneous", "adj.", "自发的,自然的"), ("stimulate", "v.", "刺激,激励"), ("strive", "v.", "努力,奋斗"),
    ("subtle", "adj.", "微妙的,细微的"), ("suffice", "v.", "足够"), ("superficial", "adj.", "肤浅的,表面的"),
    ("suppress", "v.", "压制,抑制"), ("surpass", "v.", "超越,胜过"), ("suspend", "v.", "暂停,悬挂"),
    ("sustain", "v.", "维持,支撑"), ("terminate", "v.", "终止,结束"), ("thrive", "v.", "繁荣,茁壮成长"),
    ("tolerate", "v.", "容忍,忍受"), ("transform", "v.", "转变,改造"), ("transmit", "v.", "传送,传播"),
    ("trivial", "adj.", "琐碎的,不重要的"), ("undermine", "v.", "破坏,削弱"), ("uniform", "adj.", "统一的,一致的"),
    ("utilize", "v.", "利用"), ("vague", "adj.", "模糊的,含糊的"), ("verify", "v.", "证实,核实"),
    ("vivid", "adj.", "生动的,鲜明的"), ("vulnerable", "adj.", "脆弱的,易受伤的"), ("withstand", "v.", "抵挡,经受"),
    ("yield", "v.", "产生,屈服"),
]

# 合并:详细词(带真实例句)+ 批量词(自动生成干扰项与例句)
_all_meanings = [row[3] for row in W] + [b[2] for b in BULK]


def _bulk_options(word, meaning):
    """从全词义池里挑 3 个不同的干扰项(按词名做种子,稳定)"""
    seed = sum(ord(c) for c in word)
    pool = [m for m in _all_meanings if m != meaning]
    picks = []
    i = 0
    while len(picks) < 3 and i < len(pool) * 2:
        cand = pool[(seed + i * 37) % len(pool)]
        if cand not in picks and cand != meaning:
            picks.append(cand)
        i += 1
    return picks


BULK_W = []
for (w, pos, mean) in BULK:
    BULK_W.append((w, "", pos, mean, _bulk_options(w, mean),
                   f'The word "{w}" often appears in exams.', f'「{w}」这个词常在考试中出现。', None, None))
W = W + BULK_W

WORDS = []
for i, (w, ph, pos, mean, opts, sent, sc, freq, roots) in enumerate(W):
    d = {
        "id": f"w{i + 1:03d}", "word": w, "phonetic": ph, "pos": pos, "meaning": mean,
        "options": opts, "sentence": sent, "sentenceCn": sc, "image": f"words/{w}.png",
    }
    if freq:
        d["examFreq"] = freq
    if roots:
        d["roots"] = roots
    WORDS.append(d)

# 学习状态种子:前若干词已学(learning/known/zhan),其余未学。多样(§10.3)
LEARN = {}
for i, wd in enumerate(WORDS):
    wid = wd["id"]
    if i < 2:
        LEARN[wid] = {"status": "known", "nextReviewDay": [32, 25][i], "collected": True}
    elif i < 5:
        LEARN[wid] = {"status": "learning", "nextReviewDay": 1, "collected": i == 2}
    elif wd["word"] in ("badger", "tackle"):
        LEARN[wid] = {"status": "zhan", "nextReviewDay": 999, "collected": False}
    elif i < 12:
        LEARN[wid] = {"status": "learning", "nextReviewDay": (i % 9) + 1, "collected": False}
    else:
        LEARN[wid] = {"status": "new", "nextReviewDay": 0, "collected": False}

# 收藏单词本(39 词:取前 39 个 id)
COLLECTED = [w["id"] for w in WORDS[:39]]
for wid in COLLECTED:
    LEARN[wid]["collected"] = True

BOOKS = [
    {"id": "gre3000", "name": "GRE3000", "cover": "#3B3F8F", "total": 2904, "added": True, "tag": "hot", "desc": "GRE 核心词汇 2904 词"},
    {"id": "ielts", "name": "雅思核心", "cover": "#D64541", "total": 3500, "added": True, "tag": "abroad", "desc": "雅思核心词汇"},
    {"id": "cet6hi", "name": "六级核心高分版", "cover": "#C0392B", "total": 2200, "added": True, "tag": "college", "desc": "六级高频词"},
    {"id": "cet4hi", "name": "四级高频", "cover": "#27AE60", "total": 739, "added": True, "tag": "college", "desc": "四级超高频词"},
    {"id": "cet6", "name": "六级词汇", "cover": "#2C3E50", "total": 6204, "added": True, "tag": "college", "desc": "六级全部词汇"},
    {"id": "gaokao", "name": "高考词汇", "cover": "#E67E22", "total": 4135, "added": True, "tag": "highschool", "desc": "高考大纲词汇"},
    {"id": "nce1", "name": "新概念第一册", "cover": "#F1C40F", "total": 900, "added": True, "tag": "hot", "desc": "新概念英语第一册"},
    {"id": "zhongkao", "name": "中考词汇", "cover": "#F39C12", "total": 2124, "added": False, "tag": "hot", "desc": "中考核心词汇"},
    {"id": "cet4full", "name": "四级词汇大全", "cover": "#16A085", "total": 4440, "added": False, "tag": "college", "desc": "四级全部词汇"},
    {"id": "kaoyan", "name": "考研2027完整版", "cover": "#8E44AD", "total": 5063, "added": False, "tag": "college", "desc": "考研大纲词汇"},
]

PRODUCTS = [
    {"id": "p_max", "title": "百词斩单词机Max超大屏幕真人外教发音单词机", "subtitle": "随时随地背单词",
     "price": 349, "coinPrice": 37, "image": "products/max.png", "sold": 19100, "specs": ["小蜜瓜", "云母白", "薄荷绿"]},
    {"id": "p_std", "title": "百词斩单词机 便携背单词神器", "subtitle": "让碎片时间更高效",
     "price": 349, "coinPrice": 37, "image": "products/std.png", "sold": 20000, "specs": ["经典白", "太空灰"]},
    {"id": "p_pen", "title": "百词斩词典笔扫描笔 考纲真题例句", "subtitle": "备考词典笔",
     "price": 399, "coinPrice": 340, "image": "products/pen.png", "sold": 3713, "specs": ["标准版"]},
    {"id": "p_ruler", "title": "Easy Parallel小直尺 可在凹槽轻松画直线", "price": 8.9, "coinPrice": 7.9,
     "image": "products/ruler.png", "sold": 49000, "specs": ["1支", "3支装"]},
    {"id": "p_cet4", "title": "英语四级词汇书 收录历年真题高频词", "price": 48.9, "coinPrice": 44.9,
     "image": "products/cet4book.png", "sold": 1199, "specs": ["单册"]},
    {"id": "p_cet6pack", "title": "英语六级真题备考包", "price": 48, "coinPrice": 28,
     "image": "products/cet6pack.png", "sold": 784, "specs": ["套装"]},
    {"id": "p_board", "title": "A4多功能方格板夹 有它就可以在床上写试卷啦", "price": 18.9, "coinPrice": 17.9,
     "image": "products/board.png", "sold": 34000, "specs": ["A4"]},
    {"id": "p_notebook", "title": "康奈尔5R记忆法笔记本 课堂笔记之选", "price": 29.8, "coinPrice": 27.8,
     "image": "products/notebook.png", "sold": 220000, "specs": ["方格", "横线"]},
    {"id": "p_clip", "title": "百词斩浅铜色金属水滴书签回形针 12颗一袋", "price": 3.9, "coinPrice": 2.9,
     "image": "products/clip.png", "sold": 133000, "specs": ["12颗装"]},
    {"id": "p_tape", "title": "无痕可移强粘性双面圆点胶 一看就会", "price": 11.9, "coinPrice": 10.9,
     "image": "products/tape.png", "sold": 55000, "specs": ["1卷"]},
    {"id": "p_earphone", "title": "百词斩单词机专用3.5mm 有线耳机", "price": 39, "coinPrice": 35,
     "image": "products/earphone.png", "sold": 7794, "specs": ["经典白"]},
    {"id": "p_pencase", "title": "大容量猫窝笔袋 文具收纳", "price": 38.9, "coinPrice": 35.9,
     "image": "products/pencase.png", "sold": 100000, "specs": ["奶牛", "橘猫"]},
]

ARTICLES = [
    {"id": "a_711", "title": "7-Eleven Sues Nike Over Similar Stripe Design",
     "titleCn": "7-Eleven 起诉耐克:球鞋配色涉嫌商标侵权", "wordCount": 415, "level": "中阶+",
     "cover": "articles/711.png", "tag": "时事",
     "body": [
         {"en": "7-Eleven has filed a lawsuit in a federal court in Texas, accusing the sportswear giant of borrowing the convenience-store chain's well-known orange, green and red stripe design for an upcoming Air Max 95 sneaker.",
          "cn": "7-Eleven 已在得州联邦法院提起诉讼,指控这家运动服饰巨头为即将推出的 Air Max 95 球鞋盗用了该便利店连锁标志性的橙、绿、红三色条纹设计。"},
         {"en": "In a lawsuit filed on July 1 in Dallas, 7-Eleven argued that the sneaker features a \"confusingly similar imitation\" of its tri-color branding, which has appeared for decades on store signs, advertising materials, merchandise and other products.",
          "cn": "在 7 月 1 日于达拉斯提起的诉讼中,7-Eleven 主张该球鞋呈现出对其三色品牌标识\"令人混淆的相似模仿\",而这一标识数十年来出现在店招、广告物料、商品等各处。"},
         {"en": "The convenience-store chain claims that the resemblance is so strong that ordinary shoppers might reasonably believe the shoe was produced in an official partnership between the two brands, or that 7-Eleven had somehow approved the design.",
          "cn": "这家便利店连锁声称,二者的相似度如此之高,以至于普通消费者可能会合理地相信,这款鞋是两个品牌官方合作的产物,或者 7-Eleven 曾以某种方式批准了该设计。"},
         {"en": "According to the complaint, the company had reached out to the sportswear maker before taking legal action, but the two sides failed to arrive at an agreement. 7-Eleven is now seeking to block the release of the sneaker and to recover damages.",
          "cn": "根据诉状,该公司在采取法律行动之前曾与这家运动服饰厂商接洽,但双方未能达成一致。7-Eleven 现在寻求阻止这款球鞋上市,并索赔损失。"},
         {"en": "Legal experts note that trademark disputes over color combinations are notoriously difficult to win, since a brand must prove that consumers strongly associate a particular set of colors with its own identity rather than with the product category in general.",
          "cn": "法律专家指出,围绕配色组合的商标纠纷向来极难胜诉,因为品牌必须证明:消费者会将某一组特定颜色与其自身身份强烈关联,而非与整个产品品类关联。"},
         {"en": "For now, the sportswear giant has declined to comment on the pending litigation, while sneaker enthusiasts online remain divided over whether the striped design was a deliberate homage or simply a coincidence.",
          "cn": "目前,这家运动服饰巨头拒绝就尚未了结的诉讼置评,而网上的球鞋爱好者们则对这条纹设计究竟是刻意致敬还是纯属巧合争论不休。"},
     ]},
    {"id": "a_tencent", "title": "Tencent Tests AI Assistant To Catch Up",
     "titleCn": "起步落后对手,小微能否扭转腾讯 AI 劣势?", "wordCount": 636, "level": "高阶",
     "cover": "articles/tencent.png", "tag": "商业",
     "body": [
         {"en": "Tencent is rolling out an upgraded AI assistant as it races to close the gap with domestic rivals in the fast-moving field of generative artificial intelligence.",
          "cn": "腾讯正在推出升级版 AI 助手,以在快速演进的生成式人工智能领域追赶国内竞争对手。"},
         {"en": "The new assistant, deeply integrated into the company's messaging and payment ecosystem, is designed to answer questions, summarize documents and help users draft messages without leaving the apps they already use every day.",
          "cn": "这款新助手深度集成到公司的即时通讯与支付生态中,旨在让用户无需离开他们每天使用的应用,就能获得问答、文档摘要和消息草拟等帮助。"},
         {"en": "Analysts say Tencent's greatest advantage lies not in the raw capability of its underlying model, but in its enormous user base, which gives any new feature an instant audience of hundreds of millions.",
          "cn": "分析人士认为,腾讯最大的优势并不在于其底层模型的原始能力,而在于其庞大的用户群——这让任何新功能都能瞬间拥有数以亿计的受众。"},
         {"en": "Still, the company faces the delicate task of introducing AI features without overwhelming users or raising fresh concerns about privacy, a balance that has tripped up several of its competitors.",
          "cn": "尽管如此,该公司仍面临一个微妙的难题:如何在不让用户感到负担、也不引发新的隐私担忧的前提下推出 AI 功能——这一平衡曾让它的数个竞争对手栽了跟头。"},
         {"en": "Whether Tencent can turn its late start into a lasting advantage will depend on how quickly it can iterate, and on whether users find the assistant genuinely useful rather than merely novel.",
          "cn": "腾讯能否将其起步的迟缓转化为持久的优势,将取决于它迭代的速度,以及用户是否觉得这款助手真正有用,而非仅仅新奇。"},
     ]},
    {"id": "a_choc", "title": "Why Do We Give Chocolate On Valentine's Day?",
     "titleCn": "巧克力为何成为情人节首选礼物?", "wordCount": 340, "level": "中阶",
     "cover": "articles/choc.png", "tag": "文化",
     "body": [
         {"en": "The tradition of giving chocolate on Valentine's Day dates back to the 19th century, when a British chocolate maker began selling heart-shaped boxes filled with sweets.",
          "cn": "情人节送巧克力的传统可追溯到 19 世纪,当时一家英国巧克力制造商开始出售装满糖果的心形礼盒。"},
         {"en": "Long before that, chocolate was considered a rare and precious luxury, reserved for royalty and the wealthy, and even believed by some to have romantic and medicinal powers.",
          "cn": "而在更早之前,巧克力被视为稀有而珍贵的奢侈品,专供王室与富人享用,甚至有人相信它具有浪漫与药用的功效。"},
         {"en": "Clever advertising in the following century transformed the treat into a symbol of affection, until offering a box of chocolates became one of the most recognizable gestures of love.",
          "cn": "在随后的一个世纪里,巧妙的广告将这种甜食塑造成情感的象征,直到送上一盒巧克力成为最易辨识的爱意表达之一。"},
         {"en": "Today, millions of boxes are exchanged each February, proof that a simple marketing idea can, over time, harden into a global custom that few of us ever stop to question.",
          "cn": "如今,每年二月都有数以百万计的礼盒被交换,这证明了一个简单的营销创意,经过时间的沉淀,能固化为一项我们几乎从不停下来质疑的全球习俗。"},
     ]},
]

PROFILE = {
    "name": "氨基酸", "bczId": "100000001", "avatar": "user",
    "listenVocab": 4638, "readVocab": 4839, "learnedCount": 1889,
}

SETTINGS = {
    "sound": True, "vibrate": True, "pushMaster": True,
    "push": {"challenge": True, "together": True, "daily": True, "review": True},
    "personalizePush": True, "accent": "us", "wordSort": "timeAsc",
    "identity": "工作党", "studyMode": "recognize",
}

data = {
    "profile": PROFILE,
    "words": WORDS,
    "learn": LEARN,
    "books": BOOKS,
    "currentBookId": "gre3000",
    "dailyGroups": 10,
    "today": {"newDone": 0, "reviewDone": 0, "newTarget": 10, "reviewTarget": 1},
    "coins": 5,
    "streakDays": 0,
    "protectEquipped": 0,
    "stars": 0,
    "claimedTasks": [],
    "wordbooks": [{"id": "wb_collect", "name": "收藏的单词", "wordIds": COLLECTED}],
    "products": PRODUCTS,
    "cart": [],
    "addresses": [],
    "order": {"payMethod": "wechat", "useCoin": True, "note": ""},
    "articles": ARTICLES,
    "shelf": [],
    "readChars": 827,
    "settings": SETTINGS,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"OK: {OUT}  words={len(WORDS)} books={len(BOOKS)} products={len(PRODUCTS)} articles={len(ARTICLES)} collected={len(COLLECTED)}")
