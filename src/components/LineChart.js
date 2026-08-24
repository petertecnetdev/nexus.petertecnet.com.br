// src/components/LineChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';

const LineChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => item.label),
        datasets: [
            {
                label: 'Desempenho',
                data: data.map(item => item.value),
                fill: false,
                backgroundColor: 'rgba(153, 102, 255, 1)',
                borderColor: 'rgba(153, 102, 255, 1)',
            },
        ],
    };

    return <Line data={chartData} />;
};

// Validação das propriedades
LineChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
        })
    ).isRequired,
};

export default LineChart;
