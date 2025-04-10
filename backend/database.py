import datetime
import sqlite3


class DataBase:
    def __init__(self, db_path):
        self.db_path = db_path
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 存在しない場合はテーブルを作成
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS reactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reaction_speed REAL NOT NULL,
                test_type TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        # コミットとクローズ
        cursor.close()
        conn.close()

    def insert_output(self, reaction_speed, test_type):
        """
        Save output to database

        reaction_speed: float (ms)
        test_type: str
        return: None
        """
        # データベースに接続（存在しない場合は自動的に作成されます）
        conn = sqlite3.connect(self.db_path)

        # カーソルオブジェクトを取得
        cursor = conn.cursor()

        # timestampの取得
        timestamp = datetime.datetime.now()

        # INSERTクエリ
        cursor.execute(
            "INSERT INTO reactions (reaction_speed, test_type, timestamp) VALUES (?, ?, ?)",
            (reaction_speed, test_type, timestamp),
        )
        conn.commit()

        # コミットとクローズ
        cursor.close()
        conn.close()

    def get_all_data(self):
        total_data = {}
        # データベースに接続（存在しない場合は自動的に作成されます）
        conn = sqlite3.connect(self.db_path)
        # カーソルオブジェクトを取得
        cursor = conn.cursor()
        for test_type in ["test1", "test2", "test3"]:
            cursor.execute(f"""SELECT * FROM reactions WHERE test_type = '{test_type}'""")
            rows = cursor.fetchall()
            total_data[test_type] = [row[1] for row in rows]
        # コミットとクローズ
        cursor.close()
        conn.close()

        return total_data

    def get_recent_data(self, hours=1):
        recent_data = {}
        # データベースに接続（存在しない場合は自動的に作成されます）
        conn = sqlite3.connect(self.db_path)
        # カーソルオブジェクトを取得
        cursor = conn.cursor()
        # 直近 1 時間のデータを取得
        for test_type in ["test1", "test2", "test3"]:
            cursor.execute(
                f"""
                SELECT * FROM reactions
                WHERE test_type = '{test_type}' AND timestamp >= DATETIME('now', '-{hours} hour')
                """
            )
            rows = cursor.fetchall()
            recent_data[test_type] = [row[1] for row in rows]

        # コミットとクローズ
        cursor.close()
        conn.close()

        return recent_data


if __name__ == "__main__":
    database = DataBase("./data/ReactionSpeed.db")
    database.insert_output(0.600)
    rows = database.get_recent_data(hours=1)
    print(rows)
