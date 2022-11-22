import "react-quill/dist/quill.snow.css";

import * as React from "react";

import EditorToolbar, { formats, modules } from "./EditorToolbar";

import CheckoutForm from "../CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import Grid from "@mui/material/Grid";
import ReactQuill from "react-quill";
import { loadStripe } from "@stripe/stripe-js";
import styles from "./styles.module.css";
import { urlValidState } from "../../types/project";
import { v4 as uuidv4 } from "uuid";

interface EditorProps {
  url: string;
  urlIsValid: urlValidState;
  theme: string;
}

const stripeKey = process.env.REACT_APP_STRIPE || "";
const stripePromise = loadStripe(stripeKey);

function Editor({ url, urlIsValid, theme }: EditorProps) {
  const [clientSecret, setClientSecret] = React.useState<string>("");
  const [secretPhrase, setSecretPhrase] = React.useState(() => {
    let phrase = localStorage.getItem("phrase");
    if (!phrase) {
      fetch("https://api.singlepage.cc/phrase", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("phrase", data.phrase);
          setSecretPhrase(data.phrase);
        });
    }
    return phrase;
  });

  const [genId] = React.useState(() => {
    let uuid = localStorage.getItem("uuid");
    if (!uuid) {
      uuid = uuidv4();
      localStorage.setItem("uuid", uuid);
    }
    return uuid;
  });

  const [value, setValue] = React.useState(() => {
    const saved = localStorage.getItem("value") || "{}";
    const initialValue = JSON.parse(saved);
    return initialValue || "";
  });
  const [content, setContent] = React.useState("");

  React.useEffect(() => {
    fetch("https://api.singlepage.cc/paysetup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genId: genId }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  React.useEffect(() => {
    localStorage.setItem("value", JSON.stringify(value));
  }, [value]);

  React.useEffect(() => {
    localStorage.setItem("content", content);
  }, [content]);

  const updateVal = (content: string, delta: any, source: any, editor: any) => {
    const d = editor.getContents();
    setContent(content);
    setValue(d);
  };

  const options = {
    clientSecret,
  };

  const payload = {
    url,
    content,
    genId,
    secretPhrase,
    theme,
  };

  const publishPage = async (): Promise<string> => {
    const response = await fetch("https://api.singlepage.cc/publish", {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(payload), // body data type must match "Content-Type" header
    });
    const content = await response.json();
    const newId = content["genId"];
    return newId;
  };

  return (
    <div style={{ width: "100%" }}>
      <div>
        <EditorToolbar />

        <ReactQuill
          onChange={updateVal}
          className={styles.editor}
          value={value}
          modules={modules}
          formats={formats}
          scrollingContainer="html"
        />
      </div>

      <section className="section" id="publish">
        <Grid container spacing={2}>
          <Grid item xs={6} justifyContent="center" alignItems="center">
            <div className={styles.payment}>
              <h3>You will be charged</h3>
              <h1 className="display-4">$1.00 US</h1>
              <p>
                To publish this Single Page.
                <br />
                <a href="">Why do we charge to publish a page?</a>
              </p>
              <hr />
              <div>Store this secret phrase in a safe location</div>
              <h3 className="display-4" style={{ fontSize: "2.3em" }}>
                {secretPhrase}
              </h3>

              <a href="">What is a secret phrase and why do I need it?</a>
            </div>
          </Grid>
          <Grid
            item
            xs={6}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <div className={styles.stripe}>
              {clientSecret && (
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm
                    publishPage={publishPage}
                    url={url}
                    urlIsValid={urlIsValid}
                  />
                </Elements>
              )}
            </div>
          </Grid>
        </Grid>
      </section>
    </div>
  );
}

export default Editor;
