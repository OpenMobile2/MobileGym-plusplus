# -*- coding: utf-8 -*-
"""
看病买药频道数据生成(附加式,不改动既有 shops/items)。
- 生成 6 家药店(id 前缀 p_)为 retail/pharmacy 店铺,复用 RetailShopPage 购买流程。
- 生成药品目录:同一药品(drugKey)在多家药店在售 → 支持"按分类看跨店在售"。
- 幂等:每次先清掉 id 前缀 p_ 的店铺与其商品,再重建;不动 s_* 既有数据。
- 同步把药品/药店 logo 生图 prompt 合并进 asset_prompts.json(供 gen_images.py 批量生成)。
运行: python apps/TaobaoShangou/assets/gen_medicine.py
"""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).parent
APP = HERE.parent
DEFAULTS = APP / "data" / "defaults.json"
PROMPTS = HERE / "asset_prompts.json"

# ---------------- 药店 ----------------
PHARMACIES = [
    ("p_haiwang", "海王星辰健康优选店", "学森路店", "#2E90C4", 4.9, "2000+", 22, 2.6, 3.0, 6.0, 20),
    ("p_gaoji", "高济再康药房", "湖城艺境店", "#D6413B", 4.8, "5000+", 24, 2.8, 4.0, 8.0, 20),
    ("p_dashenlin", "大参林大药房", "茂民路店", "#159A5A", 4.9, "3000+", 25, 3.1, 3.0, 7.0, 20),
    ("p_laobaixing", "老百姓大药房", "东城汇店", "#E8602C", 4.7, "1000+", 28, 3.4, 5.0, 9.0, 20),
    ("p_dingdang", "叮当快药", "24h仙林店", "#1F6FE0", 4.8, "800+", 18, 1.8, 0.0, 5.0, 0),
    ("p_quanxin", "全心大药房", "万达茂店", "#7A57C9", 4.6, "600+", 30, 3.8, 4.0, 8.0, 20),
]

# ---------------- 药品目录 ----------------
# (drugKey, 名称, 品牌, 规格, [功能主治], 处方药?, 基准价, 图片类型)
CATS = [
    ("感冒发烧", "#F4685F", {
        "感冒药": [
            ("taino", "酚麻美敏片", "泰诺", "12片/盒", ["感冒", "发热", "鼻塞"], False, 22.6, "box_blue"),
            ("ganmaoling", "感冒灵颗粒", "999", "10袋/盒", ["感冒", "头痛", "发热"], False, 15.8, "sachet"),
            ("lianhua", "连花清瘟胶囊", "以岭", "24粒/盒", ["清瘟", "解毒", "咳嗽"], False, 18.5, "box_green"),
        ],
        "发烧头痛": [
            ("buluofen", "布洛芬缓释胶囊", "芬必得", "0.3g*20粒/盒", ["退烧", "止痛", "关节痛"], False, 24.28, "box_red"),
            ("duiyi", "对乙酰氨基酚片", "必理通", "0.5g*20片/盒", ["退烧", "头痛", "牙痛"], False, 12.5, "box_blue"),
        ],
        "咽痛咽痒": [
            ("jinsangzi", "金嗓子喉片", "金嗓子", "2g*12片/盒", ["清咽", "利喉", "咽炎"], False, 12.7, "box_green"),
            ("xiguashuang", "桂林西瓜霜", "三金", "3g/瓶", ["清热", "咽炎", "口腔溃疡"], False, 14.08, "bottle_spray"),
        ],
        "止咳化痰": [
            ("nianciyan", "川贝枇杷膏", "念慈庵", "150ml/瓶", ["润肺", "止咳", "化痰"], False, 29.9, "bottle_syrup"),
            ("gancao", "复方甘草片", "华润", "100片/瓶", ["镇咳", "祛痰"], False, 9.9, "bottle_pills"),
        ],
    }),
    ("儿科用药", "#4FA9E8", {
        "小儿感冒": [
            ("xiaokuihua", "小儿肺热咳喘口服液", "小葵花", "10ml*6支/盒", ["咳嗽", "支气管炎", "感冒"], False, 44.5, "box_blue"),
            ("jinzhen", "金振口服液", "康缘", "10ml*10支/盒", ["祛痰", "止咳", "支气管炎"], False, 54.3, "box_red"),
        ],
        "腹泻呕吐": [
            ("mengtuoshi", "蒙脱石散", "思密达", "3g*10袋/盒", ["腹泻", "止泻", "儿童"], False, 19.8, "sachet"),
            ("buye", "口服补液盐散", "博叶", "5袋/盒", ["补液", "电解质", "腹泻"], False, 19.9, "sachet"),
        ],
        "蚊虫叮咬": [
            ("fengyoujing", "风油精", "水仙", "9ml/盒", ["清凉", "止痛", "蚊虫叮咬"], False, 5.09, "box_green"),
        ],
    }),
    ("皮肤用药", "#7BC96F", {
        "皮炎湿疹": [
            ("piyanping", "糠酸莫米松乳膏", "皮炎平", "10g/支", ["湿疹", "神经性皮炎", "止痒"], False, 27.34, "tube"),
            ("ailuosong", "丁酸氢化可的松乳膏", "艾洛松", "10g/盒", ["湿疹", "皮炎", "过敏"], False, 23.48, "tube"),
        ],
        "皮肤过敏": [
            ("kairuitan", "氯雷他定片", "开瑞坦", "10mg*6片/盒", ["过敏", "鼻炎", "荨麻疹"], False, 23.8, "box_blue"),
            ("ximin", "西替利嗪片", "仙特明", "10片/盒", ["过敏", "止痒", "鼻炎"], False, 19.9, "box_green"),
        ],
        "皮肤外伤": [
            ("chuangketie", "云南白药创可贴", "云南白药", "20片/盒", ["止血", "镇痛", "消炎"], False, 3.6, "box_red"),
            ("hongmeisu", "红霉素软膏", "仁和", "1%*15g/支", ["消炎", "抗感染", "外伤"], False, 4.5, "tube"),
        ],
    }),
    ("肠胃消化", "#F5C34E", {
        "胃痛胃胀": [
            ("daxi", "铝碳酸镁咀嚼片", "达喜", "20片/盒", ["胃酸", "胃痛", "烧心"], False, 21.5, "box_blue"),
            ("madingling", "多潘立酮片", "吗丁啉", "10mg*30片/盒", ["胃胀", "消化不良", "恶心"], False, 29.8, "box_green"),
        ],
        "腹泻便秘": [
            ("huanglian", "盐酸小檗碱片", "太极", "24片/盒", ["腹泻", "肠炎", "止泻"], False, 8.8, "bottle_pills"),
            ("kaiseluo", "开塞露", "信龙", "20ml*10支/盒", ["便秘", "润肠通便"], False, 12.9, "box_blue"),
        ],
        "健胃消食": [
            ("xiaoshi", "健胃消食片", "江中", "0.8g*32片/盒", ["消食", "健胃", "积食"], False, 13.8, "box_red"),
        ],
    }),
    ("维生素滋补", "#EA9E4C", {
        "维生素": [
            ("weic", "维生素C含片", "养生堂", "60片/瓶", ["免疫", "补充维C"], False, 39.9, "bottle_pills"),
            ("weib", "复合维生素B片", "善存", "100片/瓶", ["维B", "营养补充"], False, 29.9, "bottle_pills"),
        ],
        "钙铁锌": [
            ("gaipian", "碳酸钙D3片", "钙尔奇", "60片/瓶", ["补钙", "骨骼", "中老年"], False, 45.8, "bottle_pills"),
            ("buti", "蛋白琥珀酸铁口服液", "菲普利", "10支/盒", ["补铁", "气血"], False, 52.0, "box_red"),
        ],
        "眼部营养": [
            ("bolisuan", "玻璃酸钠滴眼液", "海露", "10ml/支", ["干眼", "缓解眼疲劳"], False, 63.3, "bottle_drop"),
            ("yehuangsu", "叶黄素酯片", "汤臣倍健", "30片/瓶", ["护眼", "叶黄素", "视力"], False, 58.0, "bottle_pills"),
        ],
    }),
    ("五官用药", "#57B98A", {
        "鼻炎鼻塞": [
            ("budinaide", "布地奈德鼻喷雾剂", "雷诺考特", "120喷/瓶", ["鼻炎", "过敏", "鼻塞"], True, 49.0, "bottle_spray"),
            ("nosqing", "生理性海水鼻腔喷雾", "诺斯清", "70ml/瓶", ["鼻塞", "清洗", "儿童"], False, 35.0, "bottle_spray"),
        ],
        "口腔咽喉": [
            ("kuiyangsan", "口腔溃疡散", "桂林", "3g/瓶", ["溃疡", "口疮", "消炎"], False, 16.5, "bottle_spray"),
            ("liyan", "玄麦甘桔含片", "葵花", "12片/盒", ["清咽", "润喉"], False, 11.0, "box_green"),
        ],
    }),
    ("医疗器械", "#6C8CD5", {
        "体温测量": [
            ("tiwenji", "电子体温计", "鱼跃", "1支", ["测温", "家用"], False, 19.9, "device"),
            ("etiwen", "红外额温枪", "鱼跃", "1台", ["测温", "非接触"], False, 59.0, "device"),
        ],
        "检测防护": [
            ("kangyuan", "新冠抗原检测试剂盒", "乐普", "5人份/盒", ["检测", "自测"], False, 29.9, "box_blue"),
            ("kouzhao", "医用外科口罩", "振德", "50只/盒", ["防护", "一次性"], False, 19.9, "box_blue"),
        ],
        "血压血糖": [
            ("xueyaji", "电子血压计", "欧姆龙", "1台", ["血压", "家用测量"], False, 199.0, "device"),
        ],
    }),
]

IMG_PROMPT = {
    "box_blue": "一盒蓝白配色的西药OTC药品纸盒,药品包装产品摄影,正面平铺,纯白背景,简洁清晰,高清,无品牌logo无水印",
    "box_green": "一盒绿白配色的中成药药品纸盒,药品包装产品摄影,正面平铺,纯白背景,简洁清晰,高清,无品牌logo无水印",
    "box_red": "一盒红白配色的西药OTC药品纸盒,药品包装产品摄影,正面平铺,纯白背景,简洁清晰,高清,无品牌logo无水印",
    "sachet": "一盒颗粒剂药品,内含独立小袋装,药品包装产品摄影,纯白背景,高清,无品牌logo无水印",
    "bottle_syrup": "一瓶棕色玻璃瓶装口服液药水,配纸盒,中药糖浆,产品摄影,纯白背景,高清,无品牌logo无水印",
    "bottle_pills": "一瓶白色塑料瓶装保健品药片,配标签,产品摄影,纯白背景,高清,无品牌logo无水印",
    "bottle_spray": "一支喷雾剂药瓶配纸盒,医用喷雾,产品摄影,纯白背景,高清,无品牌logo无水印",
    "bottle_drop": "一支滴眼液眼药水小瓶配纸盒,产品摄影,纯白背景,高清,无品牌logo无水印",
    "tube": "一支药膏软管配纸盒,外用乳膏,产品摄影,纯白背景,高清,无品牌logo无水印",
    "device": "一台家用医疗器械(体温计/血压计等),白色简洁,产品摄影,纯白背景,高清,无品牌logo无水印",
}
LOGO_PROMPT = "一个连锁药店的圆形品牌logo图标,{color}主色调,十字医疗符号,简洁扁平设计,纯白背景,无文字"


def pick_pharmacies(drug_key, n_min=2, n_max=5):
    """按 drugKey 稳定选取在售药店子集(2~5家)"""
    h = int(hashlib.md5(drug_key.encode()).hexdigest(), 16)
    k = n_min + h % (n_max - n_min + 1)
    # 稳定打乱药店顺序
    order = sorted(range(len(PHARMACIES)), key=lambda i: hashlib.md5(f"{drug_key}:{i}".encode()).hexdigest())
    return [PHARMACIES[i][0] for i in order[:k]]


def main():
    d = json.loads(DEFAULTS.read_text(encoding="utf-8"))
    # 幂等清理:去掉 p_ 药店与其商品
    d["shops"] = [s for s in d["shops"] if not s["id"].startswith("p_")]
    d["items"] = [i for i in d["items"] if not i["shopId"].startswith("p_")]

    prompts = json.loads(PROMPTS.read_text(encoding="utf-8"))

    # 先算每个药店卖哪些药(按 drugCat 归到菜单)
    pharm_items = {p[0]: [] for p in PHARMACIES}
    pharm_menu = {p[0]: {} for p in PHARMACIES}  # cat -> [itemIds]

    for cat_label, color, subs in CATS:
        for sub_label, drugs in subs.items():
            for (dkey, name, brand, spec, funcs, isrx, base, imgtype) in drugs:
                slug = f"med_{dkey}"
                prompts[f"items/{slug}.jpg"] = IMG_PROMPT[imgtype]
                sellers = pick_pharmacies(dkey)
                for si, pid in enumerate(sellers):
                    h = int(hashlib.md5(f"{dkey}:{pid}".encode()).hexdigest(), 16)
                    delta = (h % 7 - 3) / 10.0  # -0.3~0.3 元微调基准
                    price = round(base * (1 + delta * 0.12), 2)
                    orig = round(price * 1.28, 2)
                    monthly = 200 + h % 5000
                    itid = f"{pid}__{dkey}"
                    item = {
                        "id": itid, "slug": slug, "shopId": pid,
                        "name": f"{brand} {name} {spec}",
                        "desc": " · ".join(funcs),
                        "price": price, "origPrice": orig,
                        "monthlySales": monthly,
                        "tags": (["处方药"] if isrx else ["OTC"]) + (["健康卡"] if h % 3 == 0 else []),
                        "skuGroups": None,
                        "image": f"/@app-assets/TaobaoShangou/items/{slug}.jpg",
                        "drugKey": dkey, "drugCat": cat_label, "drugSub": sub_label,
                        "funcs": funcs, "isRx": isrx, "spec": spec, "brand": brand,
                    }
                    d["items"].append(item)
                    pharm_items[pid].append(itid)
                    pharm_menu[pid].setdefault(cat_label, []).append(itid)

    # 建药店店铺
    for (pid, name, branch, color, rating, sales, mins, dist, dfee, dfeeorig, minorder) in PHARMACIES:
        menu = [{"cat": c, "itemIds": ids} for c, ids in pharm_menu[pid].items()]
        prompts[f"logos/{pid}.jpg"] = LOGO_PROMPT.format(color=color)
        shop = {
            "id": pid, "name": name, "branch": branch, "fullName": f"{name}({branch})",
            "category": "pharmacy", "type": "retail", "brandColor": color, "menu": menu,
            "logo": f"/@app-assets/TaobaoShangou/logos/{pid}.jpg",
            "rating": rating, "monthlySales": sales, "minOrder": minorder,
            "deliveryFee": dfee, "deliveryFeeOrig": dfeeorig, "deliveryMinutes": mins, "distanceKm": dist,
            "features": ["24小时", "蜂鸟准时达", "药师在线"], "promos": [{"full": 39, "off": 4}, {"full": 79, "off": 7}],
            "shopCoupon": {"id": f"sc_{pid}", "amount": 5, "threshold": 39, "name": "关注领券", "claimed": False},
            "burstCoupon": {"amount": 12, "threshold": 49}, "mustPickCat": None,
            "notice": f"欢迎光临{name},本店24小时营业、药品丰富,处方药需凭处方购买,请遵医嘱用药。",
            "address": f"仙林大道{100 + len(pid)}号{branch}", "hours": "00:00-24:00",
            "phone": "400-000-0000", "supportsPickup": True,
            "ratingTaste": rating, "ratingPack": rating,
        }
        d["shops"].append(shop)

    DEFAULTS.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
    PROMPTS.write_text(json.dumps(prompts, ensure_ascii=False, indent=2), encoding="utf-8")

    n_drugs = sum(len(v) for _, _, subs in CATS for v in subs.values())
    n_items = sum(len(v) for v in pharm_items.values())
    print(f"pharmacies={len(PHARMACIES)} drugs={n_drugs} drug_items={n_items} shops_total={len(d['shops'])} items_total={len(d['items'])}")
    print(f"asset_prompts total={len(prompts)}")


if __name__ == "__main__":
    main()
