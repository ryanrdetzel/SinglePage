import "./App.css";
import "./theme-default.css";

import * as React from "react";

import Container from "@mui/material/Container";
import Editor from "./components/Editor";
import Grid from "@mui/material/Grid";
import UrlSelect from "./components/UrlSelect";
import { urlValidState } from "./types/project";

type editorPublishFuncType = () => void;
type timerType = ReturnType<typeof setTimeout>;

function App() {
  const [url, setUrl] = React.useState<string>("");
  const [theme, setTheme] = React.useState("default");

  const [urlIsValid, setUrlIsValid] = React.useState<urlValidState>(
    urlValidState.Unknown
  );
  const timerRef = React.useRef<timerType | null>(null);

  const updatePageUrl = (newPageUrl: string) => {
    setUrl(newPageUrl);
    setUrlIsValid(urlValidState.Unknown);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      fetch("https://api.singlepage.cc/checkUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newPageUrl }),
      })
        .then((res) => res.json())
        .then((data) => setUrlIsValid(data.valid));

      setUrlIsValid(urlValidState.Unknown);
    }, 500);
  };

  const editorPublishFunc = React.useRef<editorPublishFuncType>(null);

  const publishPage = () => {
    if (editorPublishFunc.current) {
      editorPublishFunc.current();
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top navbar sticky">
        <div className="container">
          <a className="navbar-brand logo">
            <i className="mdi mdi-chart-donut-variant"></i> Single Page
          </a>
          <button
            className="navbar-toggler collapsed"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="mdi mdi-menu"></i>
          </button>
          <div className="navbar" id="navbarNav" style={{ width: "100%" }}>
            <UrlSelect
              pageUrl={url}
              urlIsValid={urlIsValid}
              updatePageUrl={updatePageUrl}
            />
          </div>
          <select
            className="custom-select"
            style={{ maxWidth: "150px", marginRight: "10px" }}
            onChange={(e) => setTheme(e.currentTarget.value)}
            value={theme}
          >
            <option value="default">Default Theme</option>
            <option value="two">Duex</option>
            <option value="mega">Mega Theme</option>
            <option value="console">Console Theme</option>
            <option value="french">French Theme</option>
            <option value="gill">Gill Theme</option>
          </select>
          <a
            className="btn btn-light btn-sm"
            style={{ marginRight: "10px" }}
            target="_blank"
            rel="noreferrer"
            href={`/preview.html?theme=${theme}`}
          >
            Preview
          </a>
          <a
            href="#publish"
            type="submit"
            id="submit"
            className="btn btn-custom btn-sm"
            onClick={publishPage}
          >
            Publish
          </a>
        </div>
      </nav>

      <section className="home-prestion" id="home">
        <Container className={theme}>
          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Editor url={url} urlIsValid={urlIsValid} theme={theme} />
          </Grid>
        </Container>
      </section>

      <section className="footer bg-dark">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center">
                <p className="mb-0">2022 © Single Page.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default App;
