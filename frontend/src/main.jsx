import React from "react";
import ReactDOM from "react-dom/client";
// Design-system CSS must load before App so page styles can override it.
import "./v2/styles/tokens.css";
import "./v2/styles/base.css";
import "./v2/styles/components.css";
import "./v2/styles/shared.css";
import "./v2/styles/night.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
