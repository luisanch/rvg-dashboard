import React, { useEffect, useState } from "react";
import { Map, Marker, Overlay, GeoJson, Draggable } from "pigeon-maps";
import "./Map.css";
import gunnerus from "../../Assets/ships/gunnerus.svg";
import boat from "../../Assets/ships/boat.svg";
import course from "../../Assets/ships/course.svg";
import Markers from "./Markers";

const aisObject = {};

const MyMap = (props) => {
  const data = props.data;
  const markerSize = 20;

  const [mapCenter, setMapCenter] = useState([63.43463, 10.39744]);
  const [gunnerusHeading, setGunnerusHeading] = useState(0);
  const [aisData, setAisData] = useState([]);
  const [anchor, setAnchor] = useState([63.43463, 10.39744]);
  const [tipText, setTipText] = useState("");
  const [intersects, setintersects] = useState([])

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

    if (data.message_id.indexOf("intersects") === 0) {
      console.log(JSON.stringify(data.intersects, null, 2))
      setintersects(data.intersects);
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

  const listMarkers = aisData.map((ais) => {
    if (isNaN(Number(ais.lat)) || isNaN(Number(ais.lon))) return null;

    return (
      <Marker
        key={ais.mmsi}
        color="green"
        width={markerSize}
        onClick={() => setTipText(JSON.stringify(ais, null, 2))}
        anchor={[Number(ais.lat), Number(ais.lon)]}
      />
    );
  });

  const listOverlays = aisData.map((ais) => {
    if (isNaN(Number(ais.lat)) || isNaN(Number(ais.lon))) return null;

    return (
      <Overlay
        key={"1" + String(ais.mmsi)}
        anchor={[Number(ais.lat), Number(ais.lon)]}
        offset={[16, 44]}
      >
        <img
          className="overlay"
          src={boat}
          style={{ transform: `rotate(${ais.heading}deg)` }}
        />
      </Overlay>
    );
  });

  const listCourses = aisData.map((ais) => {
    if (isNaN(Number(ais.lat)) || isNaN(Number(ais.lon))
      || ais.speed === 0 || !ais.hasOwnProperty('course')
      || !ais.hasOwnProperty('speed')) return null;

    return (
      <Overlay
        key={"3" + String(ais.mmsi)}
        anchor={[Number(ais.lat), Number(ais.lon)]}
        offset={[80, 150]}
      >
        <img
          className="course"
          src={course}
          style={{ transform: `rotate(${ais.course}deg)` }}
        />
      </Overlay>
    );
  });

  const listPreviousPaths = aisData.map((ais) => {
    if (isNaN(Number(ais.lat)) || isNaN(Number(ais.lon))) return null;

    const geoJsonSample = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: ais.pos_history,
          },
          properties: { prop0: "value0" },
        },
      ],
    };

    // console.log(JSON.stringify(geoJsonSample.features[0].geometry.coordinates, null, 2))

    return (
      <GeoJson
        key={"2" + String(ais.mmsi)}
        data={geoJsonSample}
        styleCallback={(feature, hover) => {
          return {
            fill: "#00000000",
            strokeWidth: "2",
            stroke: "blue",
            r: "20",
          };
        }}
      />
    );
  });

  const listintesects = intersects.map((intersect) => { 

    const geoJsonSample = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [intersect.origin, intersect.target],
          },
          properties: { prop0: "value0" },
        },
      ],
    };

  //  console.log(JSON.stringify(geoJsonSample.features[0].geometry.coordinates, null, 2))

    return (
      <GeoJson
        key={"4" + String(intersect.mmsi)}
        data={geoJsonSample}
        styleCallback={(feature, hover) => {
          return {
            fill: "#00000000",
            strokeWidth: "2",
            stroke: "red",
            r: "20",
          };
        }}
      />
    );
  });

  return (
    <div className="map">
      <Map defaultCenter={mapCenter} defaultZoom={15} center={mapCenter}>
        {listCourses}
        {listOverlays}
        {listMarkers}
        {listPreviousPaths}
        {listintesects}
        <Overlay anchor={mapCenter} offset={[16, 44]}>
          <img
            className="overlay"
            src={gunnerus}
            style={{ transform: `rotate(${gunnerusHeading}deg)` }}
          />
        </Overlay>
        <Marker key={0} color="red" width={markerSize} anchor={mapCenter} />
        <Draggable offset={[60, 87]} anchor={anchor} onDragEnd={setAnchor}>
          <p className="block">{tipText}</p>
        </Draggable>
      </Map>
    </div>
  );
};

export default MyMap;
