import React from "react";
import ChatInterface from "./ChatInterface";
import "./index.css"; // Make sure to import the Tailwind styles

const App: React.FC = () => {
  return (
    <div className="App">
      <ChatInterface />
    </div>
  );
};

export default App;
