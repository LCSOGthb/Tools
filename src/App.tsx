import React from "react";
import ToolCard from "./components/ToolCard";
import Calculator from "./tools/Calculator";
import PasswordGenerator from "./tools/PasswordGenerator";
import QRGenerator from "./tools/QRGenerator";
import UnitConverter from "./tools/UnitConverter";

const tools = [
  { name: "Calculator", component: <Calculator /> },
  { name: "Password Generator", component: <PasswordGenerator /> },
  { name: "QR Code Generator", component: <QRGenerator /> },
  { name: "Unit Converter", component: <UnitConverter /> },
];

export default function App() {
  return (
    <main className="tool-grid">
      {tools.map((tool) => (
        <ToolCard key={tool.name} name={tool.name} content={tool.component} />
      ))}
    </main>
  );
}