import { Link, Meta, Title } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { canonicalUrl, PAGE_META, SITE_NAME } from "~/lib/siteMeta";

type PageKey = keyof typeof PAGE_META;

/** Site-wide head tags; render once inside the router layout. */
export function GlobalSeo() {
  return (
    <>
      <Meta name="application-name" content={SITE_NAME} />
      <Meta name="theme-color" content="#0d9488" />
      <Meta property="og:type" content="website" />
      <Meta property="og:site_name" content={SITE_NAME} />
      <Meta name="twitter:card" content="summary" />
    </>
  );
}

/** Per-route title, description, Open Graph, Twitter, and canonical URL. */
export function RouteSeo(props: { page: PageKey }) {
  const loc = useLocation();
  const m = PAGE_META[props.page];
  const absoluteUrl = () => canonicalUrl(`${loc.pathname}${loc.search || ""}`);

  return (
    <>
      <Title>{m.title}</Title>
      <Meta name="description" content={m.description} />
      {props.page === "home" ? (
        <Meta name="keywords" content={PAGE_META.home.keywords} />
      ) : null}
      <Meta property="og:title" content={m.title} />
      <Meta property="og:description" content={m.description} />
      <Meta name="twitter:title" content={m.title} />
      <Meta name="twitter:description" content={m.description} />
      <Show when={absoluteUrl()}>
        <Meta property="og:url" content={absoluteUrl()!} />
        <Link rel="canonical" href={absoluteUrl()!} />
      </Show>
    </>
  );
}

export function NotFoundSeo() {
  const m = PAGE_META.notFound;

  return (
    <>
      <Title>{m.title}</Title>
      <Meta name="description" content={m.description} />
      <Meta name="robots" content="noindex" />
      <Meta property="og:title" content={m.title} />
      <Meta property="og:description" content={m.description} />
      <Meta name="twitter:title" content={m.title} />
      <Meta name="twitter:description" content={m.description} />
    </>
  );
}
