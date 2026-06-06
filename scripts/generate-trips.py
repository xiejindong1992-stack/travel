#!/usr/bin/env python3
"""将航班自动分组为旅行 (Trip) 条目"""

import json
import re
from datetime import datetime, timedelta
from collections import OrderedDict

HOME = '广州'
HOME_IATA = 'CAN'
GAP_DAYS = 4  # 连续飞行间隔 > 4 天算新旅行

# ========== 城市 → 国家 ==========
COUNTRY = {
    '广州':'中国', '深圳':'中国', '珠海':'中国', '北京':'中国', '上海':'中国',
    '武汉':'中国', '重庆':'中国', '成都':'中国', '西安':'中国', '南京':'中国',
    '杭州':'中国', '昆明':'中国', '长沙':'中国', '贵阳':'中国', '哈尔滨':'中国',
    '长春':'中国', '沈阳':'中国', '大连':'中国', '青岛':'中国', '厦门':'中国',
    '福州':'中国', '三亚':'中国', '海口':'中国', '揭阳':'中国', '乌鲁木齐':'中国',
    '延吉':'中国', '稻城':'中国', '德宏':'中国', '大理':'中国', '琼海':'中国',
    '香港':'中国香港', '澳门':'中国澳门',
    '台北':'中国台湾', '高雄':'中国台湾', '釜山':'韩国', '济州':'韩国', '首尔':'韩国',
    '东京':'日本', '大阪':'日本', '名古屋':'日本', '冲绳':'日本', '札幌':'日本',
    '曼谷':'泰国', '清迈':'泰国', '甲米':'泰国', '苏梅':'泰国', '普吉':'泰国',
    '新加坡':'新加坡', '巴厘岛':'印尼', '科莫多':'印尼', '泗水':'印尼',
    '吉隆坡':'马来西亚', '亚庇':'马来西亚', '兰卡威':'马来西亚',
    '河内':'越南', '胡志明':'越南',
    '万象':'老挝', '迪拜':'阿联酋', '多哈':'卡塔尔', '伊斯坦布尔':'土耳其',
    '莫斯科':'俄罗斯', '伦敦':'英国', '曼彻斯特':'英国', '巴黎':'法国',
    '法兰克福':'德国', '阿姆斯特丹':'荷兰', '苏黎世':'瑞士',
    '米兰':'意大利', '罗马':'意大利', '巴塞罗那':'西班牙', '马德里':'西班牙',
    '里斯本':'葡萄牙', '布达佩斯':'匈牙利', '布拉格':'捷克', '维也纳':'奥地利',
    '悉尼':'澳大利亚', '墨尔本':'澳大利亚', '奥克兰':'新西兰',
    '旧金山':'美国', '洛杉矶':'美国', '纽约':'美国',
    '多伦多':'加拿大', '温哥华':'加拿大',
}

COUNTRY_EN = OrderedDict([
    ('中国','China'),('中国香港','Hong Kong'),('中国澳门','Macau'),('中国台湾','Taiwan'),
    ('韩国','South Korea'),('日本','Japan'),('泰国','Thailand'),('新加坡','Singapore'),
    ('印尼','Indonesia'),('马来西亚','Malaysia'),('越南','Vietnam'),('老挝','Laos'),
    ('阿联酋','UAE'),('卡塔尔','Qatar'),('土耳其','Turkey'),('俄罗斯','Russia'),
    ('英国','UK'),('法国','France'),('德国','Germany'),('荷兰','Netherlands'),
    ('瑞士','Switzerland'),('意大利','Italy'),('西班牙','Spain'),('葡萄牙','Portugal'),
    ('匈牙利','Hungary'),('捷克','Czech'),('奥地利','Austria'),
    ('澳大利亚','Australia'),('新西兰','New Zealand'),
    ('美国','USA'),('加拿大','Canada'),
])

# ========== 城市 → 坐标 (用于地图标记) ==========
COORDS = {
    '广州':(23.1291,113.2644),'深圳':(22.5431,114.0579),'珠海':(22.2710,113.5695),
    '北京':(39.9042,116.4074),'上海':(31.2304,121.4737),'武汉':(30.5928,114.3055),
    '重庆':(29.4316,106.9123),'成都':(30.5728,104.0668),'西安':(34.3416,108.9398),
    '南京':(32.0603,118.7969),'杭州':(30.2741,120.1551),'昆明':(25.0389,102.7183),
    '长沙':(28.2282,112.9388),'贵阳':(26.6470,106.6302),'哈尔滨':(45.8038,126.5350),
    '长春':(43.8961,125.3265),'沈阳':(41.8057,123.4315),'大连':(38.9140,121.6147),
    '青岛':(36.0671,120.3826),'厦门':(24.4798,118.0894),'福州':(26.0745,119.2965),
    '三亚':(18.2528,109.5120),'海口':(20.0221,110.3391),'揭阳':(23.5490,116.3726),
    '乌鲁木齐':(43.8256,87.6168),'延吉':(42.8912,129.5085),'稻城':(29.0298,100.3000),
    '德宏':(24.4355,101.4904),'大理':(25.6065,100.2276),'琼海':(19.2592,110.4649),
    '香港':(22.3193,114.1694),'澳门':(22.1987,113.5439),
    '台北':(25.0330,121.5654),'高雄':(22.6273,120.3014),
    '首尔':(37.5665,126.9780),'济州':(33.4996,126.5312),'釜山':(35.1796,129.0756),
    '东京':(35.6762,139.6503),'大阪':(34.6937,135.5023),'名古屋':(35.1814,136.9064),
    '冲绳':(26.2124,127.6809),'札幌':(43.0619,141.3544),
    '曼谷':(13.7563,100.5018),'清迈':(18.7883,98.9853),'甲米':(8.0863,98.9063),
    '苏梅':(9.5084,100.0068),'普吉':(7.8804,98.3923),
    '新加坡':(1.3521,103.8198),'巴厘岛':(-8.4095,115.1889),'科莫多':(-8.5912,119.4886),
    '泗水':(-7.2575,112.7521),
    '吉隆坡':(3.1390,101.6869),'亚庇':(5.9804,116.0735),'兰卡威':(6.3427,99.7287),
    '河内':(21.0278,105.8342),
    '万象':(17.9757,102.6331),'迪拜':(25.2048,55.2708),'多哈':(25.2854,51.5310),
    '伊斯坦布尔':(41.0082,28.9784),'莫斯科':(55.7558,37.6173),
    '伦敦':(51.5074,-0.1278),'曼彻斯特':(53.4808,-2.2426),'巴黎':(48.8566,2.3522),
    '法兰克福':(50.1109,8.6821),'阿姆斯特丹':(52.3676,4.9041),'苏黎世':(47.3769,8.5417),
    '米兰':(45.4642,9.1900),'罗马':(41.9028,12.4964),'巴塞罗那':(41.3874,2.1686),
    '马德里':(40.4168,-3.7038),'里斯本':(38.7223,-9.1393),
    '布达佩斯':(47.4979,19.0402),'布拉格':(50.0755,14.4378),'维也纳':(48.2082,16.3738),
    '悉尼':(-33.8688,151.2093),'墨尔本':(-37.8136,144.9631),'奥克兰':(-36.8485,174.7633),
    '旧金山':(37.7749,-122.4194),'洛杉矶':(34.0522,-118.2437),'纽约':(40.7128,-74.0060),
    '多伦多':(43.6532,-79.3832),'温哥华':(49.2827,-123.1207),
    '万象':(17.9757,102.6331),
}


def slugify(s):
    s = s.lower().replace(' ', '-')
    s = re.sub(r'[^a-z0-9\u4e00-\u9fff\-]', '', s)
    return s


def parse_date(d):
    return datetime.strptime(d, '%Y-%m-%d')


def cities_clean(flight):
    return flight.get('departureCity', ''), flight.get('arrivalCity', '')


def get_route(flights):
    """提取路线（按顺序的城市列表，去除连续重复）"""
    route = []
    for f in flights:
        dep = f.get('departureCity', '')
        arr = f.get('arrivalCity', '')
        if not route or route[-1] != dep:
            route.append(dep)
        if not route or route[-1] != arr:
            route.append(arr)
    return route


def get_country(city):
    return COUNTRY.get(city, '中国')


def get_destinations(route):
    """提取去重目的地（不含 HOME）"""
    seen = set()
    dests = []
    for c in route:
        if c != HOME and c not in seen:
            seen.add(c)
            dests.append(c)
    if not dests:
        return [HOME]
    return dests


def get_coords(city):
    return COORDS.get(city, (35.0, 105.0))  # 默认中国中心


def generate_trip_title(route, flights):
    """生成有方向感的旅行标题"""
    if not route:
        return '未知行程', 'Unknown Trip'

    home = HOME
    first_dep = flights[0].get('departureCity', '')
    last_arr = flights[-1].get('arrivalCity', '')

    # 去掉首尾的 home
    clean = route.copy()
    if clean and clean[0] == home:
        clean = clean[1:]
    if clean and clean[-1] == home:
        clean = clean[:-1]

    if not clean:
        return '在广州', 'In Guangzhou'

    # 去重有序目的地
    seen = set()
    dests = [c for c in clean if c not in seen and not seen.add(c)]

    en_map = {'广州':'Guangzhou','北京':'Beijing','上海':'Shanghai','武汉':'Wuhan',
              '成都':'Chengdu','重庆':'Chongqing','西安':"Xi'an",'昆明':'Kunming',
              '杭州':'Hangzhou','南京':'Nanjing','长沙':'Changsha','厦门':'Xiamen',
              '青岛':'Qingdao','三亚':'Sanya','海口':'Haikou','大连':'Dalian',
              '香港':'Hong Kong','澳门':'Macau',
              '东京':'Tokyo','大阪':'Osaka','曼谷':'Bangkok','新加坡':'Singapore',
              '巴厘岛':'Bali','首尔':'Seoul','清迈':'Chiang Mai','吉隆坡':'Kuala Lumpur',
              '甲米':'Krabi','台北':'Taipei','伊斯坦布尔':'Istanbul',
              '揭阳':'Jieyang','稻城':'Daocheng','大理':'Dali','德宏':'Dehong',
              '延吉':'Yanji','琼海':'Qionghai','珠海':'Zhuhai','深圳':'Shenzhen',
              '兰卡威':'Langkawi','苏梅':'Koh Samui','亚庇':'Kota Kinabalu',
              '济州':'Jeju','名古屋':'Nagoya','冲绳':'Okinawa','札幌':'Sapporo',
              '科莫多':'Komodo','泗水':'Surabaya','乌鲁木齐':'Urumqi',
              '巴黎':'Paris','伦敦':'London','悉尼':'Sydney','墨尔本':'Melbourne',
              '布达佩斯':'Budapest','布拉格':'Prague','维也纳':'Vienna',
              '贵阳':'Guiyang','哈尔滨':'Harbin','长春':'Changchun','沈阳':'Shenyang',
              '福州':'Fuzhou','釜山':'Busan','高雄':'Kaohsiung','万象':'Vientiane',
              '河内':'Hanoi','首尔':'Seoul','兰卡威':'Langkawi','名古屋':'Nagoya',
              '旧金山':'San Francisco','洛杉矶':'Los Angeles','米兰':'Milan',
              '罗马':'Rome','巴塞罗那':'Barcelona','马德里':'Madrid',
              '伦敦':'London','曼彻斯特':'Manchester','巴黎':'Paris',
              '法兰克福':'Frankfurt','阿姆斯特丹':'Amsterdam','苏黎世':'Zurich'
    }

    def en(c):
        return en_map.get(c, c)

    # 方向检测
    one_seg = len(flights) == 1
    if one_seg:
        if first_dep == home and last_arr != home:
            cn = f'前往{dests[0]}'
            en_t = f'Trip to {en(dests[0])}'
        elif first_dep != home and last_arr == home:
            cn = f'从{dests[0]}返回'
            en_t = f'Return from {en(dests[0])}'
        else:
            cn = f'{dests[0]}'
            en_t = f'{en(dests[0])}'
    elif len(flights) == 2 and first_dep == home and last_arr == home:
        cn = f'前往{dests[0]}'
        en_t = f'Trip to {en(dests[0])}'
    elif len(dests) <= 3:
        cn = ' · '.join(dests)
        en_t = ' · '.join(en(d) for d in dests)
    else:
        cn = ' · '.join(dests[:3]) + ' …'
        en_t = ' · '.join(en(d) for d in dests[:3]) + ' …'

    return cn, en_t


def generate_slug(flights, route, title_cn):
    """生成唯一 slug"""
    first = flights[0]
    date = first['date']
    # Use first non-home destination for slug
    for c in route:
        if c != HOME:
            s = c.lower()
            break
    else:
        s = 'travel'
    slug = f"{date}-{slugify(s)}"
    return slug


def main():
    with open('data/flights.json', 'r', encoding='utf-8') as f:
        flights_data = json.load(f)

    # 只处理未关联的航班
    unassigned = [f for f in flights_data['flights'] if not f.get('tripId')]
    unassigned.sort(key=lambda f: f['date'])
    
    print(f'共 {len(unassigned)} 条未关联航班，开始分组...')

    # ======== 分组 ========
    groups = []
    current = [unassigned[0]]

    for i in range(1, len(unassigned)):
        prev_date = parse_date(current[-1]['date'])
        curr_date = parse_date(unassigned[i]['date'])
        gap = (curr_date - prev_date).days

        if gap > GAP_DAYS:
            groups.append(current)
            current = [unassigned[i]]
        else:
            current.append(unassigned[i])

    if current:
        groups.append(current)

    print(f'分组完成: {len(groups)} 次旅行\n')

    # ======== 生成 Trip ========
    new_trips = []
    trip_id_map = {}  # flight id → trip slug

    for idx, group in enumerate(groups):
        route = get_route(group)
        title_cn, title_en = generate_trip_title(route, group)

        # 收集所有目的地城市（去重有序）
        dests_cn = get_destinations(route)
        en_map = {'广州':'Guangzhou','北京':'Beijing','上海':'Shanghai','武汉':'Wuhan',
                  '成都':'Chengdu','重庆':'Chongqing','西安':"Xi'an",'昆明':'Kunming',
                  '杭州':'Hangzhou','南京':'Nanjing','长沙':'Changsha','厦门':'Xiamen',
                  '青岛':'Qingdao','三亚':'Sanya','海口':'Haikou','大连':'Dalian',
                  '香港':'Hong Kong','澳门':'Macau',
                  '东京':'Tokyo','大阪':'Osaka','曼谷':'Bangkok','新加坡':'Singapore',
                  '巴厘岛':'Bali','首尔':'Seoul','清迈':'Chiang Mai','吉隆坡':'Kuala Lumpur',
                  '甲米':'Krabi','台北':'Taipei','伊斯坦布尔':'Istanbul',
                  '揭阳':'Jieyang','稻城':'Daocheng','大理':'Dali','德宏':'Dehong',
                  '延吉':'Yanji','琼海':'Qionghai','珠海':'Zhuhai','深圳':'Shenzhen',
                  '兰卡威':'Langkawi','苏梅':'Koh Samui','亚庇':'Kota Kinabalu',
                  '济州':'Jeju','名古屋':'Nagoya','冲绳':'Okinawa','札幌':'Sapporo',
                  '科莫多':'Komodo','泗水':'Surabaya','乌鲁木齐':'Urumqi',
                  '巴黎':'Paris','伦敦':'London','悉尼':'Sydney','墨尔本':'Melbourne',
                  '布达佩斯':'Budapest','布拉格':'Prague','维也纳':'Vienna',
                  '贵阳':'Guiyang','哈尔滨':'Harbin','长春':'Changchun','沈阳':'Shenyang',
                  '福州':'Fuzhou','釜山':'Busan','高雄':'Kaohsiung','万象':'Vientiane',
                  '河内':'Hanoi','兰卡威':'Langkawi','名古屋':'Nagoya','首尔':'Seoul',
                  '旧金山':'San Francisco','洛杉矶':'Los Angeles','米兰':'Milan',
                  '罗马':'Rome','巴塞罗那':'Barcelona','马德里':'Madrid',
                  '法兰克福':'Frankfurt','阿姆斯特丹':'Amsterdam','苏黎世':'Zurich'
        }
        dests_en = [en_map.get(c, c) for c in dests_cn]
        countries_seen = set(get_country(c) for c in route)

        # Country
        countries = list(countries_seen)
        country_cn = ' · '.join(countries[:3])
        country_en = ' · '.join([COUNTRY_EN.get(c, c) for c in countries[:3]])

        # Date range
        start_date = group[0]['date']
        end_date = group[-1]['date']

        # Slug
        slug = generate_slug(group, route, title_cn)

        # Coordinates (use first non-home destination or first destination)
        coords = None
        for c in route:
            if c != HOME:
                coords = get_coords(c)
                break
        if not coords:
            coords = get_coords(HOME)

        # Highlights (destinations)
        hls = [f'到访{d}' for d in dests_cn[:5] if d != HOME]
        hls_en = [f'Visited {d}' for d in dests_en[:5]]
        if not hls:
            hls = ['在广州']
            hls_en = ['In Guangzhou']

        # Description
        route_str = ' → '.join(route[:8])
        if len(route) > 8:
            route_str += ' → …'
        desc_cn = f"从{HOME}出发，{route_str}，共{len(group)}段飞行。"
        desc_en = f"From {HOME}, {route_str}, {len(group)} flights."

        # Tags
        tags = ['auto']
        # Check if any destination is international
        international = any(get_country(c) not in ('中国','中国香港','中国澳门','中国台湾') for c in route)
        if international:
            tags.append('international')

        # Total distance
        total_dist = sum(f.get('distance', 0) or 0 for f in group)

        trip_id = slug
        flight_ids = [f['id'] for f in group]

        trip = {
            'id': trip_id,
            'slug': slug,
            'title': title_cn,
            'titleEn': title_en,
            'dateRange': {'start': start_date, 'end': end_date},
            'destinations': dests_cn[:10],
            'destinationsEn': dests_en[:10],
            'country': country_cn,
            'countryEn': country_en,
            'coordinates': {'lat': coords[0], 'lng': coords[1]},
            'cover': None,
            'highlights': hls,
            'highlightsEn': hls_en,
            'description': desc_cn,
            'descriptionEn': desc_en,
            'flights': flight_ids,
            'tags': tags,
            'distance': total_dist
        }
        new_trips.append(trip)

        for fid in flight_ids:
            trip_id_map[fid] = trip_id

    # ======== 写入 trips.json ========
    with open('data/trips.json', 'r', encoding='utf-8') as f:
        existing_trips = json.load(f)

    # 保留已有示例 + 追加新生成的
    all_trips = existing_trips['trips'] + new_trips
    with open('data/trips.json', 'w', encoding='utf-8') as f:
        json.dump({'trips': all_trips}, f, ensure_ascii=False, indent=2)

    # ======== 更新 flight tripIds ========
    for flight in flights_data['flights']:
        if flight['id'] in trip_id_map:
            flight['tripId'] = trip_id_map[flight['id']]

    with open('data/flights.json', 'w', encoding='utf-8') as f:
        json.dump(flights_data, f, ensure_ascii=False, indent=2)

    print(f'✅ 完成！')
    print(f'   新增 {len(new_trips)} 条旅行')
    print(f'   已关联 {len(trip_id_map)} 条航班')
    print(f'   trips.json 总计 {len(all_trips)} 条\n')

    # 输出前 10 条预览
    print('📋 生成预览 (前 10 条):')
    for t in new_trips[:10]:
        flights_count = len(t['flights'])
        route = ' → '.join(t['destinations'][:4])
        print(f'  {t["dateRange"]["start"]}  {t["title"]:25s}  ({flights_count}段)  {route}')
    if len(new_trips) > 10:
        print(f'  ... 还有 {len(new_trips) - 10} 条')


if __name__ == '__main__':
    main()
