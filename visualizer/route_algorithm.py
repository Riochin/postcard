#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
移動アルゴリズム ビジュアライザー
Logi-Postの絵葉書移動ルート生成アルゴリズム
"""

import csv
import codecs
import math
import random
import webbrowser
import http.server
import socketserver
import threading
import os

from constants import CITY_VISITOR_CSV, CITIES_LOCATION_CSV


class RouteGenerator:
    def __init__(self):
        self.cities_data = []
        self.load_data()

    def load_data(self):
        """CSVファイルからデータを読み込み、結合処理を行う"""
        # 市区町村別来訪者数データの読み込み
        visitor_data = {}
        visitor_count_total = 0
        try:
            with codecs.open(CITY_VISITOR_CSV, "r", encoding="shift_jis") as f:
                reader = csv.reader(f)
                header = next(reader)  # ヘッダー行をスキップ
                print(f"来訪者数データのヘッダー: {header}")

                for row in reader:
                    if len(row) >= 9:
                        pref_name = row[5]  # 都道府県名
                        city_name = row[7]  # 地域名称
                        visitor_count = int(row[8])  # 人数
                        visitor_data[city_name] = {
                            "pref_name": pref_name,
                            "visitor_count": visitor_count,
                        }
                        visitor_count_total += 1

                print(f"来訪者数データ読み込み完了: {visitor_count_total}件")

        except Exception as e:
            print(f"来訪者数データの読み込みエラー: {e}")
            return

        # 位置情報データの読み込みと結合
        location_count_total = 0
        matched_count = 0
        unmatched_cities = []

        try:
            with codecs.open(CITIES_LOCATION_CSV, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                header = next(reader)  # ヘッダー行をスキップ
                print(f"位置情報データのヘッダー: {header}")

                for row in reader:
                    if len(row) >= 6:
                        pref_name = row[1]  # 都道府県名
                        city_name = row[2] + (row[3] if row[3] else "")  # 市区町村名

                        # ヘッダーの空白を処理
                        lat_str = row[4].strip()  # 緯度（空白を除去）
                        lon_str = row[5].strip()  # 経度（空白を除去）

                        try:
                            lat = float(lat_str)
                            lon = float(lon_str)
                        except ValueError:
                            print(
                                f"座標変換エラー: {city_name}, lat='{lat_str}', lon='{lon_str}'"
                            )
                            continue

                        # 来訪者数データと結合
                        visitor_count = 0
                        if city_name in visitor_data:
                            visitor_count = visitor_data[city_name]["visitor_count"]
                            matched_count += 1
                        else:
                            unmatched_cities.append(city_name)

                        self.cities_data.append(
                            {
                                "pref_name": pref_name,
                                "city_name": city_name,
                                "lat": lat,
                                "lon": lon,
                                "visitor_count": visitor_count,
                            }
                        )
                        location_count_total += 1

        except Exception as e:
            print(f"位置情報データの読み込みエラー: {e}")
            return

        print(f"位置情報データ読み込み完了: {location_count_total}件")
        print(f"データ結合成功: {matched_count}件")
        print(f"来訪者数データが見つからなかった市区町村: {len(unmatched_cities)}件")

        if len(unmatched_cities) > 0:
            print(f"例（最初の10件）: {unmatched_cities[:10]}")

        # 来訪者数が0でない市区町村の数を確認
        non_zero_count = len(
            [city for city in self.cities_data if city["visitor_count"] > 0]
        )
        print(f"来訪者数が0より大きい市区町村: {non_zero_count}件")

        print(f"データ読み込み完了: {len(self.cities_data)}件の市区町村データ")

    def get_distance(self, lat1, lon1, lat2, lon2):
        """2点間の距離を計算（ハバーサイン公式）"""
        R = 6371  # 地球の半径（km）

        # 度からラジアンに変換
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        # ハバーサイン公式
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    def get_prefecture_center(self, pref_name):
        """都道府県の代表市区町村（県庁所在地など）を取得"""
        pref_cities = [
            city for city in self.cities_data if city["pref_name"] == pref_name
        ]

        if not pref_cities:
            return None

        # 来訪者数が最も多い市区町村を選択（県庁所在地の代理）
        representative_city = max(pref_cities, key=lambda x: x["visitor_count"])
        return representative_city

    def generate_route(self, start_pref, end_pref, num_stops):
        """
        ルート生成メインアルゴリズム

        Args:
            start_pref (str): 出発地の都道府県名
            end_pref (str): 目的地の都道府県名
            num_stops (int): 経由地の数

        Returns:
            list: 経由する市区町村オブジェクトのリスト
        """
        route = []

        # 1. 初期化：出発地の県庁所在地を取得
        start_city = self.get_prefecture_center(start_pref)
        if not start_city:
            raise ValueError(f"出発地 '{start_pref}' のデータが見つかりません")

        route.append(
            {
                "name": start_city["city_name"],
                "lat": start_city["lat"],
                "lon": start_city["lon"],
                "pref_name": start_city["pref_name"],
                "visitor_count": start_city["visitor_count"],
            }
        )

        current_location = start_city

        # 目的地の中心緯度経度を計算
        end_city = self.get_prefecture_center(end_pref)
        if not end_city:
            raise ValueError(f"目的地 '{end_pref}' のデータが見つかりません")

        target_lat = end_city["lat"]
        target_lon = end_city["lon"]

        # 2. 経由地決定ループ
        for i in range(num_stops):
            # 現在地から目的地までの距離を計算
            current_to_target_distance = self.get_distance(
                current_location["lat"], current_location["lon"], target_lat, target_lon
            )

            # 候補の絞り込み：目的地により近くなる市区町村のみを選択
            candidates = []
            for city in self.cities_data:
                # 既にルートに含まれている場合はスキップ
                if any(r["name"] == city["city_name"] for r in route):
                    continue

                # 候補地から目的地までの距離を計算
                candidate_to_target_distance = self.get_distance(
                    city["lat"], city["lon"], target_lat, target_lon
                )

                # 目的地に近くなる場合のみ候補に追加
                if candidate_to_target_distance < current_to_target_distance:
                    candidates.append(city)

            if not candidates:
                print(f"経由地 {i+1} の候補が見つかりません。ループを終了します。")
                break

            # 確率的選択：来訪者数を重みとしてランダム選択
            total_weight = sum(city["visitor_count"] for city in candidates)
            if total_weight == 0:
                # 重みがない場合は均等に選択
                selected_city = random.choice(candidates)
            else:
                # 重み付きランダム選択
                rand_value = random.uniform(0, total_weight)
                cumulative_weight = 0
                selected_city = candidates[-1]  # フォールバック

                for city in candidates:
                    cumulative_weight += city["visitor_count"]
                    if rand_value <= cumulative_weight:
                        selected_city = city
                        break

            # ルートに追加
            route.append(
                {
                    "name": selected_city["city_name"],
                    "lat": selected_city["lat"],
                    "lon": selected_city["lon"],
                    "pref_name": selected_city["pref_name"],
                    "visitor_count": selected_city["visitor_count"],
                }
            )

            current_location = selected_city

        # 3. 完了：目的地の県庁所在地を追加
        route.append(
            {
                "name": end_city["city_name"],
                "lat": end_city["lat"],
                "lon": end_city["lon"],
                "pref_name": end_city["pref_name"],
                "visitor_count": end_city["visitor_count"],
            }
        )

        return route


def start_server():
    """HTTPサーバーを起動してビジュアライザーを開く"""
    port = 8080
    handler = http.server.SimpleHTTPRequestHandler

    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"HTTPサーバーを起動しました: http://localhost:{port}")
            print("ビジュアライザーをブラウザで開きます...")

            # 少し待ってからブラウザを開く
            threading.Timer(
                1.0, lambda: webbrowser.open(f"http://localhost:{port}")
            ).start()

            print("サーバーを停止するには Ctrl+C を押してください")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバーを停止しました")
    except OSError as e:
        print(f"ポート {port} は既に使用されています。別のポートを試してください。")
        print(f"エラー: {e}")


def main():
    """メイン関数：アルゴリズムのテスト実行とサーバー起動"""
    print("=== 移動アルゴリズム ビジュアライザー ===")

    # アルゴリズムのテスト実行
    generator = RouteGenerator()

    if len(generator.cities_data) == 0:
        print(
            "データの読み込みに失敗しました。data/ディレクトリにCSVファイルがあることを確認してください。"
        )
        return

    # テスト用ルート生成
    print("\nテスト用ルート生成中...")
    try:
        test_route = generator.generate_route("北海道", "沖縄県", 5)
        print("生成されたルート:")
        for i, stop in enumerate(test_route):
            print(f"  {i+1}. {stop['name']} ({stop['pref_name']})")
    except Exception as e:
        print(f"ルート生成エラー: {e}")
        return

    print("\nビジュアライザーを起動します...")

    # HTMLファイルが存在するかチェック
    if not os.path.exists("index.html"):
        print(
            "index.htmlが見つかりません。HTMLファイルを作成してから再実行してください。"
        )
        return

    # HTTPサーバーを起動
    start_server()


if __name__ == "__main__":
    main()
