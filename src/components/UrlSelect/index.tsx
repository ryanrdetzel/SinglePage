import * as React from "react";

import Box from "@mui/material/Box";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FilledInput from "@mui/material/FilledInput";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import styles from "./styles.module.css";
import { urlValidState } from "../../types/project";

interface UrlInformation {
  pageUrl: string;
  urlIsValid: urlValidState;
  updatePageUrl: (newUrl: string) => void;
}

function UrlSelect(props: UrlInformation) {
  const { pageUrl, updatePageUrl, urlIsValid } = props;

  const updateUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    const wantUrl = event.target.value;
    const updatedUrl = wantUrl
      .replace(" ", "-")
      .replace(/[^a-z0-9-_]/gi, "")
      .toLowerCase();

    updatePageUrl(updatedUrl);
  };

  const subdomain = process.env.NODE_ENV === "development" ? "beta" : "www";

  let validUrlClass = "text-secondary";
  if (urlIsValid === urlValidState.Valid) {
    validUrlClass = "text-success";
  } else if (urlIsValid === urlValidState.Invalid) {
    validUrlClass = "text-danger";
  }

  return (
    <Box
      sx={{
        padding: "4px",
        width: "100%",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex" }}>
        <Box sx={{ flex: 1, marginLeft: "20px" }}>
          <Input
            autoComplete="off"
            id="filled-adornment-weight"
            value={pageUrl}
            onChange={updateUrl}
            style={{ alignItems: "center" }}
            startAdornment={
              <InputAdornment
                position="start"
                style={{ marginRight: "2px", marginBottom: "2px" }}
              >
                https://{subdomain}.singlepage.cc/
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <CheckCircleIcon
                  className={validUrlClass}
                  aria-label="toggle password visibility"
                ></CheckCircleIcon>
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
