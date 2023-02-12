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
let messageHistory = [];

function App() {
  const filters = ["$GPGGA_ext", "$PSIMSNS_ext"];
  const maxBufferLength = 60;

  const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    filter: isDataIn,
  });

  function isDataIn(message) {
    let evt = JSON.parse(message.data);
    return evt.type === "datain";
  }

  useEffect(() => {
    if (lastMessage !== null) {
      let newMsg = parseDataIn(lastMessage.data);
      if (newMsg === null) return;
      messageHistory.push(newMsg);
      if (messageHistory.length > maxBufferLength) {
        messageHistory.shift();
      }
    }
  }, [lastMessage, messageHistory]);

  function parseDataIn(msgString) {
    const msg = JSON.parse(msgString).data;
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
          <Route path="/" element={<Home data={messageHistory[messageHistory.length - 1]} />} />
          <Route path="/explore" element={<Explore />} />
          <Route
            path="/statistics"
            element={
              <Statistics
                data={messageHistory[messageHistory.length - 1]}
                maxBufferLength={maxBufferLength}
              />
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
