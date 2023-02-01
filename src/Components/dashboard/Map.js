import React from "react";
import { Map, Marker } from "pigeon-maps";
import "./Map.css";

const MyMap = () => {
  return (
    <div className="map">
      <Map defaultCenter={[63.43463, 10,39744]} defaultZoom={11}>
        <Marker width={50} anchor={[63.43463, 10,39744]} />
      </Map>
    </div>
  );
};

export default MyMap;
