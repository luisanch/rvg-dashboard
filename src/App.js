import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Sidenav from "./Components/Sidenav";
import Explore from "./Pages/Explore";
import Home from "./Pages/Home";
import Settings from "./Pages/Settings";
import Statistics from "./Pages/Statistics";
import useWebSocket , { ReadyState }from "react-use-websocket";
import React, { useState, useCallback, useEffect } from 'react';

const WS_URL = "ws://127.0.0.1:8000";

function App() {
  const [socketUrl, setSocketUrl] = useState(WS_URL);
  const [messageHistory, setMessageHistory] = useState([]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    share: true,
    filter: isDataIn
  });

  function isDataIn(message) {
    let evt = JSON.parse(message.data);
    return evt.type === 'datain';
  }
  
  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(
        parseDataIn(JSON.parse(lastMessage.data).data)
      ));
      console.log(JSON.stringify(messageHistory, null, 2))
    }
  }, [lastMessage, setMessageHistory]);

  function parseDataIn(msgString) {
    const [xpos, ypos, zpos, pitch, yaw, roll] = msgString.split(',').map(element => Number(element))
    return {xpos, ypos, zpos, pitch, yaw, roll}
  }

  // const handleClickChangeSocketUrl = useCallback(
  //   () => setSocketUrl('wss://demos.kaazing.com/echo'),
  //   []
  // );

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
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
