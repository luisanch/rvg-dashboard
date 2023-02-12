import React, { useEffect, useState } from "react";
import MyMap from "../Components/dashboard/Map";

export default function Home(props) {
  const data = props.data;
  const [mapCenter, setMapCenter] = useState([63.43463, 10.39744]);

  function deg2dec(coord, direction) {
    let dir = 1;
    if (direction == "S" || direction == "W") dir = -1;
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
        const res = [deg2dec(lat, lat_dir), deg2dec(lon, lon_dir)] 
        return res;
      });
      console.log(mapCenter)
    }
  }, [data, setMapCenter]);

  return <MyMap mapCenter={mapCenter} />;
}
