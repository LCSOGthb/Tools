import React from "react";

export default function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error("This is your first error!");
      }}
    >
      Break the world
    </button>
  );
}
