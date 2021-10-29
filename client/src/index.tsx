import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import configureStore from "./store/configureStore";
import ErrorBoundary from "./components/ErrorBoundary";
import ReactModal from "react-modal";

ReactDOM.render(
  <Provider store={configureStore()}>
    <BrowserRouter>
      <ErrorBoundary>{[<App key="App" />]}</ErrorBoundary>
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);

ReactModal.setAppElement("#root");
