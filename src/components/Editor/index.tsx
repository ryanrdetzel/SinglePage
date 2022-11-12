import "react-quill/dist/quill.snow.css";

import * as React from "react";

import EditorToolbar, { formats, modules } from "./EditorToolbar";
import ReactQuill, { Quill } from "react-quill";
import { stringify, v4 as uuidv4 } from "uuid";

import CheckoutForm from "../CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import Grid from "@mui/material/Grid";
import { loadStripe } from "@stripe/stripe-js";
import styles from "./styles.module.css";

const stripePromise = loadStripe("pk_7N26jvoavbV1Cw74KBPPRZH3241eT");

interface EditorProps {
  url: string;
}

function Editor({ url }: EditorProps) {
  const [clientSecret, setClientSecret] = React.useState<string>("");
  const [genId] = React.useState(() => {
    let uuid = localStorage.getItem("uuid");
    if (!uuid) {
      uuid = uuidv4();
      localStorage.setItem("uuid", uuid);
    }
    return uuid;
  });

  const [value, setValue] = React.useState(() => {
    // getting stored value
    const saved = localStorage.getItem("value") || "{}";
    const initialValue = JSON.parse(saved);
    return initialValue || "";
  });
  const [content, setContent] = React.useState("");

  // React.useEffect(() => {
  //   editorPublishFunc.current = publishPage;
  // }, []);

  React.useEffect(() => {
    // Create PaymentIntent as soon as the page loads

    fetch("https://api.singlepage.cc/paysetup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genId: genId }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  React.useEffect(() => {
    // storing input name
    localStorage.setItem("value", JSON.stringify(value));
  }, [value]);

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
  };

  const publishPage = async () => {
    const response = await fetch("https://api.singlepage.cc/publish", {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(payload), // body data type must match "Content-Type" header
    });
    const content = await response.json();
    const newId = content["genId"];
    console.log(genId, newId);
    return newId;
    // console.log(await response.json());
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

      <section className="section" id="service">
        <Grid container spacing={2}>
          <Grid
            item
            xs={6}
            // display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <div className={styles.payment}>
              <h3>You will be charged</h3>
              <h1 className="display-4">$1.00 USD</h1>
              <p>
                To publish this Single Page.
                <br />
                <a href="">Why do we charge to publish a page?</a>
              </p>
              <p>
                <label>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    id="terms"
                  />{" "}
                  I agree to the <a href="#">terms and conditions.</a>
                </label>
              </p>
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
                  <CheckoutForm publishPage={publishPage} url={url} />
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
