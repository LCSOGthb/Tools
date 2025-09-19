import React, { useState } from "react";

export default function Calculator() {
  const [value, setValue] = useState("");

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter calculation"
      />
      <button onClick={() => alert(eval(value))}>Calculate</button>
    </div>
  );
}
