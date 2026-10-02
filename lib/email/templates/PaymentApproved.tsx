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

export interface PaymentApprovedProps {
  /** User's display name */
  name?: string;
  /** Plan name, e.g. "Pro" */
  planName: string;
  /** Formatted amount, e.g. "R$ 29,90" */
  amount: string;
  /** ISO date string of the payment */
  paidAt: string;
  /** Next billing date string, e.g. "01/07/2026" */
  nextBillingDate?: string;
  /** URL to the user's dashboard/billing page */
  dashboardUrl: string;
}

export function PaymentApproved({
  name,
  planName,
  amount,
  paidAt,
  nextBillingDate,
  dashboardUrl,
}: PaymentApprovedProps) {
  const greeting = name ? `Olá, ${name}!` : "Olá!";
  const formattedDate = new Date(paidAt).toLocaleDateString("pt-BR");

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Pagamento confirmado — seu plano {planName} está ativo</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.logoSection}>
            <Text style={baseStyles.logo}>Praticca</Text>
          </Section>

          <Section style={baseStyles.card}>
            <Section style={{ textAlign: "center", marginBottom: "24px" }}>
              <Text style={{ fontSize: "40px", margin: "0" }}>✅</Text>
            </Section>

            <Heading style={baseStyles.h1}>Pagamento aprovado!</Heading>

            <Text style={baseStyles.text}>{greeting}</Text>
            <Text style={baseStyles.text}>
              Seu pagamento foi processado com sucesso e seu plano <strong>{planName}</strong>{" "}
              está ativo. Aproveite todos os recursos disponíveis!
            </Text>

            {/* Receipt summary */}
            <Section style={receiptBox}>
              <Row>
                <Column style={receiptLabel}>Plano</Column>
                <Column style={receiptValue}>{planName}</Column>
              </Row>
              <Row>
                <Column style={receiptLabel}>Valor cobrado</Column>
                <Column style={receiptValue}>{amount}</Column>
              </Row>
              <Row>
                <Column style={receiptLabel}>Data do pagamento</Column>
                <Column style={receiptValue}>{formattedDate}</Column>
              </Row>
              {nextBillingDate && (
                <Row>
                  <Column style={receiptLabel}>Próxima cobrança</Column>
                  <Column style={receiptValue}>{nextBillingDate}</Column>
                </Row>
              )}
            </Section>

            <Section style={baseStyles.ctaSection}>
              <Button href={dashboardUrl} style={baseStyles.button}>
                Acessar minha conta
              </Button>
            </Section>

            <Text style={baseStyles.hint}>
              Dúvidas sobre sua fatura? Entre em contato pelo{" "}
              <a href="mailto:suporte@praticca.com.br" style={baseStyles.link}>
                suporte@praticca.com.br
              </a>
              .
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

PaymentApproved.defaultProps = {
  planName: "Pro",
  amount: "R$ 29,90",
  paidAt: new Date().toISOString(),
  dashboardUrl: "https://praticca.com.br/dashboard",
};

export default PaymentApproved;
