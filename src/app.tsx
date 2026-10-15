import { Loading } from "solid-js";
import Nav from "~/components/layout/Nav";
import { GlobalSeo } from "~/components/seo/Seo";
import TaxDisclaimer from "~/components/legal/TaxDisclaimer";
import { ThemeProvider } from "~/lib/ui/theme";
import { Router } from "./router";
import "./app.css";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        {(props) => (
          <>
            <GlobalSeo />
            <Nav />
            <Loading>{props.children}</Loading>
            <TaxDisclaimer />
          </>
        )}
      </Router>
    </ThemeProvider>
  );
}
