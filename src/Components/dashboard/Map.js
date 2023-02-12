import React from "react";
import { Map, Marker } from "pigeon-maps";
import "./Map.css";

const MyMap = (props) => {
  const mapCenter = props.mapCenter
  return (
    <div className="map">
      <Map defaultCenter={mapCenter} defaultZoom={11}>
        <Marker width={50} anchor={mapCenter} />
      </Map>
    </div>
  );
};

export default MyMap;
