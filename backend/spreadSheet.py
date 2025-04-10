import datetime

import gspread
from gspread_dataframe import get_as_dataframe
from oauth2client.service_account import ServiceAccountCredentials


class SpreadSheet:
    def __init__(self):
        # Google Sheets APIとGoogle Drive APIのスコープを指定
        scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
        # サービスアカウントキーのJSONファイルを指定して認証
        creds = ServiceAccountCredentials.from_json_keyfile_name("key/mayfes-statistics-ef5383fba66d.json", scopes)
        # gspreadでGoogle Sheetsにアクセス
        client = gspread.authorize(creds)
        # スプレッドシートを開く
        self.spreadsheet = client.open_by_url(
            "https://docs.google.com/spreadsheets/d/1qp8OHhsYVH8FEh8bW_5zzsUq0oweHxAdzecIdjkTcj4/edit?usp=sharing"
        )
        self.sheet = [
            self.spreadsheet.worksheet("test1"),
            self.spreadsheet.worksheet("test2"),
            self.spreadsheet.worksheet("test3"),
        ]

    def insert(self, test_type, reaction_speed, additional_info):
        worksheet = self.spreadsheet.worksheet(test_type)
        # A列の末尾で次の行を取得
        next_row = len(worksheet.col_values(1)) + 1
        # timestampの取得
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for i in range(len(reaction_speed)):
            # セルにデータを保存(全テスト共通)
            worksheet.update_cell(next_row + i, 1, reaction_speed[i])  # A列に反応速度を挿入
            worksheet.update_cell(next_row + i, 2, timestamp)  # B列にtimestampを挿入
            column_index = 3
            print(additional_info)
            for v in additional_info[i].values():
                worksheet.update_cell(next_row + i, column_index, v)
                column_index += 1

    def get_data(self):
        total_data = {}
        for sheet_name in ["test1", "test2", "test3"]:
            worksheet = self.spreadsheet.worksheet(sheet_name)
            df = get_as_dataframe(worksheet)
            df = df.dropna(how="all")  # 空行削除
            total_data[sheet_name] = df
        return total_data


if __name__ == "__main__":
    sheet = SpreadSheet()
    sheet.insert("test1", 0.600, None)
    df_data = sheet.get_data()
    data = {}
    for key, df in df_data.items():
        data[key] = df["反応速度"].to_list()
