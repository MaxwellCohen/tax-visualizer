import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/layout/Nav";
import { GlobalSeo } from "~/components/seo/Seo";
import TaxDisclaimer from "~/components/legal/TaxDisclaimer";
import { ThemeProvider } from "~/lib/ui/theme";
import "./app.css";

export default function App() {
  return (
    <MetaProvider>
      <ThemeProvider>
        <Router
          root={props => (
            <>
              <GlobalSeo />
              <Nav />
              <Suspense>{props.children}</Suspense>
              <TaxDisclaimer />
            </>
          )}
        >
          <FileRoutes />
        </Router>
      </ThemeProvider>
    </MetaProvider>
  );
}
