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

export interface OnboardingD0Props {
  /** User's display name */
  name?: string;
  /** URL to the tools listing */
  toolsUrl: string;
  /** URL to tour or getting started page */
  tourUrl?: string;
}

export function OnboardingD0({ name, toolsUrl, tourUrl }: OnboardingD0Props) {
  const firstName = name ? name.split(" ")[0] : null;
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindo ao Praticca — suas ferramentas estão prontas para usar</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoSection}>
            <Text style={baseStyles.logo}>Praticca</Text>
          </Section>

          <Section style={baseStyles.card}>
            <Heading style={baseStyles.h1}>Bem-vindo ao Praticca! 👋</Heading>

            <Text style={baseStyles.text}>{greeting}</Text>
            <Text style={baseStyles.text}>
              Estamos felizes em tê-lo(a) aqui. O Praticca reúne dezenas de ferramentas online
              para facilitar seu trabalho diário — conversão de arquivos, compressão de imagens,
              geração de documentos e muito mais.
            </Text>

            <Section style={stepsBox}>
              <Text style={stepsTitle}>Por onde começar:</Text>

              <Section style={stepRow}>
                <Text style={stepNumber}>1</Text>
                <Text style={stepText}>
                  <strong>Explore as ferramentas</strong> — temos mais de 30 utilitários prontos
                  para usar, sem instalação.
                </Text>
              </Section>

              <Section style={stepRow}>
                <Text style={stepNumber}>2</Text>
                <Text style={stepText}>
                  <strong>Faça upload do seu arquivo</strong> — arraste ou selecione. O
                  processamento é instantâneo e seguro.
                </Text>
              </Section>

              <Section style={stepRow}>
                <Text style={stepNumber}>3</Text>
                <Text style={stepText}>
                  <strong>Baixe o resultado</strong> — pronto! Seu arquivo processado fica
                  disponível por 24 horas.
                </Text>
              </Section>
            </Section>

            <Section style={baseStyles.ctaSection}>
              <Button href={toolsUrl} style={baseStyles.button}>
                Começar a usar
              </Button>
            </Section>

            {tourUrl && (
              <Text style={{ ...baseStyles.hint, textAlign: "center" }}>
                Prefere um tour guiado?{" "}
                <a href={tourUrl} style={baseStyles.link}>
                  Veja como funciona
                </a>
                .
              </Text>
            )}

            <Hr style={baseStyles.hr} />

            <Text style={baseStyles.text}>
              Se tiver qualquer dúvida, nossa equipe está à disposição em{" "}
              <a href="mailto:suporte@praticca.com.br" style={baseStyles.link}>
                suporte@praticca.com.br
              </a>
              .
            </Text>

            <Text style={{ ...baseStyles.hint, marginTop: "4px" }}>
              Att,
              <br />
              Equipe Praticca
            </Text>
          </Section>

          <Section style={baseStyles.footer}>
            <Text style={baseStyles.footerText}>
              Você recebeu este e-mail porque criou uma conta no Praticca.
              <br />© {new Date().getFullYear()} Praticca · Todos os direitos reservados
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const stepsBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "24px",
};

const stepsTitle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: "13px",
  fontWeight: "700",
  color: "#0f172a",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const stepRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "10px",
};

const stepNumber: React.CSSProperties = {
  display: "inline-block",
  width: "24px",
  height: "24px",
  lineHeight: "24px",
  textAlign: "center",
  backgroundColor: "#6366f1",
  color: "#ffffff",
  borderRadius: "50%",
  fontSize: "12px",
  fontWeight: "700",
  flexShrink: 0,
  margin: "0 10px 0 0",
};

const stepText: React.CSSProperties = {
  margin: "0",
  fontSize: "14px",
  color: "#334155",
  lineHeight: "1.5",
};

OnboardingD0.defaultProps = {
  toolsUrl: "https://praticca.com.br/ferramentas",
};

export default OnboardingD0;
