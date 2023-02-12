import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Sidenav from "./Components/Sidenav";
import Explore from "./Pages/Explore";
import Home from "./Pages/Home";
import Settings from "./Pages/Settings";
import Statistics from "./Pages/Statistics";
import useWebSocket, { ReadyState } from "react-use-websocket";
import React, { useState, useCallback, useEffect } from "react";

const WS_URL = "ws://127.0.0.1:8000";

function App() {
  const [socketUrl, setSocketUrl] = useState(WS_URL);
  const [messageHistory, setMessageHistory] = useState([]);

  let filters = ["$GPGBS_ext", "$PSIMSNS_ext"];
  const maxBufferLength = 100;

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    share: true,
    filter: isDataIn,
  });

  function isDataIn(message) {
    let evt = JSON.parse(message.data);
    return evt.type === "datain";
  }

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => {
        let newMsg = parseDataIn(lastMessage.data)
        let history = newMsg == null ? prev : prev.concat(newMsg);
        if (history.length > maxBufferLength) {
          return history.slice(1)
        } else {
          return history
        }
      });
      console.log(JSON.stringify(messageHistory, null, 2));
    }
  }, [lastMessage, setMessageHistory]);

  function parseDataIn(msgString) {
     const msg = JSON.parse(msgString).data;
    console.log(msg.message_id);
    if (filters.includes(msg.message_id)) {
      return msg;
    } else {
      return null;
    }
  }

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
    <div className="App">
      <Sidenav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
