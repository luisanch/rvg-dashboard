import React, { useEffect, useState } from "react";
import { Map, Marker, Overlay } from "pigeon-maps";
import "./Map.css";
import gunnerus from "../../Assets/ships/gunnerus.svg";
import boat from "../../Assets/ships/boat.svg";
import Markers from "./Markers";

const aisObject = {};

const MyMap = (props) => {
  const data = props.data;
  const markerSize = 20;

  const [mapCenter, setMapCenter] = useState([63.43463, 10.39744]);
  const [gunnerusHeading, setGunnerusHeading] = useState(0);
  const [aisData, setAisData] = useState([]);

  function deg2dec(coord, direction) {
    let dir = 1;
    if (direction === "S" || direction === "W") dir = -1;
    let deg = Math.trunc(coord / 100);
    let dec = (coord / 100 - deg) * (10 / 6);
    return dir * (deg + dec);
  }

  useEffect(() => {
    if (!data) return;
    if (data.message_id === "$GPGGA_ext") {
      setMapCenter(() => {
        const lon = data.lon;
        const lon_dir = data.lon_dir;
        const lat = data.lat;
        const lat_dir = data.lat_dir;
        const res = [deg2dec(lat, lat_dir), deg2dec(lon, lon_dir)];
        return res;
      });
    }

    if (data.message_id === "$PSIMSNS_ext") {
      setGunnerusHeading(data.head_deg);
    }

    if (data.message_id.indexOf("!AI") === 0) {
      aisObject[data.message_id] = data;
    }
  }, [data, setMapCenter, setGunnerusHeading]);

  useEffect(() => {
    const interval = setInterval(
      () =>
        setAisData(() => {
          return Object.values(aisObject);
        }),
      1000
    );
    return () => {
      clearInterval(interval);
    };
  }, []);

  const listMarkers = aisData.map((ais) => (
    <Marker
      key={ais.mmsi}
      color="green"
      width={markerSize}
      anchor={[Number(ais.lat), Number(ais.lon)]}
    />
  ));

  const listOverlays = aisData.map((ais) => (
    <Overlay key={'1'+String(ais.mmsi)}  anchor={[Number(ais.lat), Number(ais.lon)]} offset={[16, 44]}>
      <img className="overlay" src={boat} style={{ transform: `rotate(${ais.heading}deg)` }}/>
    </Overlay>
  ));

  return (
    <div className="map">
      <Map defaultCenter={mapCenter} defaultZoom={15} center={mapCenter}>
      {listOverlays}
      {listMarkers}
        <Overlay anchor={mapCenter} offset={[16, 44]}>
          <img className="overlay" src={gunnerus} style={{ transform: `rotate(${gunnerusHeading}deg)` }} />
        </Overlay>
        <Marker key={0} color="red" width={markerSize} anchor={mapCenter} />
      </Map>
    </div>
  );
};

export default MyMap;
