from flask import Flask, jsonify, request
from flask_cors import CORS
from csv_data_saver import CsvDataSaver
from spreadSheet import SpreadSheet

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})


@app.route("/api/set-data", methods=["POST"])
def set_data():
    try:
        # JSON データの取得
        data = request.get_json()
        reaction_speed = data.get("reaction_speed")
        test_type = data.get("test_type")
        additional_info = data.get("additional_info")

        if reaction_speed is None or test_type is None:
            return jsonify({"error": "Both reaction_speed and test_type is required"}), 400

        # データベースに保存
        spreadSheet.insert(test_type, reaction_speed, additional_info=additional_info)

        return jsonify({"message": "Data saved successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/get-data", methods=["POST"])
def get_react_speed():
    try:
        df_data = spreadSheet.get_data()
        data = {}
        for key, df in df_data.items():
            data[key] = df["反応速度"].to_list()
        return jsonify({"message": "Data extracted successfully", "data": data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # spreadSheet = SpreadSheet()
    spreadSheet = CsvDataSaver()
    app.run(host="0.0.0.0", port=8888, debug=True)
