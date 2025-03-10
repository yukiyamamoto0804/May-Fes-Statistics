from database import DataBase
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})


@app.route("/api/set-data", methods=["POST"])
def set_data():
    try:
        # JSON データの取得
        data = request.get_json()
        reaction_speed = data.get("reaction_speed")

        if reaction_speed is None:
            return jsonify({"error": "reaction_speed is required"}), 400

        # データベースに保存
        database.insert_output(reaction_speed)

        return jsonify({"message": "Data saved successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/get-data", methods=["POST"])
def get_data():
    try:
        # JSON データの取得
        data = request.get_json()
        get_hours = data.get("get_hours")

        if get_hours is None:
            data = database.get_all_data()
            return jsonify({"message": "Data saved successfully", "data": data}), 202
        data = database.get_recent_data(hours=get_hours)
        return jsonify({"message": "Data saved successfully", "data": data}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    database = DataBase("./data/ReactionSpeed.db")
    app.run(host="0.0.0.0", port=8888, debug=True)
