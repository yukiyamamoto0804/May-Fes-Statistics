import React, { useEffect, useRef, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./App.css";

const HOST_URL = "http://localhost:8888";

function App() {
  const [gameState, setGameState] = useState("init"); // 状態: init, waiting, ready, interrupt, result, next
  const [playState, setPlayState] = useState("init"); // プレイ状態: init, practice, test
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("red");
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState([]);
  const timeoutId = useRef(null);
  const [showPopup1, setShowPopup1] = useState(false); // ポップアップの表示状態
  const [showPopup2, setShowPopup2] = useState(false); // ポップアップの表示状態
  const [storeData, setStoreData] = useState([]);
  const [histData, setHistData] = useState(null);
  const [selected, setSelected] = useState("test1");
  const [additionalInfo, setAdditionalInfo] = useState([])

  const gameEpochSize = 5;

  // スタートボタンの処理
  const startGame = (newPlayState) => {
    if (gameState === "interrupt") {
      return; // すでにタイマーが設定されている場合、処理を中断
    }
    if (reactionTime.length === gameEpochSize) {
      setReactionTime([]);
    }

    setPlayState(newPlayState)
    setGameState("waiting");
    setMessage("");
    setShowPopup1(true); // ポップアップを非表示

    const randomDelay = Math.floor(Math.random() * 4000) + 1000; // 1～5秒後
    timeoutId.current = setTimeout(() => {
      setGameState("ready");
      if (selected === "test1") {
        setMessage("あ");
        setAdditionalInfo([...additionalInfo, {}])
      } else if (selected === "test2" || selected === "test3") {
        let message = Math.random() < 0.5 ? "あか" : "あお";
        setMessage(message);
        let color = Math.random() < 0.5 ? "red" : "blue"
        setColor(color);
        setAdditionalInfo([...additionalInfo, {"color": color, "text": message}])
      } else {
        console.error("unexpected selected");
      }
      setStartTime(Date.now());
    }, randomDelay);
  };

  const sendData = () => {
    console.log({ start_time: startTime, reaction_speed: reactionTime, test_type : selected, additional_info : additionalInfo });
    fetch(`${HOST_URL}/api/set-data`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ start_time: startTime, reaction_speed: reactionTime, test_type : selected, additional_info : additionalInfo })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error("Error:", error));
  }

  const getData = () => {
    fetch(`${HOST_URL}/api/get-data`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ reaction_speed: null })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      setStoreData(data.data[selected]);
      setHistData(generateHistogramData(data.data[selected]));
    })
    .catch(error => console.error("Error:", error));
  }

  const finishGame = () => {
    const endTime = Date.now();
    setGameState("next");
    setReactionTime([...reactionTime, endTime - startTime]);
    if (timeoutId.current) {
      clearTimeout(timeoutId.current); // タイマーのクリア
      timeoutId.current = null; // timeoutIdをnullに設定
    }
  }

  const interruptGame = () => {
    console.log(timeoutId.current);
    setShowPopup1(false); // ポップアップを非表示
    setShowPopup2(true); // ポップアップを非表示
    setGameState("interrupt");
    setPlayState("init");
    if (timeoutId.current) {
      clearTimeout(timeoutId.current); // タイマーのクリア
      timeoutId.current = null; // timeoutIdをnullに設定
      // setShowPopup(false); // ポップアップを非表示
    }
    setReactionTime([]);
    setAdditionalInfo([]);
  }

  useEffect(() => {
    if (reactionTime.length === gameEpochSize) {
      setShowPopup1(false); // ポップアップを非表示
      if (playState === "test") {
        sendData();
        setGameState("result");
      } else {
        setGameState("init");
      }
      setPlayState("init");
      setAdditionalInfo([]);
    }
  }, [reactionTime])

  // Enterキーの処理
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (gameState === "next") {
        startGame(playState);
      } else if (selected === "test1") {
        if (event.key === "Enter" && gameState === "ready") {
          finishGame();
        }
        if (event.key === "Enter" && gameState === "waiting") {
          interruptGame();
        }
      } else if (selected === "test2") {
        if (event.key === "f" || event.key === "j") {
          if (color === "blue" && event.key === "f" && gameState === "ready") {
            finishGame();
          } else if (color === "red" && event.key === "j" && gameState === "ready") {
            finishGame();
          }else {
            interruptGame();
          }
        }
      } else if (selected === "test3") {
        if (event.key === "f" || event.key === "j") {
          if (message === "あお" && event.key === "f" && gameState === "ready") {
            finishGame();
          } else if (message === "あか" && event.key === "j" && gameState === "ready") {
            finishGame();
          }else {
            interruptGame();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, startTime]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>反応速度統計</h1>
      <div className="project-description">
        <h3>企画説明</h3>
        <p>統計分析手法の基礎的なものに「推定」と「検定」があります。<br></br>
          ここでは、来場者の皆様から集めたデータを用いて、実際に「推定」と「検定」を行います。<br></br>
          「応物の散歩道」にて、その背景に基づく理論を解説しております。</p>
        <p>分析データとして、反射神経のデータを収集します。<br></br>ここでは3種類のテストを行い、適切なキーが押されるまでの時間（反応速度）を収集します。</p>
        <p>それぞれのテストは5回連続で正解したら結果が記録されます。</p>
      </div>
      <h2>テストの選択</h2>
      <div className="radio-group">
        <input
          type="radio"
          id="test1"
          name="options"
          value="test1"
          checked={selected === "test1"}
          onChange={(e) => setSelected(e.target.value)}
        />
        <label htmlFor="test1">テスト1</label>

        <input
          type="radio"
          id="test2"
          name="options"
          value="test2"
          checked={selected === "test2"}
          onChange={(e) => setSelected(e.target.value)}
        />
        <label htmlFor="test2">テスト2</label>

        <input
          type="radio"
          id="test3"
          name="options"
          value="test3"
          checked={selected === "test3"}
          onChange={(e) => setSelected(e.target.value)}
        />
        <label htmlFor="test3">テスト3</label>
      </div>
      <div className="test-description">
        <h3>テスト内容</h3>
        <div className="test-instruction">
          <p>
            {selected === "test1" ? "文字が出たらEnterキーを押してください" : (
              selected === "test2" ? "青色の文字が出たら「F」を、赤色の文字が出たら「J」を押してください" :
              "「あお」と書かれた文字が出たら「F」を、「あか」と書かれた文字が出たら「J」を押してください"
            )}
          </p>
        </div>
      </div>
      <h2>テスト開始</h2>
      <p>「スタート」または「練習」を押して下さい</p>
      <button className="game-button" onClick={() => startGame("test")} disabled={gameState === "ready"}>
        スタート
      </button>
      <button className="game-button" onClick={() => startGame("practice")} disabled={gameState === "ready"}>
        練習
      </button>
      <button className="game-button" onClick={getData} disabled={gameState === "ready" || gameState === "waiting"}>
        データを見る
      </button>
      {reactionTime !== null && <p>あなたの反応時間: {reactionTime.join(', ')} ms</p>}
      {storeData.length > 0 && (
        <div className="hist">
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
      {showPopup1 && (
        <div className="popup-overlay">
          <div className="popup-content">
            {
              gameState === "next" ?
              <div>
                <p className="instruction instruction1">「次へ」ボタンまたはEnterキーを押してください</p>
                <p className="message"><button onClick={() => startGame(playState)}>次へ</button></p>
              </div> :
              (selected === "test1" ? 
              <div>
                <p className="instruction instruction1">文字が出たらEnterキーを押してください！</p>
                <h2 className="message">{message}</h2>
              </div> :
              (selected === "test2" ? 
              <div>
                <p className="instruction instruction2">青色の文字が出たら「F」を、赤色の文字が出たら「J」を押してください！</p>
                <h2 className="message" style={{ color }}>{message}</h2>
              </div> :
              <div>
                <p className="instruction instruction3">「あお」と書かれた文字が出たら「F」を、「あか」と書かれた文字が出たら「J」を押してください！</p>
                <h2 className="message" style={{ color }}>{message}</h2>
              </div>
              ))
            }
          </div>
        </div>
      )}
      {showPopup2 && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="center">
              <p>間違えた入力により中断されました。</p>
              <p>もう一度試してください。</p>
              <p><button onClick={() => {setShowPopup2(false);setGameState("init");}} disabled={gameState === "ready"}>OK</button></p>
            </div>
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
  const maxTime = 1500;
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