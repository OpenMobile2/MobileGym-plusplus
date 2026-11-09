#!/usr/bin/env python3
"""把拼多多复刻 App 的商品/店铺/评价导入唯品会,用于丰富商品库。

规则(可调):
  - 排除品类:百货(低价日用杂货)、玩乐(盲盒潮玩),与唯品会「品牌特卖」定位不搭
  - 排除单价 < ¥29(唯品会现有最低 ¥39,更低的会拉低品牌调性)
  - 出行:拉杆箱/背包 → 箱包,其余(水杯/雨伞) → 居家
  - 图片跨 App 引用 /@app-assets/Pinduoduo/...,不拷贝文件
  - tags 从标题提取属性词(唯品会的 tags 是属性,不是促销徽章)
"""
import json, re, sys
from collections import Counter, defaultdict

PDD = 'apps/Pinduoduo/data/catalog.json'
VIP = 'apps/Vipshop/data/defaults.json'

EXCLUDE_CATS = {'百货', '玩乐'}
PRICE_FLOOR = 29

CAT_MAP = {
    '女装': 'women', '男装': 'men', '美妆': 'beauty', '个护': 'beauty',
    '家居': 'home', '家电': 'appliance', '数码': 'digital',
    '运动': 'sport', '母婴': 'baby', '食品': 'food',
}
LUGGAGE_RE = re.compile(r'拉杆箱|行李箱|旅行箱|双肩|背包|手提包|单肩')
# 拼多多归在「运动」里的鞋,其实是唯品会的「鞋靴」品类(该品类此前无法从拼多多补充)
SHOES_RE = re.compile(r'运动鞋|跑步鞋|跑鞋|板鞋|帆布鞋|凉鞋|靴')

# (正则, 二级分类);按顺序匹配,先中先得
SUB_RULES = {
    'women': [(r'连衣裙|长裙', '连衣裙'), (r'半身裙|百褶裙', '半身裙'), (r'衬衫|衬衣', '衬衫'),
              (r'背心|吊带|内搭', '背心'),
              (r'T恤|t恤|POLO|polo', 'T恤'), (r'风衣|夹克|外套|西装|开衫', '外套'),
              (r'阔腿裤|休闲裤|长裤|牛仔裤|西裤', '阔腿裤')],
    'men': [(r'短裤', '短裤'), (r'衬衫|衬衣', '衬衫'),
            (r'T恤|t恤|POLO|polo|半袖|华夫格', 'T恤'),
            (r'风衣|夹克|外套|冲锋衣|西装', '外套'),
            (r'休闲裤|长裤|牛仔裤|西裤|工装裤|直筒裤', '休闲裤')],
    'shoes': [(r'运动鞋|跑步鞋|跑鞋', '运动鞋'), (r'凉鞋', '凉鞋'), (r'靴', '靴子'),
              (r'板鞋|帆布鞋|单鞋', '单鞋')],
    'beauty': [(r'口红|唇釉|唇膏', '口红'), (r'面膜', '面膜'), (r'精华', '精华'),
               (r'面霜|乳液|眼霜', '面霜'), (r'眼影|眉笔|睫毛', '眼影'), (r'防晒', '防晒'),
               (r'香水', '香水'), (r'洁面|洗面奶|卸妆', '洁面'),
               (r'粉底|遮瑕|气垫|散粉|腮红|美妆蛋|化妆刷', '彩妆'), (r'洗发|护发|沐浴|香皂', '洗护'),
               (r'剃须|牙刷|牙膏|漱口', '个人护理'), (r'护手霜|身体乳|润肤', '身体护理')],
    'home': [(r'四件套|床单|被套|枕|凉席|毛毯', '床品'), (r'锅|碗|碟|餐具|刀具|砧板|厨房', '厨具'),
             (r'毛巾|浴巾', '毛巾浴巾'), (r'保温杯|水杯|保温壶|杯子', '保温杯'),
             (r'收纳|置物架|储物|衣架', '收纳'), (r'台灯|灯具|落地灯|夜灯', '灯具'),
             (r'相框|摆件|装饰|挂画|花瓶|香薰|蜡烛', '装饰'), (r'雨伞|折叠伞|太阳伞', '雨具'),
             (r'折叠椅|露营|户外.*椅|野餐', '户外'), (r'车载|车用|出风口', '车品')],
    'appliance': [(r'破壁机|榨汁|电饭|电压力|空气炸|烤箱|咖啡机|电磁炉|电热水壶|养生壶', '厨房电器'),
                  (r'吹风|剃须刀|美容仪|洁面仪|electric|卷发|直发', '个护电器'),
                  (r'挂烫|吸尘|加湿|净化|风扇|循环扇|电扇|取暖|除湿|扫地', '生活电器')],
    'digital': [(r'耳机', '耳机'), (r'手表|手环', '手表'),
                (r'充电器|数据线|移动电源|充电宝|快充', '充电周边'),
                (r'音箱|音响|投影|稳定器|云台|相机', '影音'),
                (r'键盘|鼠标|显示器|U盘|硬盘', '电脑外设')],
    'sport': [(r'运动裤|健身裤', '运动裤'), (r'瑜伽服|瑜伽裤', '瑜伽服'),
              (r'运动上衣|速干衣|运动T恤|背心|运动套装|健身套装', '运动上衣'),
              (r'腰包|水壶|护具|跳绳|瑜伽垫|哑铃|弹力带|健腹', '运动配件')],
    'baby': [(r'连体衣|哈衣|爬服', '连体衣'), (r'童装|儿童服|宝宝服|童鞋|婴儿服', '童装'),
             (r'玩具|平衡车|滑步车|积木|拼图|摇铃', '玩具'),
             (r'辅食|奶瓶|餐具|软勺|水杯|吸管杯', '喂养'), (r'纸尿裤|湿巾|洗护|沐浴', '婴儿洗护')],
    'food': [(r'零食|面包|饼干|薯片|辣条|肉脯', '零食'),
             (r'咖啡|茶|牛奶|冲饮|奶粉|果汁|酸奶|发酵乳', '冲饮'),
             (r'坚果|红枣|干果|瓜子|核桃', '坚果'), (r'滋补|燕窝|参|阿胶|蜂蜜', '滋补'),
             (r'水果|沃柑|车厘子|橙|苹果', '生鲜'), (r'自热|速食|火锅|方便', '速食')],
    'bag': [(r'拉杆箱|行李箱|旅行箱', '拉杆箱'), (r'双肩|背包', '双肩包'),
            (r'手提包|托特', '手提包'), (r'单肩|斜挎', '单肩包'), (r'钱包|卡包', '钱包')],
}

# 从标题提取属性词(和唯品会现有 tags 同风格:材质/版型/颜色)
ATTR_WORDS = [
    '冰丝', '速干', '纯棉', '真皮', '雪纺', '牛仔', '亚麻', '莱赛尔', '珊瑚绒', '法兰绒',
    '宽松', '修身', '显瘦', '高腰', '垂感', '百褶', 'A字', '直筒', '阔腿', '加厚', '轻薄',
    '防滑', '防水', '透气', '静音', '便携', '可折叠', '大容量', '多功能', '无线', '快充',
    '保温', '免打孔', '负离子', '大功率', '温和', '滋润', '持久', '控油', '补水', '遮瑕',
    '白色', '黑色', '米白', '卡其', '藕粉', '灰色', 'banana',
]
STYLE_SUFFIX = ['基础款', '升级款', '爆款', '限量款', '旗舰款', '轻奢款', '加厚款', '新款',
                '2026款', '百亿补贴款', '经典款']


# 与 apps/Vipshop/constants.ts 的 REVIEW_TAGS_BY_CATEGORY 保持一致(首项恒为「买家秀」)
REVIEW_TAGS = {
    'women': ['买家秀', '尺码偏大', '尺码偏小', '版型好评'],
    'men': ['买家秀', '尺码偏大', '尺码偏小', '版型好评'],
    'shoes': ['买家秀', '尺码偏大', '尺码偏小', '穿着舒适'],
    'underwear': ['买家秀', '尺码偏大', '尺码偏小', '面料舒适'],
    'baby': ['买家秀', '尺码偏大', '尺码偏小', '面料舒适'],
    'sport': ['买家秀', '尺码偏大', '尺码偏小', '透气排汗'],
    'beauty': ['买家秀', '效果不错', '气味好闻', '包装完好'],
    'food': ['买家秀', '味道不错', '分量很足', '包装完好'],
    'appliance': ['买家秀', '做工扎实', '性能满意', '静音省电'],
    'digital': ['买家秀', '做工扎实', '性能满意', '续航持久'],
    'home': ['买家秀', '材质不错', '做工扎实', '实用方便'],
    'bag': ['买家秀', '材质不错', '容量合适', '做工扎实'],
}


def to_wan(sold: str) -> str:
    """已拼8.5万件 → 8.5万人购买"""
    m = re.search(r'([\d.]+)\s*(万|千)?', sold or '')
    if not m:
        return '1000+人购买'
    return f"{m.group(1)}{m.group(2) or ''}人购买"


def pick_sub(vip_cat: str, title: str) -> str | None:
    for pat, sub in SUB_RULES.get(vip_cat, []):
        if re.search(pat, title):
            return sub
    return None


def pick_tags(title: str) -> list[str]:
    tags = [w for w in ATTR_WORDS if w in title][:2]
    if not tags:
        for s in STYLE_SUFFIX:
            if title.endswith(s):
                tags = [s]
                break
    return tags or ['精选']


def main(apply: bool):
    pdd = json.load(open(PDD, encoding='utf-8'))
    vip = json.load(open(VIP, encoding='utf-8'))
    pdd_reviews = defaultdict(list)
    for r in pdd['reviews']:
        pdd_reviews[r['itemId']].append(r)

    kept, unmatched = [], Counter()
    for it in pdd['items']:
        cat = it['category']
        if cat in EXCLUDE_CATS or it['pinPrice'] < PRICE_FLOOR:
            continue
        if SHOES_RE.search(it['title']):
            vip_cat = 'shoes'
        elif cat == '出行':
            vip_cat = 'bag' if LUGGAGE_RE.search(it['title']) else 'home'
        else:
            vip_cat = CAT_MAP.get(cat)
        if not vip_cat:
            continue
        sub = pick_sub(vip_cat, it['title'])
        if not sub:
            unmatched[f'{vip_cat}｜{it["title"]}'] += 1
            continue
        kept.append((it, vip_cat, sub))

    print(f'=== 可导入 {len(kept)} 件;二级分类未匹配 {sum(unmatched.values())} 件 ===\n')
    print('按唯品会品类:')
    for k, n in Counter(c for _, c, _ in kept).most_common():
        print(f'   {k:10s} {n}')
    print('\n新增的二级分类(唯品会 CATEGORY_TAXONOMY 里还没有的):')
    EXIST = {
        'women': ['连衣裙', 'T恤', '衬衫', '外套', '半身裙', '阔腿裤'],
        'men': ['短裤', '休闲裤', 'T恤', '衬衫', '外套'],
        'beauty': ['口红', '面膜', '精华', '面霜', '眼影', '防晒', '香水'],
        'shoes': ['运动鞋', '凉鞋', '单鞋', '靴子'],
        'bag': ['手提包', '双肩包', '单肩包', '钱包'],
        'home': ['床品', '厨具', '毛巾浴巾', '保温杯', '收纳'],
        'appliance': ['厨房电器', '个护电器', '生活电器'],
        'digital': ['耳机', '手表', '充电周边', '影音'],
        'sport': ['运动裤', '运动上衣', '瑜伽服'],
        'baby': ['连体衣', '童装', '玩具'],
        'underwear': ['文胸', '内裤', '家居服', '袜子'],
        'food': ['零食', '冲饮', '坚果', '滋补'],
    }
    newsubs = defaultdict(set)
    for _, c, s in kept:
        if s not in EXIST.get(c, []):
            newsubs[c].add(s)
    for c, ss in sorted(newsubs.items()):
        print(f'   {c:10s} {", ".join(sorted(ss))}')
    if unmatched:
        print(f'\n未匹配样例(前 12,这些会被丢弃):')
        for t, _ in list(unmatched.items())[:12]:
            print(f'   {t}')

    if not apply:
        print('\n(试算模式;加 --apply 写入)')
        return

    # ---------- 组装唯品会数据 ----------
    exist_ids = {i['id'] for i in vip['items']}

    # 现有品牌按主类目分组;导入商品按品类轮流分配给同类现有品牌
    # (拼多多标题首词是通用店铺前缀,跨品类,不适合当垂直品牌;
    #  唯品会 26 个现有品牌已覆盖全部 12 品类,直接扩充它们更贴合真机语义)
    brands_by_cat = defaultdict(list)
    for b in vip['brands']:
        brands_by_cat[b['category']].append(b)
    brand_map = {b['id']: b for b in vip['brands']}
    rr = defaultdict(int)  # 每个品类的轮询游标

    new_items, new_reviews = [], []
    touched_brands = set()
    for it, vip_cat, sub in kept:
        pool = brands_by_cat.get(vip_cat)
        if not pool:
            continue  # 现有品牌没覆盖到的品类(实际不会发生)
        brand = pool[rr[vip_cat] % len(pool)]
        rr[vip_cat] += 1
        touched_brands.add(brand['id'])

        nid = f'p_{it["id"]}'
        assert nid not in exist_ids, nid
        price = round(it['pinPrice'])
        origin = round(it['originPrice'])
        ratio = price / origin if origin else 1
        new_items.append({
            'id': nid,
            'title': ' '.join(it['title'].split()[1:]) or it['title'],
            'brandId': brand['id'],
            'brandName': brand['name'],
            'category': vip_cat,
            'subCategory': sub,
            # 图片跨 App 引用拼多多资产,不拷贝文件
            'image': it['image'],
            'gallery': it['gallery'],
            'detailImages': it['detailImages'],
            'price': price,
            'originPrice': origin,
            'discountText': f'{ratio * 10:.1f}折',
            'sold': to_wan(it['sold']),
            'tags': pick_tags(it['title']),
            'specs': it['specs'],
            'reviewCount': it['reviewCount'],
            'goodRate': f'{95 + (it["reviewCount"] % 5)}%',
            'reviewTags': REVIEW_TAGS[vip_cat][1:],
        })
        brand['itemIds'].append(nid)
        for r in pdd_reviews.get(it['id'], []):
            new_reviews.append({
                'id': f'p_{r["id"]}',
                'itemId': nid,
                'userNick': r['user'],
                'userAvatar': r.get('avatar', ''),
                'skuDesc': (it['specs'][0]['options'][0] if it['specs'] else '默认'),
                'content': r['content'],
                'images': r.get('images', []),
                'tag': REVIEW_TAGS[vip_cat][0] if r.get('images') else REVIEW_TAGS[vip_cat][1],
                'rating': r.get('rating', 5),
            })

    vip['items'].extend(new_items)
    vip['reviews'].extend(new_reviews)
    json.dump(vip, open(VIP, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'\n✅ 已写入 {VIP}(归入现有品牌,不新建)')
    print(f'   商品 {len(new_items)} 件 → 合计 {len(vip["items"])}')
    print(f'   评价 {len(new_reviews)} 条 → 合计 {len(vip["reviews"])}')
    print(f'   扩充了 {len(touched_brands)} 个现有品牌的专场')
    print('   各品牌专场商品数:')
    for b in vip['brands']:
        print(f'      {b["name"]:8s}({b["category"]:9s}) {len(b["itemIds"]):>3d} 件')


if __name__ == '__main__':
    main('--apply' in sys.argv)
