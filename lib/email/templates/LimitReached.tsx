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

export interface LimitReachedProps {
  /** User's display name */
  name?: string;
  /** Current plan name, e.g. "Gratuito" */
  planName: string;
  /** When the limit resets, e.g. "1º de julho de 2026" */
  resetsAt?: string;
  /** URL to the upgrade/plans page */
  upgradeUrl: string;
}

export function LimitReached({ name, planName, resetsAt, upgradeUrl }: LimitReachedProps) {
  const greeting = name ? `Olá, ${name}!` : "Olá!";

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Você atingiu o limite do plano {planName} no Praticca</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoSection}>
            <Text style={baseStyles.logo}>Praticca</Text>
          </Section>

          <Section style={baseStyles.card}>
            <Section style={{ textAlign: "center", marginBottom: "16px" }}>
              <Text style={{ fontSize: "40px", margin: "0" }}>🚦</Text>
            </Section>

            <Heading style={baseStyles.h1}>Limite do plano atingido</Heading>

            <Text style={baseStyles.text}>{greeting}</Text>
            <Text style={baseStyles.text}>
              Você utilizou todos os créditos disponíveis no plano{" "}
              <strong>{planName}</strong> este mês.
            </Text>

            {resetsAt ? (
              <Text style={baseStyles.text}>
                Seus créditos serão renovados em <strong>{resetsAt}</strong>. Se precisar
                continuar antes disso, faça um upgrade para um plano superior.
              </Text>
            ) : (
              <Text style={baseStyles.text}>
                Faça um upgrade para continuar usando as ferramentas do Praticca sem
                interrupções.
              </Text>
            )}

            <Section style={upgradeBox}>
              <Text style={upgradeTitle}>Veja o que você ganha no plano Pro:</Text>
              <Text style={upgradeItem}>✓ Créditos mensais ampliados</Text>
              <Text style={upgradeItem}>✓ Processamento prioritário</Text>
              <Text style={upgradeItem}>✓ Arquivos maiores e mais formatos</Text>
              <Text style={upgradeItem}>✓ Histórico de 30 dias</Text>
            </Section>

            <Section style={baseStyles.ctaSection}>
              <Button href={upgradeUrl} style={baseStyles.button}>
                Fazer upgrade agora
              </Button>
            </Section>

            <Text style={baseStyles.hint}>
              Não quer fazer upgrade? Seus créditos são renovados automaticamente no início de
              cada mês.
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

const upgradeBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "24px",
  borderLeft: "4px solid #22c55e",
};

const upgradeTitle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "13px",
  fontWeight: "600",
  color: "#15803d",
};

const upgradeItem: React.CSSProperties = {
  margin: "2px 0",
  fontSize: "13px",
  color: "#166534",
};

LimitReached.defaultProps = {
  planName: "Gratuito",
  upgradeUrl: "https://praticca.com.br/planos",
};

export default LimitReached;
