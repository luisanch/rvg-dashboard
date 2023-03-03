import React, { useEffect, useState } from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

export default function Settings(props) {
  const settings = props.settings
  const setSettings = props.setSettings 

  const handleChangeHitbox = (event) => {
    update('showHitbox', event.target.checked) 
  };

  const handleChangeOverlay = (event) => {
    update('showDebugOverlay', event.target.checked)
  };

  const update = (setting, value) => {
    settings[setting] = value
    setSettings(settings)
  }
  return (
    <FormGroup>
      <FormControlLabel control={<Checkbox checked={settings.showHitbox} onChange={handleChangeHitbox} />} label="Show Collission Boxes" />
      <FormControlLabel control={<Checkbox checked={settings.showDebugOverlay} onChange={handleChangeOverlay}/>} label="Show Debug Overlay" />
    </FormGroup>
  );
}
