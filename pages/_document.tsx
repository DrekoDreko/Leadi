import { Head, Html, Main, NextScript } from "next/document";
import Document, { type DocumentContext, type DocumentInitialProps } from "next/document";

export default class CustomDocument extends Document {
  static override async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    return Document.getInitialProps(ctx);
  }

  override render() {
    return (
      <Html lang="pt-BR">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
