// src/components/RealTimeOrdersChart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import './RealTimeOrdersChart.css';

export default function RealTimeOrdersChart({ data }) {
  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e676" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#333" strokeDasharray="3 3" />

          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#aaa', fontSize: 12 }}
            minTickGap={20}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#aaa', fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{ backgroundColor: '#222', border: 'none' }}
            itemStyle={{ color: '#0f0' }}
            labelStyle={{ color: '#fff', fontSize: 13 }}
            cursor={{
              stroke: '#00e676',
              strokeWidth: 1,
              strokeDasharray: '3 3'
            }}
          />

          <Area
            type="monotone"
            dataKey="count"
            stroke="none"
            fill="url(#colorOrders)"
          />

          <Line
            type="monotone"
            dataKey="count"
            stroke="#00e676"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

RealTimeOrdersChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};
