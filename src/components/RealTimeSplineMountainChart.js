// src/components/RealTimeSplineMountainChart.js
import React, { useEffect, useRef } from 'react';
import {
  SciChartSurface,
  NumericAxis,
  XyDataSeries,
  FastMountainRenderableSeries,
  GradientParams,
  Point,
  NumberRange,
  ZoomExtentsModifier,
  RubberBandXyZoomModifier,
  MouseWheelZoomModifier,
  WaveAnimation
} from 'scichart';
import PropTypes from 'prop-types';
import { SciChartJsNavyTheme } from 'scichart/Charting/Themes/SciChartJsNavyTheme';

export default function RealTimeSplineMountainChart({ data }) {
  const sciChartDiv = useRef(null);
  const sciChartSurfaceRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!sciChartDiv.current) return;
      const { wasmContext, sciChartSurface } = await SciChartSurface.create(
        sciChartDiv.current, 
        { theme: SciChartJsNavyTheme }
      );
      if (!isMounted) { sciChartSurface.delete(); return; }

      sciChartSurface.xAxes.add(new NumericAxis(wasmContext));
      sciChartSurface.yAxes.add(
        new NumericAxis(wasmContext, { growBy: new NumberRange(0.05, 0.05) })
      );

      const ds = new XyDataSeries(wasmContext, { xValues: [], yValues: [] });
      const series = new FastMountainRenderableSeries(wasmContext, {
        dataSeries: ds,
        stroke: '#00e676',
        strokeThickness: 2,
        zeroLineY: 0,
        fillLinearGradient: new GradientParams(
          new Point(0, 0),
          new Point(0, 1),
          [
            { color: '#00e67666', offset: 0 },
            { color: 'Transparent', offset: 1 }
          ]
        ),
        animation: new WaveAnimation({ duration: 500, fadeEffect: true, zeroLine: 0 })
      });
      sciChartSurface.renderableSeries.add(series);
      sciChartSurface.chartModifiers.add(
        new ZoomExtentsModifier(),
        new RubberBandXyZoomModifier(),
        new MouseWheelZoomModifier()
      );
      sciChartSurface.zoomExtents();

      sciChartSurfaceRef.current = sciChartSurface;
      seriesRef.current = series;
    })();
    return () => {
      isMounted = false;
      sciChartSurfaceRef.current?.delete();
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const surface = sciChartSurfaceRef.current;
    if (!series || !surface) return;

    const xValues = data.map(d => {
      const [h, m] = d.time.split(':').map(Number);
      const dt = new Date();
      dt.setHours(h, m, 0, 0);
      return dt.getTime();
    });
    const yValues = data.map(d => d.count);

    series.dataSeries.clear();
    series.dataSeries.appendRange(xValues, yValues);
    surface.zoomExtents();
  }, [data]);

  return <div ref={sciChartDiv} style={{ width: '100%', height: '240px' }} />;
}

RealTimeSplineMountainChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};
