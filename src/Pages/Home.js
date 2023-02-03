import React, { useEffect, useState } from "react"; 
import MyMap from "../Components/dashboard/Map";

export default function Home() { 
 
  return (
    <div>
      <div>what up</div>
      <MyMap />
      <div>Incoming Data: </div>
      <p>{}</p>
    </div>
  );
}
