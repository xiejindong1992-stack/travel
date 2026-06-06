#!/usr/bin/env python3
"""
import-variflight.py — 航旅纵横 CSV to flights.json converter

Usage:
    python3 scripts/import-variflight.py <csv_file>

The CSV should have these columns (exported from 航旅纵横 / FlightMaster):
    航班号,日期,航空公司,出发地,到达地,起飞时间,到达时间,机型,座位号,备注

Output: flights data appended to data/flights.json (or printed to stdout with --stdout)
"""

import csv
import json
import sys
import os
from datetime import datetime


# Airport code mapping (common Chinese cities → IATA codes)
AIRPORT_MAP = {
    '北京': 'PEK', '北京首都': 'PEK', '北京大兴': 'PKX', '大兴': 'PKX',
    '上海浦东': 'PVG', '上海虹桥': 'SHA', '上海': 'PVG',
    '广州': 'CAN', '深圳': 'SZX', '成都': 'CTU', '成都天府': 'TFU',
    '重庆': 'CKG', '杭州': 'HGH', '南京': 'NKG', '西安': 'XIY',
    '昆明': 'KMG', '厦门': 'XMN', '武汉': 'WUH', '长沙': 'CSX',
    '青岛': 'TAO', '大连': 'DLC', '三亚': 'SYX', '海口': 'HAK',
    '乌鲁木齐': 'URC', '哈尔滨': 'HRB', '贵阳': 'KWE', '南宁': 'NNG',
    '拉萨': 'LXA', '香港': 'HKG', '澳门': 'MFM', '台北': 'TPE',
    '桃园': 'TPE', '松山': 'TSA', '高雄': 'KHH',
    '东京': 'NRT', '东京成田': 'NRT', '东京羽田': 'HND',
    '大阪': 'KIX', '大阪关西': 'KIX',
    '首尔': 'ICN', '仁川': 'ICN', '金浦': 'GMP',
    '曼谷': 'BKK', '素万那普': 'BKK',
    '新加坡': 'SIN', '樟宜': 'SIN',
    '巴厘岛': 'DPS', '雅加达': 'CGK',
    '普吉岛': 'HKT', '清迈': 'CNX', '河内': 'HAN',
    '胡志明': 'SGN', '吉隆坡': 'KUL',
    '马尼拉': 'MNL', '仰光': 'RGN',
    '伦敦': 'LHR', '巴黎': 'CDG', '法兰克福': 'FRA',
    '纽约': 'JFK', '洛杉矶': 'LAX', '旧金山': 'SFO',
    '悉尼': 'SYD', '墨尔本': 'MEL',
}


def city_to_code(city):
    """Best-effort city name → IATA code conversion."""
    city = city.strip()
    if city in AIRPORT_MAP:
        return AIRPORT_MAP[city]
    # Return as-is if it's already a 3-letter code
    if len(city) == 3 and city.isupper():
        return city
    return city


def parse_time(time_str):
    """Parse time string, handle various formats."""
    time_str = time_str.strip()
    # Try HH:MM
    try:
        datetime.strptime(time_str, '%H:%M')
        return time_str
    except ValueError:
        pass
    # Try H:MM
    try:
        datetime.strptime(time_str, '%H:%M')
        return time_str.zfill(5)
    except ValueError:
        pass
    return time_str


def compute_distance(dep, arr):
    """Rough great-circle distance helper via lookup table."""
    # Simple pairs for common routes (km)
    ROUTES = {
        ('PEK', 'NRT'): 2097, ('PEK', 'HND'): 2090,
        ('PEK', 'KIX'): 1678, ('PEK', 'ICN'): 963,
        ('PEK', 'BKK'): 4615, ('PEK', 'SIN'): 4475,
        ('PEK', 'DPS'): 5211, ('PEK', 'HKG'): 2507,
        ('PEK', 'SFO'): 9493, ('PEK', 'LAX'): 10091,
        ('PEK', 'LHR'): 8152,
        ('NRT', 'PEK'): 2097, ('HND', 'PEK'): 2090,
        ('KIX', 'PEK'): 1678, ('ICN', 'PEK'): 963,
        ('BKK', 'PEK'): 4615, ('SIN', 'PEK'): 4475,
        ('DPS', 'PEK'): 5211, ('HKG', 'PEK'): 2507,
    }
    key = (dep.upper(), arr.upper())
    if key in ROUTES:
        return ROUTES[key]
    key2 = (arr.upper(), dep.upper())
    if key2 in ROUTES:
        return ROUTES[key2]
    return 0


def main():
    if len(sys.argv) < 2 and '--stdout' not in sys.argv:
        print(__doc__)
        sys.exit(1)

    csv_file = None
    to_stdout = False
    for arg in sys.argv[1:]:
        if arg == '--stdout':
            to_stdout = True
        elif os.path.isfile(arg):
            csv_file = arg

    if not csv_file:
        print('Error: No CSV file provided.', file=sys.stderr)
        sys.exit(1)

    flights = []
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Try to find column name flexibly
            flight_no = row.get('航班号', row.get('flight_no', ''))
            date = row.get('日期', row.get('date', ''))
            airline = row.get('航空公司', row.get('airline', ''))
            dep = row.get('出发地', row.get('departure', ''))
            arr = row.get('到达地', row.get('arrival', ''))
            dep_time = row.get('起飞时间', row.get('dep_time', ''))
            arr_time = row.get('到达时间', row.get('arr_time', ''))
            aircraft = row.get('机型', row.get('aircraft', ''))
            seat = row.get('座位号', row.get('seat', ''))

            if not flight_no or not date:
                continue

            dep_code = city_to_code(dep)
            arr_code = city_to_code(arr)
            dep_city = dep.strip()
            arr_city = arr.strip()
            distance = compute_distance(dep_code, arr_code)

            flight = {
                'id': flight_no.strip(),
                'flightNo': flight_no.strip(),
                'airline': airline.strip(),
                'airlineEn': airline.strip(),
                'airlineCode': flight_no.strip()[:2],
                'date': date.strip(),
                'departure': dep_code,
                'departureCity': dep_city,
                'departureCityEn': dep_city,
                'arrival': arr_code,
                'arrivalCity': arr_city,
                'arrivalCityEn': arr_city,
                'depTime': parse_time(dep_time),
                'arrTime': parse_time(arr_time),
                'duration': '',
                'aircraft': aircraft.strip(),
                'seat': seat.strip(),
                'cabin': 'Y',
                'distance': distance,
                'tripId': '',
                'notes': '',
            }
            flights.append(flight)

    if to_stdout:
        print(json.dumps({'flights': flights}, ensure_ascii=False, indent=2))
        return

    # Load existing flights.json and append
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'flights.json')
    data_path = os.path.abspath(data_path)

    if os.path.exists(data_path):
        with open(data_path, 'r', encoding='utf-8') as f:
            existing = json.load(f)
    else:
        existing = {'flights': []}

    existing_ids = {f['id'] for f in existing['flights']}
    new_count = 0
    for flight in flights:
        if flight['id'] not in existing_ids:
            existing['flights'].append(flight)
            existing_ids.add(flight['id'])
            new_count += 1

    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f'Imported {len(flights)} flights, {new_count} new. Total: {len(existing["flights"])} flights.')


if __name__ == '__main__':
    main()
