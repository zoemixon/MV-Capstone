import React, { useState, useEffect } from "react";
import { updateDensityThresholds } from "./cubView";

const DensityCloudControls = ({ scene }) => {
    const [currentPositiveThreshold, setCurrentPositiveThreshold] = useState(0.001);
    const [currentNegativeThreshold, setCurrentNegativeThreshold] = useState(0.001);

    const toggleDensityCloud = () => {
        if (window.densityCloud) {
            window.densityCloud.visible = !window.densityCloud.visible;
        } else {
            alert("Density cloud has not been loaded yet!");
        }
    };

    useEffect(() => {
        if (scene) {
            updateDensityThresholds(scene, currentPositiveThreshold, currentNegativeThreshold);
        }
    }, [scene, currentPositiveThreshold, currentNegativeThreshold]);

    return (
        <div className="label-section">
            <button onClick={toggleDensityCloud}>Toggle Density Cloud</button>
            <div style={{ marginTop: "10px" }}>
                <label>
                    Positive Density Threshold: {currentPositiveThreshold.toFixed(4)}
                </label>
                <input
                    type="range"
                    min="0.0001"
                    max="0.01"
                    step="0.0001"
                    value={currentPositiveThreshold}
                    onChange={(e) => setCurrentPositiveThreshold(parseFloat(e.target.value))}
                />
            </div>
            <div style={{ marginTop: "10px" }}>
                <label>
                    Negative Density Threshold: {currentNegativeThreshold.toFixed(4)}
                </label>
                <input
                    type="range"
                    min="0.0001"
                    max="0.01"
                    step="0.0001"
                    value={currentNegativeThreshold}
                    onChange={(e) => setCurrentNegativeThreshold(parseFloat(e.target.value))}
                />
            </div>
        </div>
    );
};

export default DensityCloudControls;