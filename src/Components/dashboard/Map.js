import React, { Fragment, useEffect, useState } from "react";
import { Map, Marker, Overlay, GeoJson, Draggable } from "pigeon-maps";
import "./Map.css";
import gunnerus from "../../Assets/ships/gunnerus.svg";
import boat from "../../Assets/ships/boat.svg";
import boat_s from "../../Assets/ships/boat_s.svg"; 

const aisObject = {};

const MyMap = (props) => {
  const data = props.data;
  const markerSize = 20;
  const settings = props.settings;
  const predictedCourseInterval = 60;
  const arpaColor = "black";
  const courseColor = "orange";
  const previousPathColor = "blue";

  const [mapCenter, setMapCenter] = useState([63.43463, 10.39744]);
  const [gunnerusHeading, setGunnerusHeading] = useState(0);
  const [aisData, setAisData] = useState([]);
  const [anchor, setAnchor] = useState([63.43463, 10.39744]);
  const [tipText, setTipText] = useState("");
  const [arpaObject, setArpaObject] = useState([]);
  const [zoomScale, setZoomScale] = useState(1);

  const handleZoomLevel = (event) => {
    const scale = event.zoom / (2 * 18);
    console.log(scale);
    setZoomScale(scale);
  };

  const deg2dec = (coord, direction) => {
    let dir = 1;
    if (direction === "S" || direction === "W") dir = -1;
    let deg = Math.trunc(coord / 100);
    let dec = (coord / 100 - deg) * (10 / 6);
    return dir * (deg + dec);
  };

  var createGeoJSONCircle = function (center, radiusInKm, points) {
    if (!points) points = 64;

    var coords = {
      latitude: center[1],
      longitude: center[0],
    };

    var km = radiusInKm;

    var ret = [];
    var distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    var distanceY = km / 110.574;

    var theta, x, y;
    for (var i = 0; i < points; i++) {
      theta = (i / points) * (2 * Math.PI);
      x = distanceX * Math.cos(theta);
      y = distanceY * Math.sin(theta);

      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return [ret];
  };

  const getGeoLine = (points) => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points,
          },
          properties: { prop0: "value0" },
        },
      ],
    };
  };

  const getGeoCircle = (geoCircle) => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: geoCircle,
          },
          properties: { prop0: "value0" },
        },
      ],
    };
  };

  const getGeoPoint = (coord) => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: coord },
          properties: { prop0: "value0" },
        },
      ],
    };
  };

  const getPredictedCourse = (course, speed, lat, lon) => {
    // lon lat
    const nm_in_deg = 60;
    const intervalInHours = predictedCourseInterval / 3600;
    const courseInRads = course * (Math.PI / 180);
    const d_lon =
      (intervalInHours * speed * Math.sin(courseInRads)) / nm_in_deg;
    const d_lat =
      (intervalInHours * speed * Math.cos(courseInRads)) / nm_in_deg;
    return [lat + d_lat, lon + d_lon];
  };

  useEffect(() => {
    if (!data) return;
    if (data.message_id === "$GPGGA_ext") {
      const lon = data.lon;
      const lon_dir = data.lon_dir;
      const lat = data.lat;
      const lat_dir = data.lat_dir;
      const res = [deg2dec(lat, lat_dir), deg2dec(lon, lon_dir)];
      setMapCenter(res);
      setAnchor(res);
    }

    if (data.message_id === "$PSIMSNS_ext") {
      setGunnerusHeading(data.head_deg);
    }

    if (data.message_id.indexOf("!AI") === 0) {
      // console.log(data);
      aisObject[data.message_id] = data;
    }

    if (data.message_id.indexOf("arpa") === 0) {
      console.log(JSON.stringify(data, null, 2));
      setArpaObject(data.data);
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

  const listVessels = aisData.map((ais) => {
    if (
      isNaN(Number(ais.lat)) ||
      isNaN(Number(ais.lon)) ||
      ais.speed === 0 ||
      !ais.hasOwnProperty("heading") ||
      !ais.hasOwnProperty("speed")
    )
      return null;

    function rotate_heaidng(ais_in) {
      if (ais_in.heading) {
        return ais_in.heading;
      } else {
        return 0;
      }
    }

    return (
      <Overlay
        key={"1" + String(ais.mmsi)}
        anchor={[Number(ais.lat), Number(ais.lon)]}
        offset={[16, 44]}
      >
        <img
          className="overlay"
          src={boat}
          style={{
            transform: `scale(${zoomScale}) rotate(${rotate_heaidng(ais)}deg) `,
          }}
        />
      </Overlay>
    );
  });

  const listCourses = aisData.map((ais) => {
    if (
      isNaN(Number(ais.lat)) ||
      isNaN(Number(ais.lon)) ||
      ais.speed === 0 ||
      !ais.hasOwnProperty("course") ||
      !ais.hasOwnProperty("speed")
    )
      return null;
    const predictedCourse = getPredictedCourse(
      ais.course,
      ais.speed,
      ais.lat,
      ais.lon
    );

    return (
      <GeoJson
        key={"2" + String(ais.mmsi)}
        data={getGeoLine([
          [ais.lon, ais.lat],
          [predictedCourse[1], predictedCourse[0]],
        ])}
        styleCallback={(feature, hover) => {
          return {
            fill: "#00000000",
            strokeWidth: "2",
            stroke: courseColor,
            r: "20",
          };
        }}
      />
    );
  });

  const listPreviousPaths = aisData.map((ais) => {
    if (isNaN(Number(ais.lat)) || isNaN(Number(ais.lon))) return null;

    return (
      <GeoJson
        key={"2" + String(ais.mmsi)}
        data={getGeoLine(ais.pos_history)}
        styleCallback={(feature, hover) => {
          return {
            fill: "#00000000",
            strokeWidth: "1",
            opacity: 0.5,
            stroke: previousPathColor,
            r: "20",
          };
        }}
      />
    );
  });

  const listArpa = arpaObject.map((arpa, index) => {
    if (!settings.showHitbox) return null; 
    

    let cpa = (
      <GeoJson
        key={"0" + index}
        data={getGeoLine([
          [anchor[1], anchor[0]],
          [arpa.lon_at_cpa, arpa.lat_at_cpa], 
          [arpa.lon_o_at_cpa, arpa.lat_o_at_cpa],
          [arpa.lon_o, arpa.lat_o],
        ])}
        styleCallback={(feature, hover) => {
          return {
            fill: "#00000000",
            strokeWidth: "2",
            opacity: 0.2,
            stroke: arpaColor,
            r: "20",
          };
        }}
      />
    );

    let cpa_target_vessel = (
      <Overlay
        key={"4" + index}
        anchor={[arpa.lat_o_at_cpa, arpa.lon_o_at_cpa]}
        offset={[16, 44]}
      >
        <img
          className="overlay"
          src={boat}
          
          style={{
            transform: `scale(${zoomScale}) rotate(${arpa.course}deg) `,
            opacity: 0.5,
          }}
        />
      </Overlay>
    );

    const cpa_self_vessel = (
      <Overlay
        key={"5" + index}
        anchor={[arpa.lat_at_cpa, arpa.lon_at_cpa]}
        offset={[16, 44]}
      >
        <img
          className="overlay"
          src={gunnerus}
          
          style={{
            transform: `scale(${zoomScale}) rotate(${arpa.self_course}deg) `,
            opacity: 0.5,
          }}
        />
      </Overlay>
    );


    if (arpa.safety_params) {
      const geoCircle = createGeoJSONCircle(
        [arpa.lon_o_at_r, arpa.lat_o_at_r],
        arpa.safety_radius / 1000
      );

      let safety_r = (
        <GeoJson
          key={"1" + index}
          data={getGeoCircle(geoCircle)}
          styleCallback={(feature, hover) => {
            return {
              fill: "#00000000",
              strokeWidth: "2",
              opacity: 0.2,
              stroke: arpaColor,
              r: "20",
            };
          }}
        />
      );

      const safety_self_vessel = (
        <Overlay
          key={"6" + index}
          anchor={[arpa.lat_at_r, arpa.lon_at_r]}
          offset={[16, 44]}
        >
          <img
            className="overlay"
            src={boat_s}
            
            style={{
              transform: `scale(${zoomScale}) rotate(${arpa.self_course}deg) `,
              opacity: 0.5,
            }}
          />
        </Overlay>
      );

      
      return [cpa, cpa_target_vessel, cpa_self_vessel, safety_self_vessel, safety_r];
    }

    
    return [cpa, cpa_target_vessel, cpa_self_vessel];
  });

  const draggable = settings.showDebugOverlay ? (
    <Draggable offset={[900, 450]} anchor={anchor} onDragEnd={setAnchor}>
      <p className="block">{tipText}</p>
    </Draggable>
  ) : null;

  return (
    <div className="map">
      <Map
        defaultCenter={mapCenter}
        defaultZoom={15}
        center={mapCenter}
        onBoundsChanged={handleZoomLevel}
      >
        {listPreviousPaths}
        {listArpa}
        {listCourses}
        {listVessels}
        {listMarkers}

        <Overlay anchor={mapCenter} offset={[16, 44]}>
          <img
            className="overlay"
            src={gunnerus}
            style={{
              transform: `rotate(${gunnerusHeading}deg) scale(${zoomScale})`,
            }}
          />
        </Overlay>
        <Marker key={0} color="red" width={markerSize} anchor={mapCenter} />
        {draggable}
      </Map>
    </div>
  );
};

export default MyMap;
