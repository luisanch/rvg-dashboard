import React, { Fragment, useEffect, useState } from "react";
import { Map, Marker, Overlay, GeoJson, Draggable } from "pigeon-maps";
import "./Map.css"; 
import gunnerus from "../../Assets/ships/gunnerus.svg";
import boat from "../../Assets/ships/boat.svg";
import course from "../../Assets/ships/course.svg"; 

const aisObject = {}; 

const MyMap = (props) => {
  const data = props.data;
  const markerSize = 20;
  const settings = props.settings;

  const [mapCenter, setMapCenter] = useState([63.43463, 10.39744]);
  const [gunnerusHeading, setGunnerusHeading] = useState(0);
  const [aisData, setAisData] = useState([]);
  const [anchor, setAnchor] = useState([63.43463, 10.39744]);
  const [tipText, setTipText] = useState("");
  const [arpaObject, setArpaObject] = useState([]);
  const [zoomScale, setZoomScale] = useState(1);

  const handleZoomLevel = (event) => {  
    const scale = (event.zoom/18)
    console.log(scale)
    setZoomScale(scale)
  }

  function deg2dec(coord, direction) {
    let dir = 1;
    if (direction === "S" || direction === "W") dir = -1;
    let deg = Math.trunc(coord / 100);
    let dec = (coord / 100 - deg) * (10 / 6);
    return dir * (deg + dec);
  }

  var createGeoJSONCircle = function(center, radiusInKm, points) {
    if(!points) points = 64;

    var coords = {
        latitude: center[1],
        longitude: center[0]
    };

    var km = radiusInKm;

    var ret = [];
    var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
    var distanceY = km/110.574;

    var theta, x, y;
    for(var i=0; i<points; i++) {
        theta = (i/points)*(2*Math.PI);
        x = distanceX*Math.cos(theta);
        y = distanceY*Math.sin(theta);

        ret.push([coords.longitude+x, coords.latitude+y]);
    }
    ret.push(ret[0]);

    return  [ret] 
    
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
      aisObject[data.message_id] = data;
    }

    if (data.message_id.indexOf("arpa") === 0) {
      console.log(JSON.stringify(data, null, 2)); 
      setArpaObject(data.data)
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

    function rotate_heaidng(ais_in) {
      if (ais_in.heading) {
        return ais_in.heading
      } else { 
        return 0
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
          style={{ transform: `scale(${zoomScale}) rotate(${rotate_heaidng(ais)}deg) ` }}
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

    return (
      <Overlay
        key={"3" + String(ais.mmsi)}
        anchor={[Number(ais.lat), Number(ais.lon)]}
        offset={[80, 150]}
      >
        <img
          className="course"
          src={course}
          style={{ transform: `rotate(${ais.course}deg))` }}
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
            strokeWidth: "1",
            stroke: "blue",
            r: "20",
          };
        }}
      />
    );
  });

  const listArpa = arpaObject.map((arpa, index) => {
    if (!settings.showHitbox) return null;
    const geoJsonSample = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [arpa.lon_o, arpa.lat_o],
              [arpa.lon_at_cpa, arpa.lat_at_cpa], 
            ],
          },
          properties: { prop0: "value0" },
        },
      ],
    };

    const geoJsonSample3 = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [anchor[1], anchor[0]],
              [arpa.lon_at_cpa, arpa.lat_at_cpa], 
            ],
          },
          properties: { prop0: "value0" },
        },
      ],
    };

    let c = ( <GeoJson
      key={"3" + index}
      data={geoJsonSample3}
      styleCallback={(feature, hover) => {
        return {
          fill: "#00000000",
          strokeWidth: "2",
          opacity: 0.2,
          stroke: "red",
          r: "20",
        };
      }}
    />) 

    let a = ( <GeoJson
      key={"0" + index}
      data={geoJsonSample}
      styleCallback={(feature, hover) => {
        return {
          fill: "#00000000",
          strokeWidth: "2",
          opacity: 0.2,
          stroke: "red",
          r: "20",
        };
      }}
    />) 

    if (arpa.safety_params) {
      const geoCircle = createGeoJSONCircle([arpa.lon_o_at_r, arpa.lat_o_at_r], arpa.safety_radius / 1000)
      const geoJsonSample2 = {
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

      let b = ( <GeoJson
        key={"1" + index}
        data={geoJsonSample2}
        styleCallback={(feature, hover) => {
          return {
            fill: "#00000000",
            strokeWidth: "2",
            opacity: 0.2,
            stroke: "red",
            r: "20",
          };
        }} />)
      
        return ( [a, b, c] );
    }

    
    //  console.log(JSON.stringify(geoJsonSample.features[0].geometry.coordinates, null, 2))

    return ( [a, c] );
  });

  const draggable = settings.showDebugOverlay ? (
    <Draggable offset={[900, 450]} anchor={anchor} onDragEnd={setAnchor}>
      <p className="block">{tipText}</p>
    </Draggable>
  ) : null;

  return (
    <div className="map">
      <Map defaultCenter={mapCenter} defaultZoom={15} center={mapCenter} onBoundsChanged={handleZoomLevel} >
        {listCourses}
        {listOverlays}
        {listMarkers}
        {listPreviousPaths}
        {listArpa}
        <Overlay anchor={mapCenter} offset={[16, 44]}>
          <img
            className="overlay"
            src={gunnerus}
            style={{ transform: `rotate(${gunnerusHeading}deg) scale(${zoomScale})` }}
          />
        </Overlay>
        <Marker key={0} color="red" width={markerSize} anchor={mapCenter} />
        {draggable}
      </Map>
    </div>
  );
};

export default MyMap;
