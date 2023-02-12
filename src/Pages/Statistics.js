import React from "react";
import LinePlot from "../Components/plots/LinePlot";
import { Grid } from "@mui/material";

const data = [
];

const lines = [{
  type:"monotone",
  dataKey:"pv",
  stroke:"#8884d8",
},
  { type:"monotone", dataKey:"uv", stroke:"#82ca9d" }]

export default function Statistics() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <LinePlot data={data}/>
      </Grid>
      <Grid item xs={4}>
        <LinePlot data={data} />
      </Grid>
      <Grid item xs={4}>
        <LinePlot data={data} />
      </Grid>
      <Grid item xs={4}>
        <LinePlot data={data} />
      </Grid>
    </Grid>
  );
}
