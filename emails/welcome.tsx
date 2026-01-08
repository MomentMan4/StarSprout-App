import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components"

interface WelcomeEmailProps {
  parentName: string
  householdName: string
}

export function WelcomeEmail({ parentName, householdName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to StarSprout - Let's build great habits together!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to StarSprout!</Heading>
          <Text style={text}>Hi {parentName},</Text>
          <Text style={text}>
            Thank you for creating your household "{householdName}" on StarSprout. We're excited to help your family
            build positive habits through playful quests and meaningful insights.
          </Text>
          <Section style={buttonContainer}>
            <Link
              style={button}
              href={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/dashboard`}
            >
              Go to Dashboard
            </Link>
          </Section>
          <Text style={text}>
            StarSprout is built with trust and privacy first. We never store sensitive child data, and all AI features
            use only aggregated, anonymous signals.
          </Text>
          <Text style={footer}>Happy questing! — The StarSprout Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const h1 = {
  color: "#4F46E5",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
}

const buttonContainer = {
  padding: "27px 48px",
}

const button = {
  backgroundColor: "#4F46E5",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
}

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 48px",
  marginTop: "32px",
}
