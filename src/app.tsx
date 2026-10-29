import { Loading, onSettled } from "solid-js";
import { isServer } from "@solidjs/web";
import Nav from "~/components/layout/Nav";
import { GlobalSeo } from "~/components/seo/Seo";
import TaxDisclaimer from "~/components/legal/TaxDisclaimer";
import { ThemeProvider } from "~/lib/ui/theme";
import { registerServiceWorker } from "~/pwa/registerServiceWorker";
import { Router } from "./router";
import "./app.css";

export default function App() {
  onSettled(() => {
    if (!isServer) registerServiceWorker();
  });

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
