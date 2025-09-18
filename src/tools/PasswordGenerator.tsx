import { useState } from "react";

export default function PasswordGenerator() {
  const [length, setLength] = useState(12);
  const [result, setResult] = useState("");

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setResult(password);
  };

  return (
    <div>
      <h2>Password Generator</h2>
      <input
        type="number"
        value={length}
        onChange={(e) => setLength(Number(e.target.value))}
        min={4}
        max={50}
      />
      <button onClick={generatePassword}>Generate</button>
      <input type="text" value={result} readOnly />
    </div>
  );
}
