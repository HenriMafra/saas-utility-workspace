import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { baseStyles } from "./_styles";

export interface SubscriptionCreatedProps {
  /** User's display name */
  name?: string;
  /** Plan name, e.g. "Pro" */
  planName: string;
  /** Billing cycle: "monthly" | "yearly" */
  billingCycle: "monthly" | "yearly";
  /** Formatted price, e.g. "R$ 29,90/mês" */
  price: string;
  /** ISO date when subscription period started */
  startedAt: string;
  /** ISO date of next billing */
  nextBillingDate: string;
  /** URL to the user's dashboard */
  dashboardUrl: string;
}

export function SubscriptionCreated({
  name,
  planName,
  billingCycle,
  price,
  startedAt,
  nextBillingDate,
  dashboardUrl,
}: SubscriptionCreatedProps) {
  const greeting = name ? `Olá, ${name}!` : "Olá!";
  const cycleLabel = billingCycle === "yearly" ? "Anual" : "Mensal";
  const formattedStart = new Date(startedAt).toLocaleDateString("pt-BR");
  const formattedNext = new Date(nextBillingDate).toLocaleDateString("pt-BR");

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindo ao plano {planName} do Praticca 🎉</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoSection}>
            <Text style={baseStyles.logo}>Praticca</Text>
          </Section>

          <Section style={baseStyles.card}>
            <Section style={{ textAlign: "center", marginBottom: "16px" }}>
              <Text style={{ fontSize: "40px", margin: "0" }}>🎉</Text>
            </Section>

            <Heading style={baseStyles.h1}>Assinatura ativada com sucesso!</Heading>

            <Text style={baseStyles.text}>{greeting}</Text>
            <Text style={baseStyles.text}>
              Sua assinatura do plano <strong>{planName}</strong> foi ativada. A partir de
              agora você tem acesso completo a todos os recursos do Praticca.
            </Text>

            <Section style={receiptBox}>
              <Row>
                <Column style={receiptLabel}>Plano</Column>
                <Column style={receiptValue}>{planName}</Column>
              </Row>
              <Row>
                <Column style={receiptLabel}>Ciclo de cobrança</Column>
                <Column style={receiptValue}>{cycleLabel}</Column>
              </Row>
              <Row>
                <Column style={receiptLabel}>Valor</Column>
                <Column style={receiptValue}>{price}</Column>
              </Row>
              <Row>
                <Column style={receiptLabel}>Início da assinatura</Column>
                <Column style={receiptValue}>{formattedStart}</Column>
              </Row>
              <Row>
                <Column style={receiptLabel}>Próxima cobrança</Column>
                <Column style={receiptValue}>{formattedNext}</Column>
              </Row>
            </Section>

            <Section style={baseStyles.ctaSection}>
              <Button href={dashboardUrl} style={baseStyles.button}>
                Explorar recursos
              </Button>
            </Section>

            <Text style={baseStyles.hint}>
              Você pode gerenciar sua assinatura a qualquer momento em{" "}
              <a href="https://praticca.com.br/conta/assinatura" style={baseStyles.link}>
                Minha conta
              </a>
              . Para cancelar, basta clicar em &quot;Cancelar assinatura&quot; — sem burocracia.
            </Text>

            <Hr style={baseStyles.hr} />

            <Text style={baseStyles.hint}>
              Dúvidas?{" "}
              <a href="mailto:suporte@praticca.com.br" style={baseStyles.link}>
                suporte@praticca.com.br
              </a>
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

const receiptBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "24px",
};

const receiptLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  padding: "4px 0",
  width: "50%",
};

const receiptValue: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "13px",
  fontWeight: "600",
  padding: "4px 0",
  textAlign: "right",
};

SubscriptionCreated.defaultProps = {
  planName: "Pro",
  billingCycle: "monthly" as const,
  price: "R$ 29,90/mês",
  startedAt: new Date().toISOString(),
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  dashboardUrl: "https://praticca.com.br/dashboard",
};

export default SubscriptionCreated;
