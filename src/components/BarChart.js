// src/components/BarChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';

const BarChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => item.label),
        datasets: [
            {
                label: 'Vendas',
                data: data.map(item => item.value),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
        ],
    };

    return <Bar data={chartData} />;
};

// Validação das propriedades
BarChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
        })
    ).isRequired,
};

export default BarChart;
