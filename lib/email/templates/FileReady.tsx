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

export interface FileReadyProps {
  /** User's display name */
  name?: string;
  /** File name produced by the tool */
  fileName: string;
  /** Human-readable tool name, e.g. "Conversor de PDF" */
  toolName: string;
  /** Direct download URL */
  downloadUrl: string;
  /** Expiry date string, e.g. "03/06/2026" */
  expiresAt?: string;
}

export function FileReady({ name, fileName, toolName, downloadUrl, expiresAt }: FileReadyProps) {
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Seu arquivo "{fileName}" está pronto para download</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoSection}>
            <Text style={baseStyles.logo}>Praticca</Text>
          </Section>

          <Section style={baseStyles.card}>
            <Section style={{ textAlign: "center", marginBottom: "16px" }}>
              <Text style={{ fontSize: "40px", margin: "0" }}>📄</Text>
            </Section>

            <Heading style={baseStyles.h1}>Arquivo pronto!</Heading>

            <Text style={baseStyles.text}>{greeting}</Text>
            <Text style={baseStyles.text}>
              Seu arquivo processado pela ferramenta <strong>{toolName}</strong> está pronto.
              Clique no botão abaixo para baixar.
            </Text>

            <Section style={fileBox}>
              <Text style={fileNameText}>📎 {fileName}</Text>
            </Section>

            <Section style={baseStyles.ctaSection}>
              <Button href={downloadUrl} style={baseStyles.button}>
                Baixar arquivo
              </Button>
            </Section>

            {expiresAt && (
              <Text style={baseStyles.warningText}>
                ⏳ Este link expira em <strong>{expiresAt}</strong>. Faça o download antes disso.
              </Text>
            )}

            <Hr style={baseStyles.hr} />

            <Text style={baseStyles.hint}>
              Problemas para baixar? Acesse{" "}
              <a href="https://praticca.com.br/dashboard" style={baseStyles.link}>
                praticca.com.br/dashboard
              </a>{" "}
              para encontrar seus arquivos recentes.
            </Text>
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
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "24px",
  borderLeft: "4px solid #6366f1",
};

const fileNameText: React.CSSProperties = {
  margin: "0",
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e293b",
  wordBreak: "break-all",
};

FileReady.defaultProps = {
  fileName: "documento-convertido.pdf",
  toolName: "Conversor de PDF",
  downloadUrl: "https://praticca.com.br/download/example",
};

export default FileReady;
