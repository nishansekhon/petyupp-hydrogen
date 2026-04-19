import React from 'react';
import { Helmet } from 'react-helmet-async';

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PetYupp",
    "url": "https://petyupp.com",
    "logo": "https://petyupp.com/petyupp-logo.png",
    "description": "Natural relief for your dog's real needs. Natural dog treats and supplements.",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "hello@petyupp.com",
      "contactType": "customer service",
      "areaServed": ["US", "CA"]
    },
    "sameAs": [
      "https://instagram.com/petyupp",
      "https://facebook.com/petyupp"
    ]
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PetYupp",
    "url": "https://petyupp.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://petyupp.com/shop?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OnlineBusiness",
    "name": "PetYupp",
    "url": "https://petyupp.com",
    "description": "Premium natural dog products - US and Canada"
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
