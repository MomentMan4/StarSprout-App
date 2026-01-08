import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Hr } from "@react-email/components"

interface WeeklySummaryEmailProps {
  parentName: string
  weekStart: string
  weekEnd: string
  questsCompleted: number
  badgesEarned: number
  childHighlights: Array<{ name: string; quests: number; streak: number }>
  strengths: string[]
  opportunities: string[]
  dashboardLink: string
}

export function WeeklySummaryEmail({
  parentName,
  weekStart,
  weekEnd,
  questsCompleted,
  badgesEarned,
  childHighlights,
  strengths,
  opportunities,
  dashboardLink,
}: WeeklySummaryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your StarSprout weekly summary is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Weekly Summary</Heading>
          <Text style={subtitle}>
            {weekStart} – {weekEnd}
          </Text>
          <Text style={text}>Hi {parentName},</Text>
          <Text style={text}>Here's how your household did this week:</Text>

          <Section style={statsBox}>
            <Text style={statText}>
              <strong>{questsCompleted}</strong> quests completed
            </Text>
            <Text style={statText}>
              <strong>{badgesEarned}</strong> badges earned
            </Text>
          </Section>

          {childHighlights.length > 0 && (
            <>
              <Heading style={h2}>Individual Highlights</Heading>
              {childHighlights.map((child) => (
                <Text key={child.name} style={text}>
                  <strong>{child.name}:</strong> {child.quests} quests completed, {child.streak}-day streak
                </Text>
              ))}
            </>
          )}

          {strengths.length > 0 && (
            <>
              <Hr style={hr} />
              <Heading style={h2}>Strengths This Week</Heading>
              {strengths.map((strength, i) => (
                <Text key={i} style={bulletText}>
                  • {strength}
                </Text>
              ))}
            </>
          )}

          {opportunities.length > 0 && (
            <>
              <Hr style={hr} />
              <Heading style={h2}>Opportunities</Heading>
              {opportunities.map((opp, i) => (
                <Text key={i} style={bulletText}>
                  • {opp}
                </Text>
              ))}
            </>
          )}

          <Section style={buttonContainer}>
            <Link style={button} href={dashboardLink}>
              View Full Dashboard
            </Link>
          </Section>

          <Text style={footer}>
            These insights are generated from quest patterns and designed to support, not surveil. You can disable
            weekly emails anytime in Settings.
          </Text>
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
  fontSize: "28px",
  fontWeight: "bold",
  margin: "32px 0 0 0",
  padding: "0 48px",
}

const subtitle = {
  color: "#8898aa",
  fontSize: "14px",
  margin: "8px 0 24px 0",
  padding: "0 48px",
}

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "600",
  margin: "24px 0 16px 0",
  padding: "0 48px",
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
  marginBottom: "16px",
}

const bulletText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
  marginBottom: "8px",
}

const statsBox = {
  backgroundColor: "#F3F4F6",
  borderRadius: "8px",
  padding: "24px 48px",
  margin: "24px 48px",
}

const statText = {
  color: "#333",
  fontSize: "18px",
  lineHeight: "28px",
  margin: "8px 0",
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 48px",
}

const buttonContainer = {
  padding: "32px 48px",
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
  lineHeight: "22px",
  padding: "0 48px",
  marginTop: "32px",
}
