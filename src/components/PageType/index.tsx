import * as React from "react";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

interface PageSelection {
  pageType: string | null;
  onSelection: (selection: string) => void;
}

function PageType(props: PageSelection) {
  const { pageType, onSelection } = props;

  return (
    <>
      <Grid
        item
        xs={6}
        display="flex"
        justifyContent="right"
        alignItems="right"
      >
        <Box
          onClick={() => onSelection("anon")}
          sx={{
            width: 400,
            height: 200,
            background: pageType === "anon" ? "red" : "#efefef",
          }}
        >
          Anonymous
        </Box>
      </Grid>
      <Grid item xs={6} display="flex" justifyContent="left" alignItems="left">
        <Box
          onClick={() => onSelection("nonanon")}
          sx={{
            width: 400,
            height: 200,
            background: pageType === "nonanon" ? "red" : "#efefef",
          }}
        >
          Non Anonymous
        </Box>
      </Grid>
    </>
  );
}

export default PageType;
