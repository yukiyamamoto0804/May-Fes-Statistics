import React, { useEffect, useRef, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./App.css";

const HOST_URL = "http://localhost:8888";

function App() {
  const [gameState, setGameState] = useState("waiting"); // 状態: waiting, ready, result
  const [message, setMessage] = useState("スタートボタンを押して下さい");
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const timeoutId = useRef(null);
  const [showPopup, setShowPopup] = useState(false); // ポップアップの表示状態
  const [storeData, setStoreData] = useState([]);
  const [histData, setHistData] = useState(null);

  // スタートボタンの処理
  const startGame = () => {
    if (timeoutId.current) {
      return; // すでにタイマーが設定されている場合、処理を中断
    }

    setGameState("waiting");
    setMessage("");
    setReactionTime(null);
    setShowPopup(true); // ポップアップを非表示

    const randomDelay = Math.floor(Math.random() * 4000) + 1000; // 1～5秒後
    timeoutId.current = setTimeout(() => {
      setGameState("ready");
      setMessage("あ");
      setStartTime(Date.now());
    }, randomDelay);
  };

  const sendData = (reactionSpeed) => {
    fetch("http://localhost:8888/api/set-data", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ start_time: startTime, reaction_speed: reactionSpeed })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error("Error:", error));
  }

  const getData = () => {
    fetch("http://localhost:8888/api/get-data", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ reaction_speed: null })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      setStoreData(data.data);
      setHistData(generateHistogramData(data.data));
    })
    .catch(error => console.error("Error:", error));
  }

  // Enterキーの処理
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Enter" && gameState === "ready") {
        const endTime = Date.now();
        setReactionTime(endTime - startTime);
        setGameState("result");
        setMessage(`反応時間: ${endTime - startTime}ms`);
        setShowPopup(false); // ポップアップを非表示
        sendData(endTime - startTime);
        if (timeoutId.current) {
          clearTimeout(timeoutId.current); // タイマーのクリア
          timeoutId.current = null; // timeoutIdをnullに設定
        }
      }
      if (event.key === "Enter" && gameState === "waiting") {
        console.log(timeoutId.current);
        if (timeoutId.current) {
          clearTimeout(timeoutId.current); // タイマーのクリア
          timeoutId.current = null; // timeoutIdをnullに設定
          // setShowPopup(false); // ポップアップを非表示
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, startTime]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>反応速度統計</h1>
      <p>スタートボタンを押して下さい</p>
      <button onClick={startGame} disabled={gameState === "ready"}>
        スタート
      </button>
      <button onClick={getData} disabled={gameState === "ready" || gameState === "waiting"}>
        データを見る
      </button>
      {reactionTime !== null && <p>あなたの反応時間: {reactionTime} ms</p>}
      {storeData.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h2>過去の反応時間ヒストグラム</h2>
          <ResponsiveContainer width="80%" height={300}>
            <BarChart data={histData}>
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p className="instruction">文字が出たらEnterキーを押してください！</p>
            <h2 className="message">{message}</h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

// ヒストグラムデータを作成する関数
function generateHistogramData(data) {
  if (data.length === 0) return [];

  const minTime = 0;
  const maxTime = 1000;
  const binSize = 20; // 50msごとの範囲
  const bins = Math.ceil((maxTime - minTime) / binSize) + 1;

  const histogram = Array.from({ length: bins }, (_, i) => ({
    range: `${minTime + i * binSize}-${minTime + (i + 1) * binSize}ms`,
    count: 0,
  }));

  data.forEach((value) => {
    const index = Math.floor((value - minTime) / binSize);
    if (histogram[index]) histogram[index].count += 1;
  });

  return histogram;
}