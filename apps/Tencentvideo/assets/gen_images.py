# -*- coding: utf-8 -*-
"""
Tencentvideo 装饰位图批量生图(骨架抄 apps/Keep/assets/gen_images.py)。
- key 只从环境变量读,绝不写进代码/git:IMAGE_GEN_API_KEY(必填)、
  IMAGE_GEN_BASE_URL(默认 http://15.204.107.114:3009)、IMAGE_GEN_MODEL(默认 gpt-image-2)。
- 幂等:已存在的 PNG 跳过;失败可重跑只补缺失。4 线程并发。
- 安全:prompt 只描述合成主体,绝不上传真机截图;全部为虚构内容,不出现真实剧名/真实人物肖像。
- 产出:apps/Tencentvideo/res/img/<id>.png,id 与 data/defaults.json 中
  poster/still/avatar/img/cover 等字段引用一一对应(缺失由 data/regen_defaults.py 回落 SVG 占位)。
运行:
  IMAGE_GEN_API_KEY=... python apps/Tencentvideo/assets/gen_images.py
"""
import base64, json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


def _post_json(url, payload, headers, timeout=300):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={**headers, "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.read().decode()


def _get_bytes(url, timeout=120):
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return resp.read()


IMG_DIR = Path(__file__).parent.parent / "res" / "img"
KEY = os.environ.get("IMAGE_GEN_API_KEY")
BASE = (os.environ.get("IMAGE_GEN_BASE_URL") or "http://15.204.107.114:3009").rstrip("/")
MODEL = os.environ.get("IMAGE_GEN_MODEL") or "gpt-image-2"
if not KEY:
    sys.exit("缺少 IMAGE_GEN_API_KEY 环境变量;未配置则跳过生图(缺图由 regen_defaults.py 回落 SVG 占位)。")

URL = f"{BASE}/images/generations" if BASE.endswith("/v1") else f"{BASE}/v1/images/generations"
NO_TEXT = ",无任何文字,无水印,无logo"
POSTER = ",影视剧竖版海报构图,电影级打光,高质感"      # 2:3 竖版
STILL = ",影视剧横版剧照,电影级画面,高质感"           # 16:9 横版
AVATAR = ",社交App用户头像,居中构图,纯色简洁背景"
PRODUCT = ",电商商品主图,专业产品摄影,浅色干净背景"
BANNER = ",App频道页横幅运营图,横版构图,视觉冲击力强"

V = "1024x1536"   # 竖版海报 2:3
H = "1536x1024"   # 横版剧照/banner 16:9
S = "1024x1024"   # 方图

# 资产清单 {图片id: (prompt, size)};覆盖 defaults.json 引用的全部图片 id。
ASSETS = {
    # ---- 剧集竖版海报 ----
    "poster_tv_qianfangjie":     ("古装权谋剧竖版海报,宫殿飞檐剪影与漫天飘落花瓣,一男一女古装背影对立,冷暗红金色调" + POSTER, V),
    "poster_tv_zheyikexindong":  ("现代都市爱情剧竖版海报,城市天台夜景,消防员制服男性与白大褂女医生对望剪影,暖橙蓝色调" + POSTER, V),
    "poster_tv_hushanghuakai":   ("九十年代上海怀旧年代剧竖版海报,霓虹灯招牌街道,西装男子背影,金黄暖色胶片质感" + POSTER, V),
    "poster_tv_jifengxingdong":  ("刑侦缉毒剧竖版海报,雨夜码头集装箱,持枪警察侧影与探照灯光束,冷蓝黑色调" + POSTER, V),
    "poster_tv_qichongjin":      ("古装宅斗剧竖版海报,深宅庭院层层门廊,锦衣古装女子回眸,绛红鎏金色调" + POSTER, V),
    "poster_tv_zhuluan":         ("古装传奇剧竖版海报,鸾鸟纹玉佩特写与古风阁楼,青金配色,神秘氛围" + POSTER, V),
    "poster_tv_yueliangjishi":   ("都市温情剧竖版海报,深夜旧货集市暖黄灯串,摊位与月亮,治愈系插画风" + POSTER, V),
    "poster_tv_luanchichunxiao": ("古装爱情剧竖版海报,春日池畔桃花纷飞,古装男女执伞相对,粉青色调唯美" + POSTER, V),
    "poster_tv_tiegulinfeng":    ("军旅热血剧竖版海报,迷彩服士兵在风沙训练场奔跑,硬朗军绿色调,逆光" + POSTER, V),
    "poster_tv_taiqian":         ("都市行业剧竖版海报,老剧场舞台追光灯下的孤独身影,深红幕布,文艺质感" + POSTER, V),
    "poster_tv_hezugongyu4":     ("都市青春喜剧竖版海报,明亮公寓客厅沙发上的年轻人群像,活泼撞色,轻松欢乐" + POSTER, V),
    "poster_tv_wodehoubanchang": ("都市女性成长剧竖版海报,职场女性走在写字楼玻璃幕墙前,晨光暖色,时尚大气" + POSTER, V),
    "poster_tv_shenghuodaluandun": ("海外情景喜剧竖版海报,复古客厅里四个科学宅与实验器材,漫画感撞色,幽默风" + POSTER, V),
    "poster_tv_mingzhentanluoke": ("英伦悬疑剧竖版海报,雾夜伦敦街头风衣侦探剪影与路灯,深蓝灰色调" + POSTER, V),
    "poster_tv_wangchunnian2":   ("古装权谋剧竖版海报,雪中京都城楼,白衣少年负手而立,水墨留白风格" + POSTER, V),
    # ---- 电影竖版海报 ----
    "poster_mv_daomengtuan3":    ("魔术悬疑电影竖版海报,四位西装魔术师剪影与漫天飞舞扑克牌,深蓝紫舞台光" + POSTER, V),
    "poster_mv_daomengtuan1":    ("魔术犯罪电影竖版海报,聚光灯下的礼帽与白手套,扑克牌悬浮,金蓝色调" + POSTER, V),
    "poster_mv_daomengtuan2":    ("魔术犯罪电影竖版海报,雨夜澳门霓虹街头,魔术师撑伞背影,青紫霓虹色调" + POSTER, V),
    "poster_mv_toutianjihua":    ("赌城劫案喜剧电影竖版海报,赌场轮盘与筹码飞溅,金色奢华光影,群像剪影" + POSTER, V),
    "poster_mv_zhumengmigong":   ("科幻悬疑电影竖版海报,折叠翻转的城市街道,西装男子行走其间,冷灰蓝超现实" + POSTER, V),
    "poster_mv_jixianzhiwai":    ("硬科幻电影竖版海报,近地轨道太空缆索上的宇航员孤影,地球弧线背景,深空蓝" + POSTER, V),
    "poster_mv_anyong1995":      ("九十年代港风警匪电影竖版海报,雨夜霓虹小巷持枪对峙剪影,胶片颗粒,青橙色调" + POSTER, V),
    "poster_mv_chaonengzhe2":    ("超级英雄科幻电影竖版海报,披风人影悬浮于陨石坠落的小镇上空,暗金红色调" + POSTER, V),
    "poster_mv_taitaitailipu":   ("爱情喜剧电影竖版海报,婚礼现场彩带纷飞,新郎与陌生女孩滑稽对视,明快糖果色" + POSTER, V),
    "poster_mv_xindongyugao":    ("港台爱情喜剧电影竖版海报,录音棚里的歌手与经纪人背对背,复古胶片暖色" + POSTER, V),
    "poster_mv_yizhanfanshen":   ("励志拳击喜剧电影竖版海报,拳击台围绳边缠绷带的中年拳手背影,汗水与顶光,热血" + POSTER, V),
    "poster_mv_xinghaifangzhou": ("演唱会电影竖版海报,体育场十万人海洋与舞台激光,星空蓝紫色调,震撼现场" + POSTER, V),
    # ---- 综艺竖版海报 ----
    "poster_vs_chongyaba10":     ("户外竞技真人秀竖版海报,泥潭障碍赛场地与飞溅泥点,鲜黄蓝撞色,动感活力" + POSTER, V),
    "poster_vs_duanzishou":      ("脱口秀综艺竖版海报,深色舞台上的立式麦克风与聚光灯,红色幕布,极简幽默" + POSTER, V),
    "poster_vs_weishuxindong5":  ("恋爱观察综艺竖版海报,暖色公寓客厅落地窗与两杯咖啡,粉橙柔光,浪漫治愈" + POSTER, V),
    "poster_vs_pengranpinlv8":   ("恋爱推理综艺竖版海报,信号小屋夜景与漫天星光,心形信号波纹,蓝粉渐变" + POSTER, V),
    "poster_vs_heihei6":         ("喜剧旅行真人秀竖版海报,乡间公路上的敞篷小车与行李箱,明黄色调,松弛快乐" + POSTER, V),
    "poster_vs_shuozoujiuzou3":  ("旅行真人秀竖版海报,西北公路延伸至雪山,车窗外飘扬的丝巾,辽阔日落色" + POSTER, V),
    "poster_vs_diqiuzhenxinxian2": ("自然探索综艺竖版海报,火山口露营帐篷与极光夜空,深绿蓝色调,壮丽" + POSTER, V),
    "poster_vs_tianshengshengxian7": ("音乐竞演综艺竖版海报,环形舞台与升降话筒,金紫舞台灯海,高级感" + POSTER, V),
    "poster_vs_yiweifengshen":   ("美食竞技综艺竖版海报,灶台猛火颠勺剪影与飞起的食材,红金色调,烟火气" + POSTER, V),
    "poster_vs_tuilikaishile4":  ("实景剧本推理综艺竖版海报,老洋馆书房烛光与放大镜,墨绿深棕悬疑色调" + POSTER, V),
    # ---- 动漫竖版海报 ----
    "poster_an_douxuandalu2":    ("国产玄幻动画竖版海报,持双武魂光效的少年战斗姿态,金蓝能量特效,3D渲染" + POSTER, V),
    "poster_an_zhanwang2":       ("都市热血动画竖版海报,黑衣少年执发光长刀立于城市高楼,红黑色调,2D赛璐璐" + POSTER, V),
    "poster_an_daoni":           ("修仙国漫竖版海报,青衫少年御剑穿越云海雷劫,水墨与光效结合,气势磅礴" + POSTER, V),
    "poster_an_qianfangjiemanju": ("古风动态漫画竖版海报,花瓣飞舞中的古装少女持团扇,国风工笔画质感,红金色" + POSTER, V),
    "poster_an_tunxingjiyuan":   ("科幻国漫竖版海报,武者拳劲撼动星舰残骸,宇宙星云背景,深蓝橙对比,3D渲染" + POSTER, V),
    "poster_an_yinshizhixia6":   ("异能国漫竖版海报,少年立于山门石碑前,符文金光缠绕,水墨玄幻风" + POSTER, V),
    "poster_an_zhiyedianfeng3":  ("电竞国漫竖版海报,战队选手背影面向巨型赛场屏幕,荣耀金蓝光效" + POSTER, V),
    "poster_an_hulingxiaohongxian": ("古风恋爱动画竖版海报,狐耳少女指尖缠绕红线,樱粉色唯美画面,2D插画" + POSTER, V),
    "poster_an_kuaidaoxiaoqi":   ("动作搞笑动画竖版海报,理发师少年反手持剪刀摆出侠客姿势,扁平插画风,蓝橙撞色" + POSTER, V),
    "poster_an_zhoulinghuilang": ("日式热血动画竖版海报,校服少年被紫色咒力缠绕,暗色回廊背景,凌厉分镜感" + POSTER, V),
    # ---- 少儿竖版海报 ----
    "poster_kd_lemiemie":        ("低幼动画竖版海报,草原上的卡通小羊群欢乐奔跑,明亮绿色,圆润可爱风" + POSTER, V),
    "poster_kd_xiaozhupike":     ("低幼动画竖版海报,粉色卡通小猪一家在泥坑边玩耍,简笔画风,天蓝背景" + POSTER, V),
    "poster_kd_wawabashi":       ("儿童启蒙动画竖版海报,彩色卡通巴士与小动物乘客,糖果色,扁平可爱" + POSTER, V),
    "poster_kd_jimuhuanying":    ("积木忍者动画竖版海报,六个彩色积木小忍者摆出战斗姿势,玩具质感渲染" + POSTER, V),
    "poster_kd_lingtongnaohai":  ("国风神话儿童动画竖版海报,脚踏风火轮的卡通小娃娃在海浪上,国潮红蓝配色" + POSTER, V),
    "poster_kd_haidouqi":        ("儿童益智动画竖版海报,大黄狗与小男孩在花园草地上,清新水彩风" + POSTER, V),
    "poster_kd_baoxiaodoudou":   ("搞笑儿童动画竖版海报,两条圆滚滚的卡通小虫子做鬼脸,亮黄红配色,无厘头" + POSTER, V),
    "poster_kd_datangshaonianyou": ("国风少年动画竖版海报,背剑少年立于唐代长安城楼前,大气国潮插画,青绿山水" + POSTER, V),
    # ---- 纪录片竖版海报 ----
    "poster_dc_lansemijing":     ("海洋自然纪录片竖版海报,深海鲸群与透射光柱,深邃蓝色,震撼摄影" + POSTER, V),
    "poster_dc_fengweishanhe":   ("美食人文纪录片竖版海报,热气腾腾的一碗面与远山炊烟,暖黄色调,烟火气摄影" + POSTER, V),
    "poster_dc_jidishengling":   ("极地动物纪录片竖版海报,冰原上的帝企鹅群与极光,冷蓝紫色,自然摄影" + POSTER, V),
    "poster_dc_chengshimaidong": ("城市人文纪录片竖版海报,凌晨批发市场灯火与忙碌人影,纪实摄影,青橙色调" + POSTER, V),
    "poster_dc_guyaochongguang": ("文博历史纪录片竖版海报,窑炉火光中的天青釉瓷盏特写,深棕金色调,匠心质感" + POSTER, V),
    "poster_dc_changchengneiwai": ("历史地理纪录片竖版海报,金秋群山间蜿蜒的长城航拍,恢弘大气" + POSTER, V),
    # ---- 短剧竖版海报 ----
    "poster_sd_weiguangzhishang": ("都市逆袭短剧竖版海报,写字楼夜景前的职业装年轻女性侧影,屏幕蓝光映脸,励志感" + POSTER, V),
    "poster_sd_tianque":         ("古装复仇短剧竖版海报,宫阙飞雪中凤袍女子拾级而上背影,红白强对比" + POSTER, V),
    "poster_sd_huanggui":        ("虐渣复仇短剧竖版海报,凤凰纹样火焰中的红衣女子回眸,暗金红色调,气场强" + POSTER, V),
    "poster_sd_shanhuntianchong": ("都市甜宠短剧竖版海报,西装男士为连衣裙女孩戴戒指特写,粉金浪漫色调" + POSTER, V),
    "poster_sd_majiacangbuzhu":  ("都市奇幻短剧竖版海报,多重剪影身份叠影的时尚女性,紫金霓虹色,炫酷" + POSTER, V),
    "poster_sd_zhaixingji":      ("古装励志短剧竖版海报,织机前的古装少女与漫天星纱,青金织锦质感" + POSTER, V),
    "poster_sd_qianjinfanpan":   ("都市逆袭短剧竖版海报,宴会厅水晶灯下自信起身的年轻女性,香槟金色调" + POSTER, V),
    # ---- 短番竖版海报 ----
    "poster_sa_lingkui":         ("奇幻漫剧竖版海报,月光窗边睁眼的精致木偶人与少女剪影,蓝紫梦幻,2D插画" + POSTER, V),
    "poster_sa_xiuluojianzun":   ("玄幻漫剧竖版海报,血色残阳下负剑修罗立于剑冢,暗红黑色调,动态漫画风" + POSTER, V),
    "poster_sa_dandaozhizun":    ("修仙漫剧竖版海报,丹炉青焰与盘坐炼丹的少年,青金火光,动态漫画风" + POSTER, V),
    "poster_sa_dushiyixian":     ("都市漫剧竖版海报,白衣青年指间银针闪光,都市夜景背景,动态漫画风" + POSTER, V),
    "poster_sa_zhuixuguilai":    ("都市漫剧竖版海报,西装男子背后浮现战甲虚影,金色光效,动态漫画风" + POSTER, V),
    "poster_sa_xingwujiyuan":    ("科幻漫剧竖版海报,少年掌心悬浮吞噬光芒的黑色星球,星空紫黑色调,动态漫画风" + POSTER, V),
    # ---- 16:9 横版剧照(热门内容,播放器/banner用) ----
    "still_tv_qianfangjie":      ("古装权谋剧横版剧照,宫殿大殿百花宴场景,烛火与花瓣,人物群像虚化" + STILL, H),
    "still_tv_zheyikexindong":   ("都市剧横版剧照,夜晚城市天台两人相对而立远景,城市灯海背景" + STILL, H),
    "still_tv_hushanghuakai":    ("年代剧横版剧照,九十年代上海霓虹街道雨夜,行人撑伞,胶片质感" + STILL, H),
    "still_tv_jifengxingdong":   ("刑侦剧横版剧照,雨夜码头警灯闪烁,持枪对峙剪影,电影级冷色" + STILL, H),
    "still_tv_qichongjin":       ("古装剧横版剧照,深宅庭院晨雾,锦衣人物远景,绛红灯笼" + STILL, H),
    "still_mv_daomengtuan3":     ("魔术悬疑电影横版剧照,剧院舞台悬浮扑克牌阵,蓝紫追光" + STILL, H),
    "still_mv_jixianzhiwai":     ("硬科幻电影横版剧照,太空缆索上宇航员攀爬远景,地球与日出弧光" + STILL, H),
    "still_vs_chongyaba10":      ("户外竞技综艺横版剧照,泥潭障碍赛全景,泥点飞溅瞬间,活力十足" + STILL, H),
    "still_an_douxuandalu2":     ("玄幻动画横版剧照,神界大门前的能量对轰战斗场面,金蓝特效,3D渲染" + STILL, H),
    "still_sd_weiguangzhishang": ("都市短剧横版剧照,深夜办公室多屏数据前的女性侧影,屏幕蓝光" + STILL, H),
    # ---- 用户头像 ----
    "avatar_me":       ("极简渐变青绿色应用头像,中心白色抽象字母形状,扁平设计" + AVATAR, S),
    "avatar_u01":      ("戴圆框眼镜的年轻女性卡通头像,橘色马尾,扁平插画风" + AVATAR, S),
    "avatar_u02":      ("晚霞天空与人物剪影的文艺风头像,粉紫渐变" + AVATAR, S),
    "avatar_u03":      ("戴棒球帽的年轻男性卡通头像,蓝色系,扁平插画风" + AVATAR, S),
    "avatar_u04":      ("奶油蛋糕拟人卡通头像,奶黄色系,可爱风" + AVATAR, S),
    "avatar_u05":      ("抱着抱枕看电视的猫咪卡通头像,灰蓝色系,扁平插画" + AVATAR, S),
    "avatar_u06":      ("雨窗与书本的文艺插画头像,墨蓝色调" + AVATAR, S),
    "avatar_u07":      ("一杯芝士拿铁咖啡插画头像,奶咖色系,清新风" + AVATAR, S),
    "avatar_u08":      ("粉色软糖拟人卡通头像,圆润可爱,糖果色" + AVATAR, S),
    "avatar_u09":      ("雾中远山水墨风头像,灰青色调,意境" + AVATAR, S),
    "avatar_u10":      ("躺在云朵上的小人插画头像,天蓝色,治愈慵懒风" + AVATAR, S),
    "avatar_u11":      ("柠檬与海风插画头像,柠檬黄青色,清新夏日风" + AVATAR, S),
    "avatar_u12":      ("戴潜水镜的摸鱼卡通头像,一条小鱼,蓝绿色,幽默风" + AVATAR, S),
    "avatar_sys":      ("蓝色渐变系统通知图标头像,中心白色铃铛图形,扁平设计" + AVATAR, S),
    "avatar_vip":      ("金色渐变会员服务头像,中心白色皇冠图形,扁平设计" + AVATAR, S),
    "avatar_reserve":  ("青绿色渐变提醒助手头像,中心白色日历时钟图形,扁平设计" + AVATAR, S),
    # ---- 演员照 ----
    "actor_shenzhiyue": ("年轻女演员艺术写真头像,黑长直发浅笑,杂志质感打光,米白背景,写实摄影,虚构人物" + AVATAR, S),
    # ---- IP周边商品图 ----
    "goods_cardpack":  ("古风花卉纹样收藏卡包与烫金卡片" + PRODUCT, S),
    "goods_blindbox":  ("玄幻动画风格盲盒包装盒,金蓝配色炫酷图案" + PRODUCT, S),
    "goods_figure":    ("职业装年轻女性角色手办模型,底座展示" + PRODUCT, S),
    "goods_acrylic":   ("情侣剪影亚克力立牌,透明质感,粉金配色" + PRODUCT, S),
    "goods_badge":     ("一套六枚圆形金属徽章,不同配色图案,收藏级" + PRODUCT, S),
    "goods_plush":     ("木偶人造型毛绒挂件玩偶,蓝紫配色,可爱" + PRODUCT, S),
    # ---- 频道 banner ----
    "banner_home":     ("脱口秀舞台横幅,深红幕布与金色聚光灯下的立麦" + BANNER, H),
    "banner_tv":       ("年度热门剧盛典横幅,深色底金色光束与胶片元素,颁奖礼质感" + BANNER, H),
    "banner_movie":    ("港风警匪电影专场横幅,霓虹雨夜街头双雄剪影,青橙色调" + BANNER, H),
    "banner_variety":  ("户外竞技综艺横幅,泥潭赛场与彩色旗帜,活力撞色" + BANNER, H),
    "banner_anime":    ("玄幻动画横幅,能量光效中的战斗剪影,金蓝色炫酷" + BANNER, H),
    "banner_kids":     ("国风少年动画横幅,长安城楼与背剑少年,青绿山水国潮" + BANNER, H),
    "banner_haopian":  ("深色科幻策展横幅,太空缆索与地球弧光,深空蓝黑,神秘高级" + BANNER, H),
    "banner_shop":     ("IP周边商城横幅,盲盒手办徽章陈列,明亮电商风,浅色背景" + BANNER, H),
    "banner_game":     ("游戏送福利运营横幅,史诗神兵宝剑与光效宝箱,暗金游戏风" + BANNER, H),
}


def gen(img_id, prompt, size):
    out = IMG_DIR / f"{img_id}.png"
    if out.exists() and out.stat().st_size > 0:
        return (img_id, "skip")
    out.parent.mkdir(parents=True, exist_ok=True)
    full_prompt = prompt if prompt.endswith(NO_TEXT) else prompt + NO_TEXT
    for attempt in range(3):
        try:
            payload = {"model": MODEL, "prompt": full_prompt, "size": size, "n": 1}
            quality = os.environ.get("IMAGE_GEN_QUALITY")
            if quality:
                payload["quality"] = quality
            status, body = _post_json(URL, payload, {"Authorization": f"Bearer {KEY}"})
            if status != 200:
                if attempt == 2:
                    return (img_id, f"HTTP {status}: {body[:120]}")
                time.sleep(3); continue
            items = json.loads(body).get("data", [])
            if items and items[0].get("b64_json"):
                out.write_bytes(base64.b64decode(items[0]["b64_json"]))
                return (img_id, f"ok {out.stat().st_size}B")
            if items and items[0].get("url"):
                out.write_bytes(_get_bytes(items[0]["url"]))
                return (img_id, f"ok(url) {out.stat().st_size}B")
            return (img_id, "no image in response")
        except Exception as e:
            if attempt == 2:
                return (img_id, f"EXC {e}")
            time.sleep(3)
    return (img_id, "failed")


def main():
    print(f"api={URL} model={MODEL} | {len(ASSETS)} assets -> {IMG_DIR}", flush=True)
    ok = skip = fail = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen, img_id, p, size): img_id for img_id, (p, size) in ASSETS.items()}
        for f in as_completed(futs):
            img_id, status = f.result()
            print(f"  {img_id}: {status}", flush=True)
            if status.startswith("ok"): ok += 1
            elif status == "skip": skip += 1
            else: fail += 1
    print(f"done: ok={ok} skip={skip} fail={fail}", flush=True)
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
