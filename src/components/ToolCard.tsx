import React from "react";

interface ToolCardProps {
  name: string;
  content: React.ReactNode;
}

export default function ToolCard({ name, content }: Props) {
  return (
    <div className="tool-card">
      <h2>{name}</h2>
      {content}
    </div>
  );
}
