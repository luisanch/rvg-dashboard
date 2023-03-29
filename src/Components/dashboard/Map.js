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

      if (!aisObject.hasOwnProperty(data.mmsi)) {
        aisObject[data.mmsi] = data;
        aisObject[data.mmsi]["pinTooltip"] = false;
        aisObject[data.mmsi]["hoverTooltip"] = false;
      } else {
        data["pinTooltip"] = aisObject[data.mmsi]["pinTooltip"];
        data["hoverTooltip"] = aisObject[data.mmsi]["hoverTooltip"];
        aisObject[data.mmsi] = data;
      }
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

    if (!aisObject[ais.mmsi].hasOwnProperty("pinTooltip")) {
      aisObject[ais.mmsi]["pinTooltip"] = false;
      aisObject[ais.mmsi]["hoverTooltip"] = false;
    }

    const tooltipText = (ais) => {
      const hasArpa = arpaObject.hasOwnProperty(ais.mmsi);
      const hasSafetyParams = hasArpa && arpaObject[ais.mmsi].safety_params;

      const lon = ais.lon;
      const lat = ais.lat;
      const course = ais.hasOwnProperty("course") ? ais.course : "--";
      const mmsi = ais.mmsi;
      const speed = ais.hasOwnProperty("speed") ? ais.speed : "--";
      const d2cpa = hasArpa ? arpaObject[ais.mmsi]["d_2_cpa"] : "--";
      const t2cpa = hasArpa ? arpaObject[ais.mmsi]["t_2_cpa"] : "--";
      const dAtcpa = hasArpa ? arpaObject[ais.mmsi]["d_at_cpa"] : "--";
      const t2r = hasSafetyParams ? arpaObject[ais.mmsi]["t_2_r"] : "--";
      const d2r = hasSafetyParams ? arpaObject[ais.mmsi]["d_2_r"] : "--";

      return (
        <table>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Units</th>
          </tr>

          <tr>
            <td>MMSI</td>
            <td>{mmsi}</td>
            <td>#</td>{" "}
          </tr>
          <tr>
            <td>Longitude</td>
            <td>{lon}</td>
            <td>DD</td>{" "}
          </tr>
          <tr>
            <td>Latitude</td>
            <td>{lat}</td>
            <td>DD</td>{" "}
          </tr>
          <tr>
            <td>Course</td>
            <td>{course}</td>
            <td>°</td>{" "}
          </tr>
          <tr>
            <td>Speed</td>
            <td>{speed}</td>
            <td>m/s</td>{" "}
          </tr>
          <tr>
            <td>Time to CPA</td>
            <td>{t2cpa}</td>
            <td>s</td>{" "}
          </tr>
          <tr>
            <td>Dist. to CPA</td>
            <td>{d2cpa}</td>
            <td>m</td>{" "}
          </tr>
          <tr>
            <td>Dist. at CPA</td>
            <td>{dAtcpa}</td>
            <td>m</td>{" "}
          </tr>
          <tr>
            <td>Time to Safety r</td>
            <td>{t2r}</td>
            <td>s</td>{" "}
          </tr>
          <tr>
            <td>Dist. to Safety r</td>
            <td>{d2r}</td>
            <td>m</td>{" "}
          </tr>
        </table>
      );
    };

    const tooltipOverlay = (
      <Overlay
        key={"6" + ais.mmsi}
        anchor={[ais.lat, ais.lon]}
        offset={[150, 230]}
      >
        <p
          style={{
            width: "150px",
            height: "200px",
            background: "white",
            fontSize: "12px",
            opacity: 0.8,
          }}
        >
          {tooltipText(ais)}
        </p>
      </Overlay>
    );

    const tooltip =
      aisObject[ais.mmsi]["hoverTooltip"] || aisObject[ais.mmsi].pinTooltip
        ? tooltipOverlay
        : null;

    return [
      tooltip,
      <Marker
        key={ais.mmsi}
        color="green"
        width={markerSize}
        onClick={() => {
          console.log(tooltip);
          setTipText(JSON.stringify(ais, null, 2));
          aisObject[ais.mmsi].pinTooltip = !aisObject[ais.mmsi].pinTooltip;
        }}
        onMouseOver={() => {
          aisObject[ais.mmsi]["hoverTooltip"] = true;
          console.log(aisObject[ais.mmsi]["hoverTooltip"]);
        }}
        onMouseOut={() => (aisObject[ais.mmsi]["hoverTooltip"] = false)}
        anchor={[Number(ais.lat), Number(ais.lon)]}
      />,
    ];
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

  const listArpa = Object.values(arpaObject).map((arpa, index) => {
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

      return [
        cpa,
        cpa_target_vessel,
        cpa_self_vessel,
        safety_self_vessel,
        safety_r,
      ];
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
