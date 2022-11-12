import "./App.css";

import * as React from "react";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Editor from "./components/Editor";
import Grid from "@mui/material/Grid";
import PageType from "./components/PageType";
import Typography from "@mui/material/Typography";
import UrlSelect from "./components/UrlSelect";

interface PublishFuncRef {
  publishFunction: () => void;
}

type test = () => void;

function App() {
  const [pageType, setPageType] = React.useState<null | string>(null);
  const [url, setUrl] = React.useState<string>("");

  const makeTypeSelection = (selection: string) => {
    setPageType(selection);
  };

  const updatePageUrl = (newPageUrl: string) => {
    console.log(newPageUrl);
    setUrl(newPageUrl);
  };

  const editorPublishFunc = React.useRef<test>(null);

  const publishPage = () => {
    if (editorPublishFunc.current) {
      editorPublishFunc.current();
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg fixed-top navbar-custom sticky">
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
          <div className="collapse navbar-collapse" id="navbarNav">
            <UrlSelect
              pageType={pageType}
              pageUrl={url}
              updatePageUrl={updatePageUrl}
            />
          </div>
          <button
            type="submit"
            id="submit"
            name="send"
            className="btn btn-link btn-sm"
          >
            Help
          </button>
          <button
            type="submit"
            id="submit"
            name="send"
            className="btn btn-light btn-sm"
            style={{ marginRight: "10px" }}
            onClick={publishPage}
          >
            Preview Page
          </button>
          <a
            href="#service"
            type="submit"
            id="submit"
            className="btn btn-custom btn-sm"
            onClick={publishPage}
          >
            Publish Page
          </a>
        </div>
      </nav>

      <section className="home-prestion" id="home">
        <Container>
          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Editor url={url} />
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
