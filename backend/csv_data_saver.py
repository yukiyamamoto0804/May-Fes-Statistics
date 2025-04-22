import csv
import datetime
import os

import pandas as pd


class CsvDataSaver:
    def __init__(self, output_dir="output"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)  # フォルダがなければ作成
        self.headers = {
            "test1": ['GroupId', "反応速度", "TimeStamp"],
            "test2": ["GroupId", "反応速度", "TimeStamp", "color", "text"],
            "test3": ["GroupId", "反応速度", "TimeStamp", "color", "text"],
        }
        for test_type in ["test1", "test2", "test3"]:
            filepath = os.path.join(self.output_dir, f"{test_type}.csv")
            file_exists = os.path.exists(filepath)
            if not file_exists:
                with open(filepath, mode="w", newline="", encoding="utf-8") as file:
                    writer = csv.writer(file)
                    writer.writerow(self.headers[test_type])

    def insert(self, test_type, reaction_speed, additional_info):
        filepath = os.path.join(self.output_dir, f"{test_type}.csv")
        last_row = self.read_last_row(filepath)
        if self.isint(last_row[0]):
            groupid = int(last_row[0]) + 1
        else:
            groupid = 1
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(filepath, mode="a", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            datas = []
            for i in range(5):
                data = [groupid, reaction_speed[i], timestamp]
                for j in range(3, len(self.headers[test_type])):
                    data.append(additional_info[i][self.headers[test_type][j]])
                datas.append(data)
            writer.writerows(datas)

    def read_last_row(self, filepath):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"{filepath} が見つかりません。")

        with open(filepath, mode="r", newline="", encoding="utf-8") as file:
            reader = list(csv.reader(file))
            if not reader:
                return None  # 空のファイル
            return reader[-1]  # 最後の行

    def get_data(self):
        total_data = {}
        for test_name in ["test1", "test2", "test3"]:
            df = pd.read_csv(f"output/{test_name}.csv")  # パスは適宜変更してね
            df = df.dropna(how="all")  # 空行削除
            total_data[test_name] = df
        print(total_data)
        return total_data

    @staticmethod
    def isint(x):
        try:
            int(x)
            return True
        except:
            return False

if __name__ == "__main__":
    sheet = CsvDataSaver()
    sheet.insert("test2", [600, 600, 600, 600, 600], None)
    df_data = sheet.get_data()
    data = {}
    for key, df in df_data.items():
        data[key] = df["反応速度"].to_list()