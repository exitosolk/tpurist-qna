"use client";

import Head from "next/head";
import { usePathname } from "next/navigation";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  schema?: object;
}

export default function SEO({
  title,
  description,
  keywords = [],
  image = "/og-image.png",
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
  canonicalUrl,
  schema,
}: SEOProps) {
  const pathname = usePathname();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oneceylon.space";
  const fullUrl = canonicalUrl || `${siteUrl}${pathname}`;
  const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;

  // Default keywords for Sri Lanka travel
  const defaultKeywords = [
    "Sri Lanka travel",
    "travel questions",
    "Sri Lanka tourism",
    "travel advice",
    "OneCeylon",
  ];
  const allKeywords = [...new Set([...keywords, ...defaultKeywords])];

  const structuredData = schema || {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OneCeylon",
    url: siteUrl,
    description: "Your trusted community for Sri Lanka travel questions and answers",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{`${title} | OneCeylon - Sri Lanka Travel Community`}</title>
        <meta name="title" content={`${title} | OneCeylon`} />
        <meta name="description" content={description} />
        <meta name="keywords" content={allKeywords.join(", ")} />
        {author && <meta name="author" content={author} />}
        
        {/* Robots */}
        {noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        )}
        
        {/* Canonical URL */}
        <link rel="canonical" href={fullUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="OneCeylon" />
        <meta property="og:locale" content="en_US" />
        {publishedTime && <meta property="article:published_time" content={publishedTime} />}
        {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        {author && <meta property="article:author" content={author} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={fullUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:site" content="@oneceylon" />
        <meta name="twitter:creator" content="@oneceylon" />
        
        {/* Additional SEO */}
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta httpEquiv="content-language" content="en" />
        
        {/* Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
    </>
  );
}
