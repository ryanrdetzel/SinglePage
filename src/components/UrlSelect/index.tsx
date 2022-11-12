import * as React from "react";

import Box from "@mui/material/Box";
import FilledInput from "@mui/material/FilledInput";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import styles from "./styles.module.css";

// import Grid from "@mui/material/Grid";

interface UrlInformation {
  pageUrl: string;
  pageType: string | null;
  updatePageUrl: (newUrl: string) => void;
}

function UrlSelect(props: UrlInformation) {
  const { pageUrl, pageType, updatePageUrl } = props;
  // const [url, setUrl] = React.useState(pageUrl);

  const updateUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    const wantUrl = event.target.value;
    const updatedUrl = wantUrl
      .replace(" ", "-")
      .replace(/[^a-z0-9-_]/gi, "")
      .toLowerCase();

    updatePageUrl(updatedUrl);
  };

  const isAnonymous = pageType === "anon";
  const sumdomain = isAnonymous ? "waffle" : "beta";

  return (
    <Box
      sx={{
        // margin: "10px auto",
        padding: "4px",
        width: "100%",
        // background: "#efefef",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex" }}>
        {/* <div>Your single page URL:</div> */}
        <Box sx={{ flex: 1, marginLeft: "20px" }}>
          <Input
            id="filled-adornment-weight"
            value={pageUrl}
            onChange={updateUrl}
            startAdornment={
              <InputAdornment position="start">
                https://{sumdomain}.singlepage.cc/
              </InputAdornment>
            }
            aria-describedby="filled-weight-helper-text"
            inputProps={{
              "aria-label": "weight",
            }}
            sx={{ width: "100%" }}
          />
        </Box>
      </div>
    </Box>
  );
}

export default UrlSelect;
