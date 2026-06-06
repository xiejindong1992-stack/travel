#!/usr/bin/env python3
"""清理航班数据中的城市名 → 统一城市名、IATA代码、英文名"""

import json

# 映射表: 原始城市名 → (IATA, 标准化城市名CN, 城市名EN)
CITY_MAP = {
    # === 中国大陆 ===
    '广州白云': ('CAN', '广州', 'Guangzhou'),
    '广州': ('CAN', '广州', 'Guangzhou'),
    '深圳宝安': ('SZX', '深圳', 'Shenzhen'),
    '珠海金湾': ('ZUH', '珠海', 'Zhuhai'),

    '北京': ('PEK', '北京', 'Beijing'),
    '北京首都': ('PEK', '北京', 'Beijing'),
    '北京大兴': ('PKX', '北京', 'Beijing'),

    '上海虹桥': ('SHA', '上海', 'Shanghai'),
    '上海浦东': ('PVG', '上海', 'Shanghai'),

    '武汉天河': ('WUH', '武汉', 'Wuhan'),
    '重庆江北': ('CKG', '重庆', 'Chongqing'),
    '成都天府': ('TFU', '成都', 'Chengdu'),
    '成都双流': ('CTU', '成都', 'Chengdu'),
    '西安咸阳': ('XIY', '西安', "Xi'an"),
    '南京禄口': ('NKG', '南京', 'Nanjing'),
    '杭州萧山': ('HGH', '杭州', 'Hangzhou'),
    '昆明长水': ('KMG', '昆明', 'Kunming'),
    '长沙黄花': ('CSX', '长沙', 'Changsha'),
    '贵阳龙洞堡': ('KWE', '贵阳', 'Guiyang'),
    '哈尔滨太平': ('HRB', '哈尔滨', 'Harbin'),
    '长春龙嘉': ('CGQ', '长春', 'Changchun'),
    '沈阳桃仙': ('SHE', '沈阳', 'Shenyang'),
    '大连周水子': ('DLC', '大连', 'Dalian'),
    '青岛流亭': ('TAO', '青岛', 'Qingdao'),
    '青岛胶东': ('TAO', '青岛', 'Qingdao'),
    '厦门高崎': ('XMN', '厦门', 'Xiamen'),
    '福州长乐': ('FOC', '福州', 'Fuzhou'),
    '三亚凤凰': ('SYX', '三亚', 'Sanya'),
    '海口美兰': ('HAK', '海口', 'Haikou'),
    '揭阳潮汕': ('SWA', '揭阳', 'Jieyang'),
    '乌鲁木齐地窝堡': ('URC', '乌鲁木齐', 'Urumqi'),
    '延吉朝阳川': ('YNJ', '延吉', 'Yanji'),
    '稻城亚丁': ('DCY', '稻城', 'Daocheng'),
    '德宏芒市': ('LUM', '德宏', 'Dehong'),
    '大理凤仪': ('DLU', '大理', 'Dali'),
    '琼海博鳌': ('BAR', '琼海', 'Qionghai'),

    # === 港澳台 ===
    '香港国际': ('HKG', '香港', 'Hong Kong'),
    '中国澳门': ('MFM', '澳门', 'Macau'),
    '中国台北桃园': ('TPE', '台北', 'Taipei'),
    '高雄国际': ('KHH', '高雄', 'Kaohsiung'),

    # === 日本 ===
    '东京': ('NRT', '东京', 'Tokyo'),
    '东京成田': ('NRT', '东京', 'Tokyo'),
    '东京羽田': ('HND', '东京', 'Tokyo'),
    '大阪': ('KIX', '大阪', 'Osaka'),
    '大阪关西': ('KIX', '大阪', 'Osaka'),
    '名古屋中部国际': ('NGO', '名古屋', 'Nagoya'),
    '冲绳那霸': ('OKA', '冲绳', 'Okinawa'),
    '北海道新千岁': ('CTS', '札幌', 'Sapporo'),

    # === 韩国 ===
    '首尔': ('ICN', '首尔', 'Seoul'),
    '首尔仁川国际': ('ICN', '首尔', 'Seoul'),
    '首尔金浦国际': ('GMP', '首尔', 'Seoul'),
    '济州国际': ('CJU', '济州', 'Jeju'),
    '釜山金海国际': ('PUS', '釜山', 'Busan'),

    # === 东南亚 ===
    '曼谷': ('BKK', '曼谷', 'Bangkok'),
    '曼谷素万那普国际': ('BKK', '曼谷', 'Bangkok'),
    '曼谷廊曼': ('DMK', '曼谷', 'Bangkok'),
    '清迈国际': ('CNX', '清迈', 'Chiang Mai'),
    '甲米': ('KBV', '甲米', 'Krabi'),
    '苏梅国际': ('USM', '苏梅', 'Koh Samui'),
    '普吉岛': ('HKT', '普吉', 'Phuket'),

    '新加坡': ('SIN', '新加坡', 'Singapore'),
    '新加坡樟宜': ('SIN', '新加坡', 'Singapore'),

    '巴厘岛': ('DPS', '巴厘岛', 'Bali'),
    '巴厘岛努拉莱伊': ('DPS', '巴厘岛', 'Bali'),
    '科莫多': ('LBJ', '科莫多', 'Komodo'),
    '泗水朱安达': ('SUB', '泗水', 'Surabaya'),

    '吉隆坡国际': ('KUL', '吉隆坡', 'Kuala Lumpur'),
    '哥打京那巴鲁': ('BKI', '亚庇', 'Kota Kinabalu'),
    '兰卡威国际': ('LGK', '兰卡威', 'Langkawi'),

    '河内内排国际': ('HAN', '河内', 'Hanoi'),
    '胡志明新山一': ('SGN', '胡志明', 'Ho Chi Minh City'),

    '万象瓦岱': ('VTE', '万象', 'Vientiane'),

    # === 其他 ===
    '伊斯坦布尔': ('IST', '伊斯坦布尔', 'Istanbul'),
    '迪拜': ('DXB', '迪拜', 'Dubai'),
    '多哈': ('DOH', '多哈', 'Doha'),

    '莫斯科谢列梅捷沃': ('SVO', '莫斯科', 'Moscow'),

    '伦敦希思罗': ('LHR', '伦敦', 'London'),
    '伦敦盖特威克': ('LGW', '伦敦', 'London'),
    '曼彻斯特': ('MAN', '曼彻斯特', 'Manchester'),
    '巴黎戴高乐': ('CDG', '巴黎', 'Paris'),
    '巴黎奥利': ('ORY', '巴黎', 'Paris'),
    '法兰克福': ('FRA', '法兰克福', 'Frankfurt'),
    '阿姆斯特丹': ('AMS', '阿姆斯特丹', 'Amsterdam'),
    '苏黎世': ('ZRH', '苏黎世', 'Zurich'),
    '米兰马尔彭萨': ('MXP', '米兰', 'Milan'),
    '罗马菲乌米奇诺': ('FCO', '罗马', 'Rome'),
    '巴塞罗那': ('BCN', '巴塞罗那', 'Barcelona'),
    '马德里': ('MAD', '马德里', 'Madrid'),
    '里斯本': ('LIS', '里斯本', 'Lisbon'),
    '布达佩斯': ('BUD', '布达佩斯', 'Budapest'),
    '布拉格': ('PRG', '布拉格', 'Prague'),
    '维也纳': ('VIE', '维也纳', 'Vienna'),

    '悉尼': ('SYD', '悉尼', 'Sydney'),
    '墨尔本': ('MEL', '墨尔本', 'Melbourne'),
    '奥克兰': ('AKL', '奥克兰', 'Auckland'),

    '旧金山': ('SFO', '旧金山', 'San Francisco'),
    '洛杉矶': ('LAX', '洛杉矶', 'Los Angeles'),
    '纽约肯尼迪': ('JFK', '纽约', 'New York'),
    '纽约拉瓜迪亚': ('LGA', '纽约', 'New York'),
    '多伦多': ('YYZ', '多伦多', 'Toronto'),
    '温哥华': ('YVR', '温哥华', 'Vancouver'),

    '中国台北桃园': ('TPE', '台北', 'Taipei'),
}


def clean():
    with open('data/flights.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    stats = {'fixed_city': 0, 'fixed_code': 0, 'not_found_dep': set(), 'not_found_arr': set()}

    for flight in data['flights']:
        for side in ['departure', 'arrival']:
            raw = flight.get(f'{side}City', '')
            if not raw:
                continue
            key = raw.strip()
            if key in CITY_MAP:
                iata, city_cn, city_en = CITY_MAP[key]
                # Update city name (clean)
                if flight.get(f'{side}City') != city_cn:
                    flight[f'{side}City'] = city_cn
                    stats['fixed_city'] += 1
                # Update IATA code
                if not flight.get(side, ''):
                    flight[side] = iata
                    stats['fixed_code'] += 1
                # Update English name
                flight[f'{side}CityEn'] = city_en
            else:
                if side == 'departure':
                    stats['not_found_dep'].add(key)
                else:
                    stats['not_found_arr'].add(key)

    with open('data/flights.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ 清洗完成")
    print(f"   城市名标准化: {stats['fixed_city']} 处")
    print(f"   IATA 代码补充: {stats['fixed_code']} 处")
    if stats['not_found_dep'] or stats['not_found_arr']:
        unfound = stats['not_found_dep'] | stats['not_found_arr']
        print(f"   ⚠ 未匹配的城市名 ({len(unfound)}个): {', '.join(sorted(unfound))}")


if __name__ == '__main__':
    clean()
