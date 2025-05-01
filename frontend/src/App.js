import React, { useEffect, useRef, useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import "./App.css";
import CheckboxGroup from "./components/checkboxGroup";
import FunctionChartNormal from "./components/functionChartNormal";

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
  const [showPopup3, setShowPopup3] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [storeData, setStoreData] = useState({});
  const [histData, setHistData] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});
  const [selected, setSelected] = useState("test1");
  const [additionalInfo, setAdditionalInfo] = useState([])
  const [checkboxState, setCheckboxStateState] = useState({
    テスト1: true,
    テスト2: true,
    テスト3: true,
  });

  const handleChange = (key) => {
    const currentValue = checkboxState[key];
    const newState = { ...checkboxState, [key]: !currentValue };

    // チェックを外す場合、他に true が1つもなければブロック
    const selectedCount = Object.values(checkboxState).filter(Boolean).length;
    if (currentValue === true && selectedCount === 1) {
      // 最後の true を外そうとしている → 無視
      return;
    }

    setCheckboxStateState(newState);
  };

  const gameEpochSize = 5;

  const testNameMap = {
    "test1": "テスト１",
    "test2": "テスト２",
    "test3": "テスト３"
  }
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  // スタートボタンの処理
  const startGame = (newPlayState) => {
    console.log("b")
    if (gameState === "interrupt") {
      console.log("a");
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
    .then(data => {console.log(data);getData();})
    .catch(error => {console.error("Error:", error);alert("データ送信に失敗しました");});
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
      setStoreData(data.data);
      setHistData(generateHistogramData(data.data));
      setAnalysisResults(data.analysis_results);
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
      setShowPopup3(true);
      if (playState === "test") {
        sendData();
        setGameState("result");
      } else {
        getData();
        setGameState("result");
      }
      setPlayState("init");
      setAdditionalInfo([]);
    }
  }, [reactionTime])

  // Enterキーの処理
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (gameState === "next") {
        console.log("Game Start");
        startGame(playState);
      } else if (showPopup2) {
        console.log(gameState);
        setShowPopup2(false);
        setGameState("init");
      } else if (showPopup3) {
        setShowPopup3(false);
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
      <h1>一瞬の勝負！反射神経テスト</h1>
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
      <button className="game-button" onClick={() => startGame("test")} disabled={gameState !== "init" && gameState !== "result"}>
        スタート
      </button>
      <button className="game-button" onClick={() => startGame("practice")} disabled={gameState !== "init" && gameState !== "result"}>
        練習
      </button>
      <button className="game-button" onClick={() => {setShowResult(true);getData();}} disabled={gameState !== "init" && gameState !== "result"}>
        データを見る
      </button>
      {reactionTime.length !== 0 && <h3>あなたの反応時間: {reactionTime.join(', ')} ms</h3>}
      {showResult && Object.keys(storeData).length > 0 && Object.keys(histData).length > 0 && (
        <div>
          <h1>データ分析結果</h1>
        {storeData[selected].length > 0 && (histData.length > 0 && (
          <div className="hist">
            <h2>過去の反応時間ヒストグラム</h2>
            <div className="result-description">
              <p>集めたデータをヒストグラムとして表しています。</p>
              <p>チェックボックスの設定を変えることで特定のテスト結果のみを表示させられます。</p>
            </div>
            <CheckboxGroup state={checkboxState} handleChange={handleChange}></CheckboxGroup>
            <ResponsiveContainer width="80%" height={300}>
              <BarChart data={histData}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                {checkboxState.テスト1 && <Bar dataKey={"test1"} fill="#ff0000" />}
                {checkboxState.テスト2 && <Bar dataKey={"test2"} fill="#0000ff" />}
                {checkboxState.テスト3 && <Bar dataKey={"test3"} fill="#009879" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
        <h2>反応速度の平均値</h2>
        <div className="result-description">
          <p>外れ値の影響を少なくするために、5回の中央値を個人の代表値として考え、その平均値を計算しています。</p>
        </div>
        <table className="styled-table">
          <thead>
            <tr>
              <th>テストの種類</th>
              <th>テスト１</th>
              <th>テスト２</th>
              <th>テスト３</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>反応速度の平均値(ms)</td>
              <td>{analysisResults.mean_reaction_speed.test1}</td>
              <td>{analysisResults.mean_reaction_speed.test2}</td>
              <td>{analysisResults.mean_reaction_speed.test3}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ width: "70%", margin: "0 auto", paddingTop: "30px" }}>
          <h2>反応速度の個人差の分布</h2>
          <div className="result-description">
            <p>個人の代表値(5回の中央値)は正規分布に従うと仮定して、その分布を最尤推定で計算しています。</p>
          </div>
          <FunctionChartNormal 
            mu1={analysisResults.distribution.test1.mu}
            sigma1={analysisResults.distribution.test1.sigma}
            mu2={analysisResults.distribution.test2.mu}
            sigma2={analysisResults.distribution.test2.sigma}
            mu3={analysisResults.distribution.test3.mu}
            sigma3={analysisResults.distribution.test3.sigma}
          />
        </div>
        <h3>分布の最尤推定量</h3>
        <table className="styled-table">
          <thead>
            <tr>
              <th>テストの種類</th>
              <th>テスト１</th>
              <th>テスト２</th>
              <th>テスト３</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>平均値（μ）</td>
              <td>{analysisResults.distribution.test1.mu}</td>
              <td>{analysisResults.distribution.test2.mu}</td>
              <td>{analysisResults.distribution.test3.mu}</td>
            </tr>
            <tr>
              <td>分散（σ²）</td>
              <td>{analysisResults.distribution.test1.sigma}</td>
              <td>{analysisResults.distribution.test2.sigma}</td>
              <td>{analysisResults.distribution.test3.sigma}</td>
            </tr>
          </tbody>
        </table>
        {/* <div style={{ width: "80%", margin: "0 auto", paddingTop: "30px" }}>
          <h2>反応速度の個人内のばらつき</h2>
          <FunctionChartLinear 
            coef1={analysisResults.distribution.test1.coef}
            intercept1={analysisResults.distribution.test1.intercept}
            coef2={analysisResults.distribution.test2.coef}
            intercept2={analysisResults.distribution.test2.intercept}
            coef3={analysisResults.distribution.test3.coef}
            intercept3={analysisResults.distribution.test3.intercept}
          />
        </div> */}
        <h2>分布が等しいかどうかの検定</h2>
        <div className="result-description">
          <p>異なる２つのテストのペアに対して、以下のように帰無仮説と対立仮説を定めます。</p>
          <p>帰無仮説：平均(μ)と分散(σ²)が等しい</p>
          <p>対立仮説：平均(μ)と分散(σ²)が異なる</p>
          <p>尤度比検定を行い、平均(μ)と分散(σ²)が異なるかどうかを確認しています。</p>
        </div>
        <table className="styled-table">
          <thead>
            <tr>
              <th>テストの種類</th>
              <th>テスト１,テスト２</th>
              <th>テスト２,テスト３</th>
              <th>テスト３,テスト１</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>p値</td>
              <td>{formatter.format(analysisResults.likelihood_ratio_test[0].p_value)}</td>
              <td>{formatter.format(analysisResults.likelihood_ratio_test[1].p_value)}</td>
              <td>{formatter.format(analysisResults.likelihood_ratio_test[2].p_value)}</td>
            </tr>
            <tr>
              <td>有意水準0.05の検定結果</td>
              <td>{analysisResults.likelihood_ratio_test[0].p_value > 0.05 ? "分布が異なるとはいえない" : "分布が異なる"}</td>
              <td>{analysisResults.likelihood_ratio_test[1].p_value > 0.05 ? "分布が異なるとはいえない" : "分布が異なる"}</td>
              <td>{analysisResults.likelihood_ratio_test[2].p_value > 0.05 ? "分布が異なるとはいえない" : "分布が異なる"}</td>
            </tr>
          </tbody>
        </table>
        <h2>文字の色・内容によって反応速度に違いが見られるかどうかを検定</h2>
        <div className="result-description">
          <p>テスト２・テスト３の結果から、色や内容が異なるときに反応速度の平均に有意差が見られるかどうかを検定しています。</p>
          <p>個人差の影響を無視するために、それぞれのデータを標準化した<br></br>「（データ - 個人の平均）/ 個人の標準偏差」<br></br>の値を分析しています。</p>
          <p>色や文字の条件でデータを２つのグループに分割し、それぞれは分散が等しい正規分布に従うと仮定します。<br></br>このとき、以下のように帰無仮説と対立仮説を定めます。</p>
          <p>帰無仮説：平均(μ)が等しい</p>
          <p>対立仮説：平均(μ)が異なる</p>
          <p>尤度比検定を行い、平均(μ)が異なるかどうかを確認しています。</p>
        </div>
        <div style={{ width: "80%", margin: "0 auto", paddingTop: "30px" }}>
          <h2>テスト２の色による違い</h2>
          {generateHistogramDataColor(
            analysisResults.stroop_test.test2_color.red_values,
            analysisResults.stroop_test.test2_color.blue_values,
            "赤色",
            "青色",
            "rgba(255,0,0,1)",
            "rgba(0,0,255,1)",
          )}
        </div>
        <div style={{ width: "80%", margin: "0 auto", paddingTop: "30px" }}>
          <h2>テスト３の文字による違い</h2>
          {generateHistogramDataColor(
            analysisResults.stroop_test.test3_text.red_values,
            analysisResults.stroop_test.test3_text.blue_values,
            "あか",
            "あお",
            "rgba(255,0,0,1)",
            "rgba(0,0,255,1)",
          )}
        </div>
        <div style={{ width: "80%", margin: "0 auto", paddingTop: "30px" }}>
          <h2>テスト３の文字と色の一致・不一致の違い</h2>
          {generateHistogramDataColor(
            analysisResults.stroop_test.test3_stroop.equal_group_values,
            analysisResults.stroop_test.test3_stroop.different_group_values,
            "一致",
            "不一致",
            "rgba(255,125,0,1)",
            "rgba(0,128,0,1)",
          )}
        </div>
        <h2>色や文字の違いによって平均が異なるかの検定</h2>
        <table className="styled-table">
          <thead>
            <tr>
              <th>分析対象</th>
              <th>テスト２の色の違い</th>
              <th>テスト３の文字の違い</th>
              <th>テスト３の文字と色の一致・不一致</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>p値</td>
              <td>{formatter.format(analysisResults.stroop_test.test2_color.p_value)}</td>
              <td>{formatter.format(analysisResults.stroop_test.test3_text.p_value)}</td>
              <td>{formatter.format(analysisResults.stroop_test.test3_stroop.p_value)}</td>
            </tr>
            <tr>
              <td>有意水準0.05の検定結果</td>
              <td>{analysisResults.stroop_test.test2_color.p_value > 0.05 ? "平均が異なるとはいえない" : "平均が異なる"}</td>
              <td>{analysisResults.stroop_test.test3_text.p_value > 0.05 ? "平均が異なるとはいえない" : "平均が異なる"}</td>
              <td>{analysisResults.stroop_test.test3_stroop.p_value > 0.05 ? "平均が異なるとはいえない" : "平均が異なる"}</td>
            </tr>
          </tbody>
        </table>
        </div>
      )}
      {showPopup1 && (
        <div className="popup-overlay">
          <div className="popup-content">
            {
              gameState === "next" ?
              <div>
                <p className="instruction instruction1">「次へ」ボタン、「Enter」、「F」、「J」の<br></br>いずれかを押してください</p>
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
              <p><button onClick={() => {setShowPopup2(false);setGameState("init");}}>OK</button></p>
            </div>
          </div>
        </div>
      )}
      {showPopup3 && (
        <div className="popup-overlay">
        <div className="popup-content">
          <div className="center">
            <p>あなたの反応時間結果</p>
            <p>{reactionTime.join(', ')} ms</p>
            <p><button onClick={() => {setShowPopup3(false);}}>OK</button></p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default App;

// ヒストグラムデータを作成する関数
function generateHistogramData(datas) {
  const minTime = 0;
  const maxTime = 1500;
  const binSize = 25; // 50msごとの範囲
  const bins = Math.ceil((maxTime - minTime) / binSize) + 1;

  const histogram = Array.from({ length: bins }, (_, i) => ({
    range: `${minTime + i * binSize}-${minTime + (i + 1) * binSize}ms`,
    test1: 0,
    test2: 0,
    test3: 0
  }));

  for (const key of Object.keys(datas)) {
    const data = datas[key];
    if (!Array.isArray(data) || data.length === 0) {
      continue; // 空配列として返す
    }
    data.forEach((value) => {
      const index = Math.floor((value - minTime) / binSize);
      if (histogram[index]) histogram[index][key] += 1;
    });
  }
  return histogram;
}

function generateHistogramDataColor(red_values, blue_values, red_name, blue_name, color1, color2, binSize = 0.2, minTime = -2.5, maxTime = 2.5) {
  const numBins = Math.ceil((maxTime - minTime) / binSize);

  if (!Array.isArray(red_values) || red_values.length === 0) {
    return []; // 空配列として返す
  }
  if (!Array.isArray(blue_values) || blue_values.length === 0) {
    return []; // 空配列として返す
  }

  // ヒストグラムの初期化
  const histogram = Array.from({ length: numBins }, (_, i) => {
    const start = Math.round((minTime + i * binSize) * 100) / 100;
    const end = Math.round((start + binSize) * 100) / 100;
    return {
      range: `${start} ~ ${end}`,
      count1: 0,
      count2: 0, 
    };
  });

  // 各値を対応するビンにカウント
  red_values.forEach((value) => {
    if (value < minTime || value > maxTime) return; // 範囲外はスキップ
    const index = Math.min(Math.floor((value - minTime) / binSize), numBins - 1);
    histogram[index].count1 += 1;
  });
  // 各値を対応するビンにカウント
  blue_values.forEach((value) => {
    if (value < minTime || value > maxTime) return; // 範囲外はスキップ
    const index = Math.min(Math.floor((value - minTime) / binSize), numBins - 1);
    histogram[index].count2 += 1;
  });

  return (
    <div className="hist">
    <ResponsiveContainer width="80%" height={300}>
      <BarChart data={histogram}>
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count1" fill={color1} name={red_name} />
        <Bar dataKey="count2" fill={color2} name={blue_name} />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}
