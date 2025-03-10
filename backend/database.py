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
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        # コミットとクローズ
        cursor.close()
        conn.close()

    def insert_output(self, reaction_speed):
        """
        Save output to database

        reaction_speed: float (ms)
        return: None
        """
        # データベースに接続（存在しない場合は自動的に作成されます）
        conn = sqlite3.connect(self.db_path)

        # カーソルオブジェクトを取得
        cursor = conn.cursor()

        # timestampの取得
        timestamp = datetime.datetime.now()

        # INSERTクエリ
        cursor.execute("INSERT INTO reactions (reaction_speed, timestamp) VALUES (?, ?)", (reaction_speed, timestamp))
        conn.commit()

        # コミットとクローズ
        cursor.close()
        conn.close()

    def get_all_data(self):
        # データベースに接続（存在しない場合は自動的に作成されます）
        conn = sqlite3.connect(self.db_path)
        # カーソルオブジェクトを取得
        cursor = conn.cursor()
        # 直近 1 時間のデータを取得
        cursor.execute("""SELECT * FROM reactions""")
        rows = cursor.fetchall()

        # コミットとクローズ
        cursor.close()
        conn.close()

        print([row[1] for row in rows])

        return [row[1] for row in rows]

    def get_recent_data(self, hours=1):
        # データベースに接続（存在しない場合は自動的に作成されます）
        conn = sqlite3.connect(self.db_path)
        # カーソルオブジェクトを取得
        cursor = conn.cursor()
        # 直近 1 時間のデータを取得
        cursor.execute(
            f"""
            SELECT * FROM reactions
            WHERE timestamp >= DATETIME('now', '-{hours} hour')
        """
        )
        rows = cursor.fetchall()

        # コミットとクローズ
        cursor.close()
        conn.close()

        return [row[1] for row in rows]


if __name__ == "__main__":
    database = DataBase("./data/ReactionSpeed.db")
    database.insert_output(0.600)
    rows = database.get_recent_data(hours=1)
    print(rows)
