import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface NotificationEmailProps {
  employeeName?: string;
  title: string;
  content: string;
  link?: string;
}

export const NotificationEmail = ({
  employeeName = "bạn",
  title,
  content,
  link,
}: NotificationEmailProps) => {
  const previewText = title;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans my-auto mx-auto pt-[20px] pb-[40px]">
          <Container className="bg-white border-gray-200 border border-solid rounded-lg p-[40px] shadow-sm max-w-[600px] mx-auto mt-[40px]">
            <Heading className="text-gray-900 text-2xl font-bold mb-4 p-0">
              {title}
            </Heading>
            <Text className="text-gray-700 text-[15px] leading-6 mb-[16px]">
              Xin chào {employeeName},
            </Text>
            
            <Section className="mb-[24px]">
              {/* If content contains HTML tags, render it dangerously, else render as text */}
              {/<[a-z][\s\S]*>/i.test(content) ? (
                <div 
                  className="text-gray-700 text-[15px] leading-6"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <Text className="text-gray-700 text-[15px] leading-6 whitespace-pre-wrap">
                  {content}
                </Text>
              )}
            </Section>

            {link && (
              <Section className="text-center mt-[32px] mb-[32px]">
                <Link
                  className="bg-blue-600 rounded-md text-white text-[14px] font-semibold no-underline text-center px-[24px] py-[12px] hover:bg-blue-700 transition"
                  href={link.startsWith('http') ? link : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${link.startsWith('/') ? '' : '/'}${link}`}
                >
                  Xem chi tiết
                </Link>
              </Section>
            )}

            <Section className="border-t border-solid border-gray-200 mt-[32px] pt-[24px]">
              <Text className="text-gray-500 text-[13px] leading-5">
                Đây là email tự động từ hệ thống Digital HRM. Vui lòng không trả lời email này.
              </Text>
              <Text className="text-gray-500 text-[13px] leading-5 m-0 mt-1">
                &copy; {new Date().getFullYear()} Digital HRM.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default NotificationEmail;
