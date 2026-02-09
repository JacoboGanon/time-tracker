import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface VerifyEmailProps {
  url: string;
}

export default function VerifyEmail({ url }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to start using Time Tracker</Preview>
      <Tailwind>
        <Body className="m-0 bg-[#0c0a09] p-0 font-sans">
          <Container className="mx-auto max-w-[480px] px-4 py-10">
            {/* Header */}
            <Section className="mb-8 text-center">
              <Text className="m-0 text-xs font-semibold uppercase tracking-[0.25em] text-[#a8a29e]">
                Time Tracker
              </Text>
              <Hr className="mx-auto mt-4 w-10 border-[#f59e0b]/40" />
            </Section>

            {/* Card */}
            <Section className="rounded-lg border border-solid border-[#292524] bg-[#1c1917] px-10 py-10">
              <Heading className="m-0 mb-2 text-center text-xl font-medium text-[#f5f5f4]">
                Verify your email
              </Heading>
              <Text className="mb-8 text-center text-sm leading-6 text-[#78716c]">
                Thanks for signing up. Please confirm your email address by
                clicking the button below.
              </Text>

              <Hr className="mb-8 border-[#292524]" />

              {/* CTA */}
              <Section className="mb-8 text-center">
                <Button
                  href={url}
                  className="rounded bg-[#f59e0b] px-8 py-3 text-center text-sm font-semibold text-[#0c0a09] no-underline"
                >
                  Verify Email Address
                </Button>
              </Section>

              {/* Fallback */}
              <Text className="m-0 text-center text-xs leading-5 text-[#57534e]">
                If the button doesn&apos;t work, copy and paste this link into
                your browser:
              </Text>
              <Text className="m-0 mt-1 text-center">
                <Link
                  href={url}
                  className="break-all text-xs text-[#f59e0b]/70 underline"
                >
                  {url}
                </Link>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="mt-8 text-center">
              <Text className="m-0 text-xs leading-5 text-[#44403c]">
                This link expires in 1 hour. If you didn&apos;t create an
                account, you can safely ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
