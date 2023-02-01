import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import MyMap from "../Components/dashboard/Map";

const ENDPOINT = "http://fagitrelay.it.ntnu.no";

export default function Home() {
  const [response, setResponse] = useState("");

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    socket.on("FromAPI", (data) => {
      setResponse(data);
    });
  }, []);
    
  return (
    <div>
      <div>what up</div>
      <MyMap />
      <div>Incoming Data: </div>
      <p>{response}</p>
    </div>
  );
}
