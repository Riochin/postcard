import "@mantine/core/styles.css";
import React from "react";
import {
  MantineProvider,
  ColorSchemeScript,
  mantineHtmlProps,
  Container,
} from "@mantine/core";
import { theme } from "../theme";

export const metadata = {
  title: "Postcard",
  description: "日本全国を舞台に絵葉書が移動する様子を楽しめるSNSサービス",
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <meta name="apple-mobile-web-app-title" content="Postcard" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />

        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Container size="md" py="md">
            {children}
          </Container>
        </MantineProvider>
      </body>
    </html>
  );
}
