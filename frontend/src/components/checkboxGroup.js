import React from "react";

export default function CheckboxGroup({handleChange, state}) {
  return (
    <div style={{ padding: "0rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        {Object.entries(state).map(([key, value]) => (
          <label key={key} style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => handleChange(key)}
              style={{ marginRight: "0.4rem" }}
            />
            {key}
          </label>
        ))}
      </div>
    </div>
  );
}
