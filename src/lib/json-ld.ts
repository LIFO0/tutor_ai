import { faqs } from "@/data/faq";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

export function getHomePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_ORIGIN}/#organization`,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        description: DEFAULT_DESCRIPTION,
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_ORIGIN}/#webapp`,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        description: DEFAULT_DESCRIPTION,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "RUB",
        },
        audience: {
          "@type": "EducationalAudience",
          educationalRole: "student",
          audienceType: "students",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_ORIGIN}/#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_ORIGIN}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Главная",
            item: SITE_ORIGIN,
          },
        ],
      },
    ],
  };
}
