import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { baseStyles } from "./_styles";

export interface FileExpiringProps {
  /** User's display name */
  name?: string;
  /** File name that is about to expire */
  fileName: string;
  /** Human-readable expiry date, e.g. "03/06/2026 às 14h00" */
  expiresAt: string;
  /** Direct download URL */
  url: string;
}

export function FileExpiring({ name, fileName, expiresAt, url }: FileExpiringProps) {
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Seu arquivo "{fileName}" expira em breve — baixe agora</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoSection}>
            <Text style={baseStyles.logo}>Praticca</Text>
          </Section>

          <Section style={baseStyles.card}>
            <Section style={{ textAlign: "center", marginBottom: "16px" }}>
              <Text style={{ fontSize: "40px", margin: "0" }}>⚠️</Text>
            </Section>

            <Heading style={baseStyles.h1}>Arquivo expirando em breve</Heading>

            <Text style={baseStyles.text}>{greeting}</Text>
            <Text style={baseStyles.text}>
              O arquivo abaixo ficará indisponível em <strong>{expiresAt}</strong>. Faça o
              download agora para não perder o acesso.
            </Text>

            <Section style={fileBox}>
              <Text style={fileNameText}>📎 {fileName}</Text>
              <Text style={expiryText}>Expira em: {expiresAt}</Text>
            </Section>

            <Section style={baseStyles.ctaSection}>
              <Button href={url} style={{ ...baseStyles.button, backgroundColor: "#f59e0b" }}>
                Baixar antes que expire
              </Button>
            </Section>

            <Text style={baseStyles.hint}>
              Após a expiração, o arquivo será removido permanentemente e não poderá ser
              recuperado. Se precisar processar o arquivo novamente, acesse{" "}
              <a href="https://praticca.com.br" style={baseStyles.link}>
                praticca.com.br
              </a>
              .
            </Text>

            <Hr style={baseStyles.hr} />

            <Text style={baseStyles.linkFallback}>
              O botão não funciona? Copie e cole este link no navegador:
            </Text>
            <Text style={baseStyles.linkText}>{url}</Text>
          </Section>

          <Section style={baseStyles.footer}>
            <Text style={baseStyles.footerText}>
              © {new Date().getFullYear()} Praticca · Todos os direitos reservados
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const fileBox: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "24px",
  borderLeft: "4px solid #f59e0b",
};

const fileNameText: React.CSSProperties = {
  margin: "0 0 4px 0",
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e293b",
  wordBreak: "break-all",
};

const expiryText: React.CSSProperties = {
  margin: "0",
  fontSize: "12px",
  color: "#b45309",
};

FileExpiring.defaultProps = {
  fileName: "relatorio-anual.pdf",
  expiresAt: "03/06/2026 às 14h00",
  url: "https://praticca.com.br/download/example",
};

export default FileExpiring;
